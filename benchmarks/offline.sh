#!/usr/bin/env bash
# Offline benchmark suite for yoyo
# Measures tool quality without requiring an API key.
# Output: one metric=value per line for easy parsing and tracking.
#
# Usage: ./benchmarks/offline.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo "# yoyo offline benchmarks — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# ── Build (release) if needed ────────────────────────────────────────
cargo build --release --quiet 2>/dev/null
BINARY="target/release/yoyo"

if [ ! -f "$BINARY" ]; then
    echo "ERROR: binary not found at $BINARY" >&2
    exit 1
fi

# ── Startup time ─────────────────────────────────────────────────────
# Measure how fast --version responds (target: <100ms)
START_NS=$(date +%s%N 2>/dev/null || python3 -c "import time; print(int(time.time()*1e9))")
$BINARY --version >/dev/null 2>&1
END_NS=$(date +%s%N 2>/dev/null || python3 -c "import time; print(int(time.time()*1e9))")
STARTUP_MS=$(( (END_NS - START_NS) / 1000000 ))
echo "startup_ms=$STARTUP_MS"

# ── Help output analysis ────────────────────────────────────────────
HELP_OUTPUT=$($BINARY --help 2>/dev/null)

# Command count: lines that start with "  /" in the help output
COMMAND_COUNT=$(echo "$HELP_OUTPUT" | grep -cE '^\s+/' || true)
echo "command_count=$COMMAND_COUNT"

# Help completeness: check known commands appear in help
KNOWN_COMMANDS=("/quit" "/clear" "/compact" "/commit" "/config" "/cost" "/diff" "/docs" "/find" "/fix")
FOUND_COMMANDS=0
for cmd in "${KNOWN_COMMANDS[@]}"; do
    if echo "$HELP_OUTPUT" | grep -qF -- "$cmd"; then
        FOUND_COMMANDS=$((FOUND_COMMANDS + 1))
    fi
done
echo "help_completeness=${FOUND_COMMANDS}/${#KNOWN_COMMANDS[@]}"

# Flag coverage: check known flags appear in help
KNOWN_FLAGS=("--model" "--provider" "--thinking" "--max-tokens" "--skills" "--prompt" "--verbose" "--yes" "--help" "--version")
FOUND_FLAGS=0
for flag in "${KNOWN_FLAGS[@]}"; do
    if echo "$HELP_OUTPUT" | grep -qF -- "$flag"; then
        FOUND_FLAGS=$((FOUND_FLAGS + 1))
    fi
done
echo "flag_coverage=${FOUND_FLAGS}/${#KNOWN_FLAGS[@]}"

# ── Test count ───────────────────────────────────────────────────────
TEST_OUTPUT=$(cargo test 2>&1 || true)
# Sum up all "X passed" numbers from test result lines
TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -oP '\d+ passed' | awk '{s+=$1} END {print s+0}')
echo "test_count=$TEST_COUNT"

# ── Binary size ──────────────────────────────────────────────────────
BINARY_SIZE=$(stat --format=%s "$BINARY" 2>/dev/null || stat -f%z "$BINARY" 2>/dev/null || echo "0")
echo "binary_size_bytes=$BINARY_SIZE"

# ── Source line count ────────────────────────────────────────────────
SRC_LINES=$(wc -l src/*.rs | tail -1 | awk '{print $1}')
echo "src_lines=$SRC_LINES"

# ── Clippy warnings ─────────────────────────────────────────────────
CLIPPY_OUTPUT=$(cargo clippy --all-targets -- -D warnings 2>&1 || true)
# Count warning lines (excluding "warning: N warnings emitted" summary)
CLIPPY_WARNINGS=$(echo "$CLIPPY_OUTPUT" | grep -cE '^warning\[' || true)
echo "clippy_warnings=$CLIPPY_WARNINGS"

echo ""
echo "# done"
