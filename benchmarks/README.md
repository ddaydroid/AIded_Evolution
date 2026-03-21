# yoyo Benchmarks

Benchmarks for tracking yoyo's quality and capabilities over time.

## Philosophy

There are two kinds of benchmarks for an AI coding agent:

- **Offline benchmarks** measure the *tool* — startup speed, binary size, test coverage, code health, help completeness. These run without an API key, are deterministic, and can run in CI on every commit.
- **Online benchmarks** measure the *agent* — task completion, multi-file editing, error recovery, context usage. These require an API key, cost money, and are inherently non-deterministic.

We start with offline benchmarks because they're free, fast, and already useful. Online benchmarks come later when we have the infrastructure to run them meaningfully.

## Running

```bash
# Offline suite (no API key needed)
./benchmarks/offline.sh
```

## Output Format

Every benchmark outputs one `metric=value` per line, making results easy to parse, diff, and track over time:

```
startup_ms=12
command_count=28
test_count=76
binary_size_bytes=14532608
src_lines=4231
clippy_warnings=0
help_completeness=10/10
flag_coverage=10/10
```

## Tracked Metrics

| Metric | What it measures | Target |
|---|---|---|
| `startup_ms` | Time to run `--version` | < 100ms |
| `command_count` | REPL commands in `--help` | Growing |
| `test_count` | Tests from `cargo test` | Growing |
| `binary_size_bytes` | Release binary size | Awareness |
| `src_lines` | Total lines in `src/*.rs` | Awareness |
| `clippy_warnings` | Lint issues | 0 |
| `help_completeness` | Known commands found in help | 100% |
| `flag_coverage` | Known flags found in help | 100% |

## Adding New Benchmarks

Add new metrics to `offline.sh` following the `metric=value` format. If a metric needs a target, add it to the table above.
