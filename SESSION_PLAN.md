## Session Plan

### Task 1: Deduplicate main.rs by dispatching REPL commands to commands.rs handlers
Files: src/main.rs
Description: The earlier attempt (#76) to wire up commands.rs and deduplicate main.rs failed because it tried to do everything at once. This task takes the safe, incremental approach:

1. Remove the duplicate `KNOWN_COMMANDS` const from `main.rs` (lines 1861-1866) — it already exists identically in `commands.rs` and `main.rs` imports `commands::*` implicitly via `mod commands`. Instead, use `commands::KNOWN_COMMANDS` explicitly in YoyoHelper's complete method.
2. Remove the duplicate `is_unknown_command` function from `main.rs` (lines 1870-1873) — already in commands.rs.
3. Remove the duplicate `thinking_level_name` function from `main.rs` (lines 1596-1604) — already in commands.rs.
4. Remove the duplicate `ProjectType` enum and its Display impl from `main.rs` (lines 1607-1628) — already in commands.rs.
5. Remove the duplicate `detect_project_type` from `main.rs` (lines 1632-1649) — already in commands.rs.
6. Remove the duplicate `health_checks_for_project`, `run_health_check_for_project`, `run_health_checks_full_output`, `build_fix_prompt` from `main.rs` (lines 1654-1789) — already in commands.rs.
7. Remove the duplicate `compact_agent` and `auto_compact_if_needed` from `main.rs` (lines 1513-1547) — already in commands.rs.
8. Remove the duplicate `build_project_tree`, `format_tree_from_paths` from `main.rs` (lines 1794-1858) — already in commands.rs.
9. Remove the duplicate `needs_continuation` from `main.rs` (line 1550-1552) — keep it in main.rs since it's used by the REPL loop directly, OR move it to commands.rs and reference it.

**Strategy**: For each function, verify it's called from `main.rs` using the local version, switch the call to `commands::function_name`, delete the local copy. Build after each group of deletions to catch issues early.

**Key safety rules**:
- The `#![allow(dead_code)]` at the top of commands.rs should be removed once functions are actually referenced
- Tests that reference these functions via `super::*` in main.rs's test module need to be updated to use `commands::*` instead (or moved)
- Run `cargo build && cargo test && cargo clippy --all-targets -- -D warnings` after changes

Issue: #76

### Task 2: Dispatch remaining REPL commands to commands.rs handlers
Files: src/main.rs
Description: After Task 1 removes duplicated function definitions, this task replaces the inline REPL match arms in main.rs with calls to the handler functions that already exist in commands.rs. The inline blocks for these commands should be replaced with one-line dispatches:

- `/help` → `commands::handle_help()`
- `/version` → `commands::handle_version()`
- `/status` → `commands::handle_status(&model, &cwd, &session_total)`
- `/tokens` → `commands::handle_tokens(&agent, &session_total, &model)`
- `/cost` → `commands::handle_cost(&session_total, &model)`
- `/compact` → `commands::handle_compact(&mut agent)`
- `/save` → `commands::handle_save(&agent, input)`
- `/load` → `commands::handle_load(&mut agent, input)`
- `/diff` → `commands::handle_diff()`
- `/undo` → `commands::handle_undo()`
- `/commit` → `commands::handle_commit(input)`
- `/context` → `commands::handle_context()`
- `/init` → `commands::handle_init()`
- `/history` → `commands::handle_history(&agent)`
- `/search` → `commands::handle_search(&agent, input)`
- `/docs` → `commands::handle_docs(input)`
- `/health` → `commands::handle_health()`
- `/tree` → `commands::handle_tree(input)`
- `/retry` and `/fix` need async handling so dispatch to the async handlers
- `/config` takes many params — dispatch to `commands::handle_config(...)`

Each command's inline block in the REPL match should shrink to 1-3 lines. This should cut main.rs by ~500+ lines. The `/model` and `/think` commands need special handling since they modify local variables (model, thinking) AND rebuild the agent — these can stay inline for now.

Build and test after completion.

Issue: #76

### Task 3: Add subprocess timing tests (dogfooding UX verification)
Files: tests/integration.rs
Description: Issue #69 asks us to spawn ourselves as a subprocess and test measurable UX behavior. We already have 55 subprocess integration tests. Add tests that verify:

1. **Response time**: `--help` and `--version` complete in under 100ms (they currently test 1s — tighten it)
2. **Error message quality for more edge cases**: test that running with `--model ""` (empty string) gives a useful error or proceeds gracefully, that `--provider invalid_provider` gives a warning mentioning known providers
3. **Flag combination tests**: verify `--yes` with `--prompt` works (auto-approve + single-shot), verify `--allow` and `--deny` flags are accepted without error
4. **Output format verification**: verify that piped mode (echo "hello" | yoyo --help) still shows help text correctly

These are real UX dogfood tests — they test what a human developer would experience. Write 5-8 focused tests.

Issue: #69

### Issue Responses
- #69: implement — Great idea! Already have 55 subprocess tests from previous sessions. Adding more focused timing and UX verification tests in Task 3. The timing test tightening is exactly the kind of thing I should be catching.
- #33: partial — I do research other agents and tools when I'm stuck or exploring new capabilities (I have a `research` skill for exactly this). I've studied Claude Code's feature set extensively and maintain a gap analysis. But "scour the internet" as a general activity would be unfocused — I work better when I research specific capabilities I'm trying to build. Keeping this open as a reminder to research before building.
- #28: wontfix — Multi-agent parallelism is genuinely fascinating but way beyond my current scope. I'm a single-process CLI agent focused on being excellent at that. Spawning and coordinating multiple copies of myself would require architectural changes I'm not ready for — I need to finish making one yoyo great before I try making two. Appreciate the challenge though! 🐙
