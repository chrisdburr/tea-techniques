#!/bin/bash
set -euo pipefail

# Batch runner for the enhance-dataset agent. Iterates through techniques
# ordered by quality completeness score (worst first), launching an interactive
# Claude session for each one so the human can approve/reject proposals.
#
# Usage:
#   ./scripts/enhance-batch.sh                    # All pending techniques
#   ./scripts/enhance-batch.sh --range 0-9        # First 10 (worst scores)
#   ./scripts/enhance-batch.sh --range 80-        # From index 80 to end
#   ./scripts/enhance-batch.sh --range -20        # First 20
#   ./scripts/enhance-batch.sh --dry-run           # Show work queue only
#   ./scripts/enhance-batch.sh --dry-run --range 0-4
#   ./scripts/enhance-batch.sh --focus related_techniques --dry-run --range 0-4
#   ./scripts/enhance-batch.sh --focus tags --range 0-9

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
QUALITY_REPORT="$PROJECT_ROOT/reports/quality-report.json"
ENHANCEMENT_LOG="$PROJECT_ROOT/.enhancement-log.json"

RANGE=""
DRY_RUN=false
FOCUS=""
VALID_FOCUS_AREAS="related_techniques tags resources descriptions"

# ---------- Argument parsing ----------

usage() {
  cat <<'EOF'
Usage: scripts/enhance-batch.sh [OPTIONS]

Batch runner for dataset enhancement. Processes techniques ordered by quality
completeness score (worst first), launching an interactive Claude session for
each one with the enhance-dataset agent.

Options:
  --range START-END   Technique index range (0-indexed, worst-score-first)
                      Examples: 0-9   (indices 0 through 9)
                               80-   (index 80 to end)
                               -20   (indices 0 through 19)
  --focus AREA        Focus on a single enhancement area per pass. Techniques
                      are re-ordered by area-specific priority and skip logic
                      uses per-focus timestamps instead of last_reviewed.
                      Valid areas: related_techniques, tags, resources, descriptions
  --dry-run           Show work queue without launching sessions
  --help              Show this help message

Examples:
  ./scripts/enhance-batch.sh --dry-run --range 0-4   # Preview 5 worst techniques
  ./scripts/enhance-batch.sh --range 0-0              # Process single worst technique
  ./scripts/enhance-batch.sh                          # Process all pending techniques
  ./scripts/enhance-batch.sh --focus related_techniques --dry-run --range 0-4
  ./scripts/enhance-batch.sh --focus tags --range 0-9
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --range)
      RANGE="$2"
      shift 2
      ;;
    --focus)
      FOCUS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for usage."
      exit 1
      ;;
  esac
done

# ---------- Validation ----------

if [[ ! -f "$QUALITY_REPORT" ]]; then
  echo "Error: Quality report not found at $QUALITY_REPORT"
  echo "Run: pnpm generate-report"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed."
  exit 1
fi

if ! command -v claude &>/dev/null; then
  echo "Error: claude CLI is required but not found in PATH."
  exit 1
fi

# Validate --focus value
if [[ -n "$FOCUS" ]]; then
  valid=false
  for area in $VALID_FOCUS_AREAS; do
    if [[ "$FOCUS" == "$area" ]]; then
      valid=true
      break
    fi
  done
  if [[ "$valid" != true ]]; then
    echo "Error: Invalid focus area '$FOCUS'."
    echo "Valid areas: $VALID_FOCUS_AREAS"
    exit 1
  fi
fi

# ---------- Staleness warning ----------

if [[ -f "$ENHANCEMENT_LOG" ]]; then
  log_updated=$(jq -r '.updated // empty' "$ENHANCEMENT_LOG" 2>/dev/null)
  report_generated=$(jq -r '.generated_at // empty' "$QUALITY_REPORT" 2>/dev/null)

  if [[ -n "$log_updated" && -n "$report_generated" ]]; then
    # Compare timestamps — warn if log is newer than report
    log_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${log_updated%%.*}" +%s 2>/dev/null || echo 0)
    report_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${report_generated%%.*}" +%s 2>/dev/null || echo 0)

    if [[ "$log_epoch" -gt "$report_epoch" ]]; then
      echo "⚠  Warning: Enhancement log is newer than quality report."
      echo "   Log updated:     $log_updated"
      echo "   Report generated: $report_generated"
      echo "   Consider running: pnpm generate-report"
      echo ""
    fi
  fi
fi

# ---------- Build work queue ----------

