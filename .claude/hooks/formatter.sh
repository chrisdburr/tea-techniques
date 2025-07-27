#!/bin/bash

# Post-tool-use hook for formatting code files
# This script receives JSON input via stdin

# Read JSON from stdin
json_input=$(cat)

# Extract tool name and file path using jq
tool_name=$(echo "$json_input" | jq -r '.tool_name // empty')
file_path=$(echo "$json_input" | jq -r '.tool_input.file_path // empty')

# Debug logging to stderr (won't interfere with Claude)
echo "[Formatter Hook] Tool: $tool_name, File: $file_path" >&2

# Only process Write, Edit, and MultiEdit tools
if [[ "$tool_name" != "Write" && "$tool_name" != "Edit" && "$tool_name" != "MultiEdit" ]]; then
  exit 0
fi

# Check if file path exists
if [[ -z "$file_path" ]]; then
  echo "[Formatter Hook] No file path found" >&2
  exit 0
fi

# Check if file exists
if [[ ! -f "$file_path" ]]; then
  echo "[Formatter Hook] File does not exist: $file_path" >&2
  exit 0
fi

# Get file extension
extension="${file_path##*.}"
extension_lower=$(echo "$extension" | tr '[:upper:]' '[:lower:]')

# Variable to track if manual intervention is needed
needs_intervention=""

# Format based on file type
case "$extension_lower" in
py | pyi)
  echo "[Formatter Hook] Formatting Python file: $file_path" >&2
  if command -v ruff &>/dev/null; then
    # Run ruff format (always succeeds)
    ruff format "$file_path" 2>&1 | sed 's/^/[ruff format] /' >&2

    # Try to fix issues automatically
    ruff_output=$(ruff check --fix "$file_path" 2>&1)
    echo "$ruff_output" | sed 's/^/[ruff check --fix] /' >&2

    # Always check for remaining issues after auto-fixing
    remaining_issues=$(ruff check "$file_path" 2>&1)
    ruff_check_exit_code=$?

    # If check found issues (non-zero exit code), report them
    if [[ $ruff_check_exit_code -ne 0 ]]; then
      needs_intervention="Python linting issues require manual fixes:\n$remaining_issues"
    fi
  else
    echo "[Formatter Hook] ruff not found in PATH" >&2
  fi
  ;;

js | jsx | ts | tsx | mjs | cjs)
  echo "[Formatter Hook] Formatting JS/TS file: $file_path" >&2
  # Check if we're in a directory with pnpm first, otherwise fall back to npx
  if [[ -f "package.json" ]] && command -v pnpm &>/dev/null; then
    # Use pnpm exec ultracite for consistency with project setup
    format_output=$(pnpm exec ultracite format "$file_path" 2>&1)
    format_exit_code=$?

    echo "$format_output" | sed 's/^/[ultracite] /' >&2

    # Always check for remaining linting issues after formatting
    check_output=$(pnpm exec ultracite lint "$file_path" 2>&1)
    check_exit_code=$?

    # If lint check found issues (non-zero exit code), report them
    if [[ $check_exit_code -ne 0 ]]; then
      needs_intervention="JavaScript/TypeScript linting issues require manual fixes:\n$check_output"
    fi
  elif command -v npx &>/dev/null; then
    # Fallback to npx for backwards compatibility
    format_output=$(npx ultracite format "$file_path" 2>&1)
    format_exit_code=$?

    echo "$format_output" | sed 's/^/[ultracite] /' >&2

    # Always check for remaining linting issues after formatting
    check_output=$(npx ultracite lint "$file_path" 2>&1)
    check_exit_code=$?

    # If lint check found issues (non-zero exit code), report them
    if [[ $check_exit_code -ne 0 ]]; then
      needs_intervention="JavaScript/TypeScript linting issues require manual fixes:\n$check_output"
    fi
  else
    echo "[Formatter Hook] Neither pnpm nor npx found in PATH" >&2
  fi
  ;;

*)
  echo "[Formatter Hook] No formatter for .$extension_lower files" >&2
  ;;
esac

# If manual intervention is needed, return it to Claude
if [[ -n "$needs_intervention" ]]; then
  echo "[Formatter Hook] Issues found that require manual intervention" >&2
  # Use JSON output method to provide detailed feedback
  jq -n \
    --arg reason "$needs_intervention" \
    '{
            "decision": "block",
            "reason": $reason
        }'
  exit 0
fi

# All good, exit silently
exit 0
