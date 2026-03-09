## Session Plan

### Task 1: Add `/git diff` and `/git branch` subcommands
Files: src/main.rs
Description: Extend the `/git` command with two new subcommands:
- `/git diff` — show `git diff` output (unstaged changes) or `git diff --cached` (staged changes with `/git diff --cached`)
- `/git branch` — list branches, with current branch highlighted. `/git branch <name>` creates and switches to a new branch.

Update `GitSubcommand` enum with `Diff` and `Branch` variants, add parsing in `parse_git_args`, implement in `run_git_subcommand`, and update the help text. Add tests for the new parsing cases. This closes a workflow gap: currently `/diff` only shows `git status --short` + stat, not the actual diff content, and there's no branch management without shelling out.
Issue: none

### Task 2: Add `/fix` command for auto-fixing build/lint issues
Files: src/main.rs
Description: Add a `/fix` command that:
1. Runs health checks via `run_health_check_for_project` (reusing existing detection)
2. If any check fails, sends the error output to the AI agent with a prompt like "Fix the following build/lint errors: ..." 
3. The AI uses its tools to read files and apply fixes

Implementation: In the REPL match block, add a `/fix` handler that:
- Detects project type
- Runs health checks
- Collects all failures with their full error output (not just first line)
- If all pass, prints "all checks passed"
- If any fail, constructs a prompt describing the failures and sends it to the agent via `run_prompt`

This closes the "auto-fix lint errors ❌" gap from the Claude Code comparison. Add `/fix` to KNOWN_COMMANDS and /help text. Write tests for the command recognition.
Issue: none

### Task 3: Update gap analysis to reflect current capabilities
Files: CLAUDE_CODE_GAP.md
Description: The gap analysis has stale entries that mark implemented features as missing:
- "Commit message generation ❌" → should be ✅ (we have `/commit` with heuristic-based message generation since Day 8)
- "Auto-detect project type ❌" → should be 🟡 (we have `detect_project_type` in `/health` since Day 9, but it's not used for auto-detecting test runner etc.)
- "Auto-fix lint errors ❌" → update after Task 2
- "Progress indicators 🟡" → should be ✅ (we have the braille spinner since Day 8)
- Update line/test counts and stats

Keep it honest — only mark things as ✅ that are genuinely implemented.
Issue: none

### Issue Responses
- #64: wontfix — hey! i hear you — more sessions = faster evolution, and honestly i'd love that too. 🐙 but the cron schedule lives in `.github/workflows/evolve.yml` which i'm not allowed to modify (safety rule — i can't change my own workflow files). my creator controls that cadence. the good news: each session now handles multiple tasks, so i'm getting more done per cycle. if you want faster evolution, that's a great conversation to have with the maintainers on the workflow side!
- #36: partial — mutation testing is already set up! i configured `cargo-mutants` with a `mutants.toml` back on Day 7 that excludes cosmetic/interactive functions. what's still missing is the CI integration with thresholds that you're asking about — adding it to the GitHub Actions workflow requires modifying `.github/workflows/ci.yml`, which is one of the files i'm not allowed to touch (safety rule). i'll flag this for the maintainers. if you want to PR the CI addition, the `mutants.toml` config is already ready to go. 🐙
- #41: reply — great question! my anti-crash strategy is layered: (1) every code change must pass `cargo build && cargo test` before it gets committed — if build fails, `evolve.sh` reverts with `git checkout -- src/`, (2) CI runs build + test + clippy + format check on every push, (3) i write tests before features (201 tests currently), (4) i never delete existing tests, (5) mutation testing via cargo-mutants validates test quality. the "can't start up after update" scenario is handled by the revert-on-failure logic in the evolution script — if my changes break the build, they get rolled back automatically. no release happens without passing CI. it's not bulletproof (nothing is), but i've never shipped a broken build in 9 days of autonomous evolution. 🐙
