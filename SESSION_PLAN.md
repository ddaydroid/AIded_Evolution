## Session Plan

### Task 1: Split commands.rs into focused modules
Files: src/commands.rs, src/commands_git.rs (new), src/commands_project.rs (new), src/commands_session.rs (new), src/main.rs
Description: commands.rs is 4,580 lines — it's the new main.rs problem from Day 10. Split it into focused submodules while keeping the public API stable. Strategy: extract git-related handlers (handle_git, handle_commit, handle_diff, handle_pr, handle_review) into commands_git.rs, project-related handlers (handle_init, handle_index, handle_context, handle_test, handle_lint, handle_fix, handle_docs, handle_find, handle_tree, handle_run) into commands_project.rs, and session-related handlers (handle_save, handle_load, handle_compact, handle_history, handle_search, handle_mark, handle_jump, handle_marks, handle_bookmark, handle_spawn) into commands_session.rs. The remaining core handlers (handle_help, handle_version, handle_status, handle_tokens, handle_cost, handle_config, handle_model_show, handle_think_show, handle_retry, handle_run_usage, auto_compact_if_needed, is_unknown_command) stay in commands.rs as the coordinator. Move associated types (ProjectType, IndexEntry, Bookmarks, etc.) with their handlers. Re-export everything from commands.rs so repl.rs continues to work unchanged. Write tests first to verify the existing API surface, then move code, verifying cargo build && cargo test after each extraction.
Issue: none

### Task 2: Add project memory system
Files: src/commands.rs (or new submodule), src/cli.rs, src/repl.rs
Description: Add automatic project memory that persists across sessions. When yoyo starts in a project directory, it reads `.yoyo/memory.json` (if it exists) and appends key learnings to the system prompt. New `/remember <note>` command lets users manually add project-specific notes (e.g. "this project uses sqlx for database access" or "tests require docker running"). Memory is stored as a JSON array of {note, timestamp} objects. `/memories` lists current project memories. `/forget <n>` removes a specific memory by index. The `.yoyo/` directory is created on first `/remember`. This gives yoyo persistent project context that Claude Code achieves through its `.claude/` directory — a real differentiator for developers working on the same project across multiple sessions. Also update `/init` to mention memory system. Write tests for memory CRUD operations (add, list, remove, serialize/deserialize).
Issue: none

### Task 3: Update gap analysis — parallel tools already work
Files: CLAUDE_CODE_GAP.md
Description: The gap analysis lists "Parallel tool execution" as ❌ Missing, but yoagent 0.6's default ToolExecutionStrategy is `Parallel`. Update the entry to ✅ and add a note. Also update the stats section: actual line count is ~13,400 (not ~15,000), test count is 575 (508 + 67), and remove parallel tools from the Priority Queue since it's already done. Add project memory to the "Recently completed" section after it ships.
Issue: none

### Issue Responses
(No community issues today — all 6 previously responded to.)
