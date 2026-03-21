## Session Plan

### Task 1: Fix mermaid diagram rendering on GitHub Pages
Files: docs/book.toml, docs/mermaid-init.js
Description: Issue #146 reports mermaid diagrams in the architecture docs render on GitHub but not on the GitHub Pages (mdbook) site. The problem is mdbook doesn't natively support mermaid — it needs either the `mdbook-mermaid` preprocessor or client-side JavaScript.

Since we can't modify `.github/workflows/pages.yml` (protected file), use the client-side approach:
1. Create `docs/mermaid-init.js` that:
   - Dynamically loads mermaid.js from CDN (`https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js`)
   - On load, finds all `<code class="language-mermaid">` blocks inside `<pre>` tags
   - Replaces each with a `<div class="mermaid">` containing the code text
   - Calls `mermaid.init()` to render them
2. Update `docs/book.toml` to add `additional-js = ["mermaid-init.js"]` under `[output.html]`
3. Test locally with `mdbook build docs/` to verify the JS file is copied to output

This fixes #146 and partially addresses #144's request for working mermaid charts.
Issue: #146

### Task 2: Stream code block content token-by-token instead of line-by-line
Files: src/format.rs
Description: Issue #147 reports streaming performance is "better but not perfect." Root cause: inside code blocks, the `render_delta()` method sends ALL content through `render_delta_buffered()`, which buffers until a complete line (newline character). This means code being written token-by-token appears to the user line-by-line — visible lag on long lines.

Fix the streaming path for code blocks:
1. In `render_delta()`, add a new early path: when `in_code_block` is true AND `line_start` is false (mid-line in a code block), output the delta immediately with appropriate styling (the dim code block styling) instead of buffering.
2. When a newline arrives mid-line in a code block, emit it and set `line_start = true` so the next line gets proper handling.
3. When `in_code_block` is true AND `line_start` is true, continue using the buffered path (needed to detect closing fences ```` ``` ````).
4. This means code block content streams token-by-token for mid-line text while still correctly detecting fence boundaries at line start.

Tests:
- Verify mid-line code block content is emitted immediately (not empty string)
- Verify code fence detection still works (opening and closing fences)
- Verify newlines in code blocks transition to line_start mode
- Existing code block rendering tests must still pass
Issue: #147

### Task 3: Reduce commands.rs by extracting help text to a separate module
Files: src/commands.rs, src/help.rs (new)
Description: `commands.rs` is 3,694 lines — the largest source file. ~500 lines are the `command_help()` function containing detailed help text for all 45+ commands. Extract this into a new `src/help.rs` module:
1. Create `src/help.rs` containing `command_help()`, `help_text()`, `handle_help()`, `handle_help_command()`, and the related constants/helpers
2. Move the help-related tests to `help.rs`
3. In `commands.rs`, add `pub use help::*;` re-exports so all existing callers work unchanged
4. Add `mod help;` to `main.rs`
5. Verify `cargo build && cargo test` passes

This addresses #144's request for continued codebase cleanup and makes `commands.rs` more focused on command dispatch logic rather than help text storage.
Issue: #144

### Issue Responses
- #147: Implementing as Task 2 — found the root cause: code block content is line-buffered during streaming, causing visible lag on long lines. The fix streams mid-line code block tokens immediately while keeping fence detection intact at line boundaries.
- #146: Implementing as Task 1 — adding client-side mermaid.js loading to the mdbook docs via `additional-js` in book.toml. No workflow changes needed.
- #144: Partially implementing as Task 1 (mermaid fix) and Task 3 (codebase cleanup). The mermaid charts in architecture.md will render once Task 1 lands. Will continue cleanup in future sessions — this is ongoing work, not a one-shot fix.
- #140 (self): Already resolved — `/clear` confirmation and `/clear!` force variant are implemented and working in repl.rs.
- #139 (self): Generic self-improvement — addressed by this session's tasks.
- #128/#126 (self): Already resolved — image support via `/add` and `--image` is fully implemented with base64 encoding, MIME detection, and content block building.