if [[ -n "$FOCUS" ]]; then
  # Focus-specific queue ordering by area
  TECHNIQUES_FILE="$PROJECT_ROOT/public/data/techniques.json"

  case "$FOCUS" in
    related_techniques)
      # Sort by delta from target of 3 (|count - 3|, descending — most bloated/sparse first)
      # Requires cross-referencing techniques.json for raw counts
      ALL_QUEUE=$(jq -r --slurpfile tech "$TECHNIQUES_FILE" '
        ($tech[0] | map({(.slug): (.related_techniques // [] | length)}) | add) as $counts
        | [.completeness_scores[] | {
            slug: .slug,
            score: .score,
            delta: (($counts[.slug] // 0) - 3 | if . < 0 then -. else . end)
          }]
        | sort_by(-.delta)
        | .[]
        | "\(.slug)\t\(.score)"
      ' "$QUALITY_REPORT")
      ;;
    tags)
      # Sort by tag_coverage breakdown score ascending (worst tag coverage first)
      ALL_QUEUE=$(jq -r '
        [.completeness_scores[]] | sort_by(.breakdown.tag_coverage) | .[] | "\(.slug)\t\(.score)"
      ' "$QUALITY_REPORT")
      ;;
    resources)
      # Sort by resources breakdown score ascending (worst resource coverage first)
      ALL_QUEUE=$(jq -r '
        [.completeness_scores[]] | sort_by(.breakdown.resources) | .[] | "\(.slug)\t\(.score)"
      ' "$QUALITY_REPORT")
      ;;
    descriptions)
      # Sort by description_quality breakdown score ascending (worst descriptions first)
      ALL_QUEUE=$(jq -r '
        [.completeness_scores[]] | sort_by(.breakdown.description_quality) | .[] | "\(.slug)\t\(.score)"
      ' "$QUALITY_REPORT")
      ;;
  esac
else
  # Default: sorted ascending by overall completeness score (worst first)
  ALL_QUEUE=$(jq -r '.completeness_scores[] | "\(.slug)\t\(.score)"' "$QUALITY_REPORT")
fi

TOTAL_TECHNIQUES=$(echo "$ALL_QUEUE" | wc -l | tr -d ' ')

# Build set of already-reviewed slugs from enhancement log
REVIEWED_SLUGS=""
if [[ -f "$ENHANCEMENT_LOG" ]]; then
  if [[ -n "$FOCUS" ]]; then
    # Focus mode: check per-focus timestamps instead of last_reviewed
    REVIEWED_SLUGS=$(jq -r --arg focus "$FOCUS" \
      '.technique_timestamps | to_entries[] | select(.value.focus_reviews[$focus] != null) | .key' \
      "$ENHANCEMENT_LOG" 2>/dev/null || true)
  else
    REVIEWED_SLUGS=$(jq -r '.technique_timestamps | keys[]' "$ENHANCEMENT_LOG" 2>/dev/null || true)
  fi
fi

# Filter out reviewed techniques
PENDING_QUEUE=""
PENDING_COUNT=0
SKIPPED_COUNT=0
while IFS=$'\t' read -r slug score; do
  if echo "$REVIEWED_SLUGS" | grep -qx "$slug" 2>/dev/null; then
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
  else
    if [[ -z "$PENDING_QUEUE" ]]; then
      PENDING_QUEUE="${slug}	${score}"
    else
      PENDING_QUEUE="${PENDING_QUEUE}
${slug}	${score}"
    fi
    PENDING_COUNT=$((PENDING_COUNT + 1))
  fi
done <<< "$ALL_QUEUE"

if [[ "$PENDING_COUNT" -eq 0 ]]; then
  echo "All $TOTAL_TECHNIQUES techniques have been reviewed. Nothing to do."
  exit 0
fi

# ---------- Apply range ----------

RANGE_START=0
RANGE_END=$((PENDING_COUNT - 1))

if [[ -n "$RANGE" ]]; then
  if [[ "$RANGE" =~ ^([0-9]+)-([0-9]+)$ ]]; then
    # e.g. 5-15
    RANGE_START="${BASH_REMATCH[1]}"
    RANGE_END="${BASH_REMATCH[2]}"
  elif [[ "$RANGE" =~ ^([0-9]+)-$ ]]; then
    # e.g. 80-
    RANGE_START="${BASH_REMATCH[1]}"
  elif [[ "$RANGE" =~ ^-([0-9]+)$ ]]; then
    # e.g. -20
    RANGE_END=$(( ${BASH_REMATCH[1]} - 1 ))
  else
    echo "Error: Invalid range format '$RANGE'. Use: START-END, START-, or -END"
    exit 1
  fi
fi

# Clamp range to valid bounds
if [[ "$RANGE_START" -ge "$PENDING_COUNT" ]]; then
  echo "Error: Range start ($RANGE_START) exceeds pending count ($PENDING_COUNT)."
  exit 1
fi
if [[ "$RANGE_END" -ge "$PENDING_COUNT" ]]; then
  RANGE_END=$((PENDING_COUNT - 1))
fi
if [[ "$RANGE_START" -gt "$RANGE_END" ]]; then
  echo "Error: Range start ($RANGE_START) > range end ($RANGE_END)."
  exit 1
fi

# Slice the pending queue to the range
WORK_SLUGS=()
WORK_SCORES=()
idx=0
while IFS=$'\t' read -r slug score; do
  if [[ "$idx" -ge "$RANGE_START" && "$idx" -le "$RANGE_END" ]]; then
    WORK_SLUGS+=("$slug")
    WORK_SCORES+=("$score")
  fi
  idx=$((idx + 1))
done <<< "$PENDING_QUEUE"

WORK_COUNT=${#WORK_SLUGS[@]}

# ---------- Display work queue ----------

echo "========================================="
echo "Enhancement Batch Runner"
echo "========================================="
echo ""
if [[ -n "$FOCUS" ]]; then
  echo "Focus area:         $FOCUS"
fi
echo "Total techniques:   $TOTAL_TECHNIQUES"
echo "Already reviewed:   $SKIPPED_COUNT"
echo "Pending:            $PENDING_COUNT"
echo "Selected (range):   $WORK_COUNT  [${RANGE_START}-${RANGE_END}]"
echo ""
echo "Work Queue:"
echo "-------------------------------------------"
printf "  %-4s %-50s %s\n" "#" "Technique" "Score"
echo "-------------------------------------------"
for i in "${!WORK_SLUGS[@]}"; do
  printf "  %-4s %-50s %s\n" "$((i + 1))" "${WORK_SLUGS[$i]}" "${WORK_SCORES[$i]}"
done
echo "-------------------------------------------"
echo ""

if [[ "$DRY_RUN" == true ]]; then
  echo "(Dry run — no sessions will be launched)"
  exit 0
fi

# ---------- Main loop ----------

SUCCEEDED=0
FAILED=0
FAILED_SLUGS=()

for i in "${!WORK_SLUGS[@]}"; do
  slug="${WORK_SLUGS[$i]}"
  score="${WORK_SCORES[$i]}"
  num=$((i + 1))

  echo ""
  echo "========================================="
  echo "Technique $num/$WORK_COUNT: $slug (score: $score)"
  echo "========================================="
  echo ""

  # Launch non-interactive Claude session with enhance-dataset agent
  # -p (print mode): process prompt and exit, enabling batch loop to advance
  # --output-format stream-json: stream progress instead of buffering until exit
  # Auto-approve mode: skip AskUserQuestion (incompatible with -p), auto-apply
  # consensus proposals (2/3+), auto-reject non-consensus (1/3)
  # unset CLAUDECODE: required for nested CLI invocation
  SCOPE_STR="--technique $slug"
  if [[ -n "$FOCUS" ]]; then
    SCOPE_STR="--technique $slug --focus $FOCUS"
  fi

  set +e
  (
    unset CLAUDECODE
    cd "$PROJECT_ROOT"
    claude --agent enhance-dataset \
      --model sonnet \
      -p "Scope: $SCOPE_STR. Begin the enhancement workflow for this single technique. IMPORTANT: This is an automated batch run. Do NOT use AskUserQuestion. Instead, auto-approve all proposals with 2/3+ consensus and auto-reject proposals with only 1/3 consensus. Apply approved changes, update the enhancement log, and run validation. Report results in your final output." \
      --allowedTools "Read,Write,Edit,Grep,Glob,Bash,Task,Skill"
  )
  exit_code=$?
  set -e

  if [[ $exit_code -eq 0 ]]; then
    SUCCEEDED=$((SUCCEEDED + 1))
    echo ""
    echo "✓ Completed: $slug"
  else
    FAILED=$((FAILED + 1))
    FAILED_SLUGS+=("$slug")
    echo ""
    echo "✗ Failed: $slug (exit code: $exit_code)"

    # If not the last technique, ask whether to continue
    if [[ $num -lt $WORK_COUNT ]]; then
      echo ""
      read -rp "Continue to next technique? [Y/n] " answer
      case "${answer:-Y}" in
        [Nn]*)
          echo "Stopping batch."
          break
          ;;
      esac
    fi
  fi
done

# ---------- Summary ----------

echo ""
echo "========================================="
echo "Batch Summary"
echo "========================================="
echo "Processed:   $((SUCCEEDED + FAILED)) / $WORK_COUNT"
echo "Succeeded:   $SUCCEEDED"
echo "Failed:      $FAILED"

if [[ $FAILED -gt 0 ]]; then
  echo ""
  echo "Failed techniques:"
  for slug in "${FAILED_SLUGS[@]}"; do
    echo "  - $slug"
  done
fi

echo ""
echo "Re-run to continue with remaining techniques (reviewed ones are auto-skipped)."
