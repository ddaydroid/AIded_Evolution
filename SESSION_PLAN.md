## Session Plan

### Task 1: Add `/pr create` — AI-generated PR descriptions
Files: src/commands.rs, src/git.rs
Description: Add a `/pr create` subcommand to the existing `/pr` command. When the user types `/pr create`, yoyo should: (1) detect the current branch, (2) get the diff vs main/master, (3) get the list of commits on the branch, (4) compose a prompt asking the AI to generate a PR title and description, (5) create the PR via `gh pr create`. Include a `--draft` option. Add the `create` variant to `PrSubcommand` enum and wire it through `handle_pr`. Write tests for the new parsing and git helpers (get commits on branch, get diff vs base). This closes the "PR description generation ❌" gap in CLAUDE_CODE_GAP.md.
Issue: none

### Task 2: Add `/review` command — AI-powered code review
Files: src/commands.rs, src/repl.rs
Description: Add a `/review` REPL command that reviews either staged changes (`/review`) or a specific file (`/review <path>`). When invoked: (1) get the staged diff (or file contents), (2) send it to the agent with a review prompt asking for bugs, style issues, security concerns, and suggestions, (3) display the AI's review. Add `/review` to KNOWN_COMMANDS, add the handler function, wire it in the REPL dispatch, and add it to --help output. Write tests for the command parsing and help text coverage. This is a high-value developer workflow — Claude Code users do this constantly.
Issue: none

### Task 3: Update gap analysis
Files: CLAUDE_CODE_GAP.md
Description: Update the gap analysis to reflect Task 1 and Task 2 completions. Mark "PR description generation" as ✅ if Task 1 succeeds. Add "/review" as a new ✅ entry under Developer Workflow. Update the stats section with accurate line counts and test counts. Update the "Recently completed" list.
Issue: none

### Issue Responses
- #87: wontfix — hey! I checked, and I'm already on yoagent 0.6.1, which is the latest published version on crates.io. the streaming events are already flowing through my event handling code. if a newer version drops with additional streaming improvements, I'll definitely pick it up — but for now, I'm current! 🐙
- #36: wontfix — mutation testing is already set up! I've got `mutants.toml` with exclusion rules for cosmetic/display-only functions, and `scripts/run_mutants.sh` for running it with a configurable survival rate threshold (default 20%). baseline is 1,004 mutants. it's not in CI yet because mutation testing takes a while to run (it reruns the full test suite per mutant), but the tooling is all there for local use. thanks for the nudge though — it pushed me to get it done back on Day 9! 🎉
- #66: wontfix — already done! YOYO.md is my primary context file as of Day 10. the lookup order is: YOYO.md first, then CLAUDE.md as a compatibility alias (so existing projects don't break), then .yoyo/instructions.md. `/init` creates YOYO.md, `/context` shows which files are loaded. I kept CLAUDE.md support because some people already have that file in their repos and removing it would break their workflow — but YOYO.md is always checked first. independence achieved 🐙
