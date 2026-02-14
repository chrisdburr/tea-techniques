#!/bin/bash
set -euo pipefail

# Orchestrator for generating sample assurance claims across all techniques.
# Runs the claim-generator agent in parallel batches with resumability.
# Includes a self-improving review loop that evaluates claim quality every N
# techniques, promotes best claims as exemplars, and flags weak ones for regen.
#
# Usage:
#   ./scripts/generate-claims.sh              # Default: 3 parallel
#   ./scripts/generate-claims.sh --parallel 5 # Custom parallelism
#   ./scripts/generate-claims.sh --limit 3     # Process at most 3 techniques
#   ./scripts/generate-claims.sh --review-every 10  # Review cycle interval (0 to disable)
#   ./scripts/generate-claims.sh --dry-run    # Show what would run

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TECHNIQUES_DIR="$PROJECT_ROOT/public/data/techniques"
CLAIMS_DIR="$PROJECT_ROOT/data/claims"
PROGRESS_FILE="$CLAIMS_DIR/.progress.json"
EXEMPLARS_FILE="$CLAIMS_DIR/.exemplars.json"
REVIEWS_DIR="$CLAIMS_DIR/.reviews"

PARALLEL=3
DRY_RUN=false
TIMEOUT=180
REVIEW_TIMEOUT=300
LIMIT=0  # 0 = no limit
REVIEW_EVERY=10  # 0 = disable review loop

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --parallel)
      PARALLEL="$2"
      shift 2
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --review-every)
      REVIEW_EVERY="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--parallel N] [--limit N] [--review-every N] [--dry-run]"
      exit 1
      ;;
  esac
done

# Ensure claims directory exists
mkdir -p "$CLAIMS_DIR"

# Initialize progress file if missing
if [[ ! -f "$PROGRESS_FILE" ]]; then
  echo '{"completed":[],"failed":[]}' > "$PROGRESS_FILE"
fi

# Validate a claims JSON file: must be valid JSON with ≥3 claims
validate_claims() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return 1
  fi
  local count
  count=$(jq '.claims | length' "$file" 2>/dev/null) || return 1
  [[ "$count" -ge 3 ]]
}

# Run the claim-reviewer agent on a batch of slugs
run_review_cycle() {
  local review_batch_num="$1"
  shift
  local slugs=("$@")
  local slug_list
  slug_list=$(IFS=,; echo "${slugs[*]}")

  echo ""
  echo "========================================="
  echo "Review cycle $review_batch_num: ${#slugs[@]} techniques"
  echo "========================================="

  mkdir -p "$REVIEWS_DIR"

  local review_log="$REVIEWS_DIR/batch-${review_batch_num}.log"

  (
    unset CLAUDECODE
    timeout "$REVIEW_TIMEOUT" claude --agent claim-reviewer \
      -p "Review claims batch $review_batch_num: $slug_list" \
      --max-turns 15 --allowedTools Read,Write,Glob
  ) > "$review_log" 2>&1

  local exit_code=$?

  if [[ $exit_code -ne 0 ]]; then
    echo "  Review cycle FAILED (exit code $exit_code, see .reviews/batch-${review_batch_num}.log)"
    return 1
  fi

  # Check if review report was written
  if [[ -f "$REVIEWS_DIR/batch-${review_batch_num}.json" ]]; then
    echo "  Review report: .reviews/batch-${review_batch_num}.json"
  fi

  # Check if exemplars were updated
  if [[ -f "$EXEMPLARS_FILE" ]]; then
    local version
    version=$(jq '.version' "$EXEMPLARS_FILE" 2>/dev/null || echo "?")
    local exemplar_count
    exemplar_count=$(jq '.exemplars | length' "$EXEMPLARS_FILE" 2>/dev/null || echo "?")
    echo "  Exemplars: $exemplar_count (version $version)"
  fi

  # Check if any techniques were flagged for regen
  if [[ -f "$REVIEWS_DIR/batch-${review_batch_num}.json" ]]; then
    local regen_slugs
    regen_slugs=$(jq -r '.flagged_for_regen[]?.slug // empty' "$REVIEWS_DIR/batch-${review_batch_num}.json" 2>/dev/null)
    if [[ -n "$regen_slugs" ]]; then
      echo "  Flagged for regeneration:"
      while IFS= read -r regen_slug; do
        local claims_file="$CLAIMS_DIR/$regen_slug.json"
        if [[ -f "$claims_file" ]]; then
          mv "$claims_file" "$claims_file.regen"
          echo "    - $regen_slug (moved to .regen)"
        fi
      done <<< "$regen_slugs"
    fi
  fi

  rm -f "$review_log"
  echo "  Review cycle $review_batch_num complete"
  echo ""
  return 0
}

# Discover all technique slugs
ALL_SLUGS=()
for f in "$TECHNIQUES_DIR"/*.json; do
  slug="$(basename "$f" .json)"
  ALL_SLUGS+=("$slug")
done

TOTAL=${#ALL_SLUGS[@]}
echo "Found $TOTAL techniques in $TECHNIQUES_DIR"

# Determine which slugs still need processing
PENDING_SLUGS=()
COMPLETED_COUNT=0
for slug in "${ALL_SLUGS[@]}"; do
  claims_file="$CLAIMS_DIR/$slug.json"
  if validate_claims "$claims_file"; then
    COMPLETED_COUNT=$((COMPLETED_COUNT + 1))
  else
    # If there's an invalid file, rename it so we retry
    if [[ -f "$claims_file" ]]; then
      mv "$claims_file" "$claims_file.bad"
      echo "Renamed invalid output: $slug.json -> $slug.json.bad"
    fi
    PENDING_SLUGS+=("$slug")
  fi
done

PENDING=${#PENDING_SLUGS[@]}

# Apply limit if set
if [[ "$LIMIT" -gt 0 && "$LIMIT" -lt "$PENDING" ]]; then
  PENDING_SLUGS=("${PENDING_SLUGS[@]:0:$LIMIT}")
  PENDING=$LIMIT
fi

echo "Already completed: $COMPLETED_COUNT"
echo "Remaining: $PENDING"
echo "Parallelism: $PARALLEL"
if [[ "$LIMIT" -gt 0 ]]; then
  echo "Limit: $LIMIT"
fi
if [[ "$REVIEW_EVERY" -gt 0 ]]; then
  echo "Review every: $REVIEW_EVERY techniques"
else
  echo "Review: disabled"
fi
echo ""

if [[ "$PENDING" -eq 0 ]]; then
  echo "All techniques have valid claims. Nothing to do."
  exit 0
fi

if [[ "$DRY_RUN" == true ]]; then
  echo "--- Dry run: would process these $PENDING techniques ---"
  for slug in "${PENDING_SLUGS[@]}"; do
    echo "  $slug"
  done
  if [[ "$REVIEW_EVERY" -gt 0 ]]; then
    review_cycles=$(( (PENDING + REVIEW_EVERY - 1) / REVIEW_EVERY ))
    echo ""
    echo "Would trigger $review_cycles review cycle(s) (every $REVIEW_EVERY techniques)"
  fi
  exit 0
fi

# Process techniques in parallel batches
SUCCEEDED=0
FAILED=0
FAILED_SLUGS=()

# Review loop tracking
REVIEW_COUNTER=0
REVIEW_BATCH_NUM=0
REVIEW_SLUG_BUFFER=()

# Determine starting review batch number from existing reviews
if [[ -d "$REVIEWS_DIR" ]]; then
  existing_reviews=$(ls "$REVIEWS_DIR"/batch-*.json 2>/dev/null | wc -l | tr -d ' ')
  REVIEW_BATCH_NUM=$existing_reviews
fi

process_technique() {
  local slug="$1"
  local log_file="$CLAIMS_DIR/$slug.log"
  local claims_file="$CLAIMS_DIR/$slug.json"

  echo "  Starting: $slug"

  # Run the claim-generator agent
  (
    unset CLAUDECODE
    timeout "$TIMEOUT" claude --agent claim-generator \
      -p "Generate sample claims for technique: $slug" \
      --max-turns 10 --allowedTools Read,Write,Glob
  ) > "$log_file" 2>&1

  local exit_code=$?

  if [[ $exit_code -ne 0 ]]; then
    echo "  FAILED: $slug (exit code $exit_code, see $slug.log)"
    return 1
  fi

  # Validate output
  if validate_claims "$claims_file"; then
    echo "  OK: $slug"
    rm -f "$log_file"
    return 0
  else
    echo "  FAILED: $slug (invalid output, see $slug.log)"
    if [[ -f "$claims_file" ]]; then
      mv "$claims_file" "$claims_file.bad"
    fi
    return 1
  fi
}

echo "Processing $PENDING techniques in batches of $PARALLEL..."
echo ""

batch_num=0
for ((i = 0; i < PENDING; i += PARALLEL)); do
  batch_num=$((batch_num + 1))
  batch_end=$((i + PARALLEL))
  if [[ $batch_end -gt $PENDING ]]; then
    batch_end=$PENDING
  fi
  batch_size=$((batch_end - i))

  echo "Batch $batch_num: techniques $((i + 1))-$batch_end of $PENDING"

  # Launch batch in parallel
  pids=()
  batch_slugs=()
  for ((j = i; j < batch_end; j++)); do
    slug="${PENDING_SLUGS[$j]}"
    batch_slugs+=("$slug")
    process_technique "$slug" &
    pids+=($!)
  done

  # Wait for batch to complete and collect results
  for k in "${!pids[@]}"; do
    pid="${pids[$k]}"
    slug="${batch_slugs[$k]}"
    if wait "$pid"; then
      SUCCEEDED=$((SUCCEEDED + 1))
      # Track for review cycle
      REVIEW_COUNTER=$((REVIEW_COUNTER + 1))
      REVIEW_SLUG_BUFFER+=("$slug")
    else
      FAILED=$((FAILED + 1))
      FAILED_SLUGS+=("$slug")
    fi
  done

  # Update progress file after each batch
  completed_json=$(printf '%s\n' "${ALL_SLUGS[@]}" | while read -r s; do
    if validate_claims "$CLAIMS_DIR/$s.json"; then
      echo "$s"
    fi
  done | jq -R -s 'split("\n") | map(select(length > 0))')

  failed_json=$(printf '%s\n' "${FAILED_SLUGS[@]+"${FAILED_SLUGS[@]}"}" | jq -R -s 'split("\n") | map(select(length > 0))')

  jq -n \
    --argjson completed "$completed_json" \
    --argjson failed "$failed_json" \
    '{completed: $completed, failed: $failed, last_updated: now | todate}' \
    > "$PROGRESS_FILE"

  # Check if review cycle is due
  if [[ "$REVIEW_EVERY" -gt 0 && "$REVIEW_COUNTER" -ge "$REVIEW_EVERY" ]]; then
    REVIEW_BATCH_NUM=$((REVIEW_BATCH_NUM + 1))
    run_review_cycle "$REVIEW_BATCH_NUM" "${REVIEW_SLUG_BUFFER[@]}" || true
    REVIEW_COUNTER=0
    REVIEW_SLUG_BUFFER=()
  fi

  echo ""
done

# Run final review if there are un-reviewed techniques in the buffer
if [[ "$REVIEW_EVERY" -gt 0 && "${#REVIEW_SLUG_BUFFER[@]}" -gt 0 ]]; then
  REVIEW_BATCH_NUM=$((REVIEW_BATCH_NUM + 1))
  echo "Running final review for remaining ${#REVIEW_SLUG_BUFFER[@]} techniques..."
  run_review_cycle "$REVIEW_BATCH_NUM" "${REVIEW_SLUG_BUFFER[@]}" || true
fi

# Final summary
FINAL_COMPLETED=$((COMPLETED_COUNT + SUCCEEDED))
echo "========================================="
echo "Summary"
echo "========================================="
echo "Total techniques:    $TOTAL"
echo "Previously done:     $COMPLETED_COUNT"
echo "Succeeded this run:  $SUCCEEDED"
echo "Failed this run:     $FAILED"
echo "Total completed:     $FINAL_COMPLETED / $TOTAL"
if [[ "$REVIEW_EVERY" -gt 0 ]]; then
  echo "Review cycles run:   $REVIEW_BATCH_NUM"
fi
echo ""

if [[ $FAILED -gt 0 ]]; then
  echo "Failed techniques:"
  for slug in "${FAILED_SLUGS[@]+"${FAILED_SLUGS[@]}"}"; do
    echo "  - $slug (log: data/claims/$slug.log)"
  done
  echo ""
  echo "Re-run this script to retry failed techniques."
  exit 1
fi

echo "All techniques processed successfully."
