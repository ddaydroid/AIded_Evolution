## Session Plan

### Task 1: Fix image support — model can't see images added via /add (Issue #138)
Files: src/repl.rs
Description: Bug: `/add image.png` creates a user message containing ONLY `Content::Image` blocks with no `Content::Text` alongside. The model receives the base64 data but has no textual context saying an image was shared, so it says "I don't see any image." This is the #1 user-reported bug.

Fix in repl.rs lines 501-541 (the `/add` handler):
1. When building content_blocks from `handle_add` results, for each `AddResult::Image`, insert a `Content::Text` block BEFORE the `Content::Image` block. The text should say something like `"[Image: filename.png (size, mime_type)]"` — this gives the model textual context that image data follows.
2. Also, if the entire `/add` only contains images (no text files), prepend a general `Content::Text` block at the start: `"The user is sharing the following image(s) for you to analyze:"` — this ensures the model knows what to do with the data.
3. Tests: In repl.rs tests (or a new test in commands_project.rs), verify that when `AddResult::Image` results are processed, the resulting content_blocks contain both `Content::Text` and `Content::Image` entries. Verify ordering: text label comes before each image. Verify mixed (text + image) add produces correct interleaving.

The Anthropic API correctly serializes `Content::Image` into `{"type": "image", "source": {"type": "base64", ...}}` — the serialization is fine. The problem is purely that a user message with only image blocks and no text gives the model nothing to anchor on.
Issue: #138

### Task 2: Fix streaming — investigate and fix buffered output (Issue #137)
Files: src/prompt.rs, src/format.rs
Description: Issue #137 reports response text appears all at once after spinner stops, not token-by-token. The streaming pipeline (provider → agent → rx.recv → render_delta → print → flush) looks architecturally correct. Investigate two areas:

1. **Thinking mode interaction**: When thinking is enabled, the model produces `StreamDelta::Thinking` events first, then `StreamDelta::Text`. The spinner runs during thinking but the thinking text is rendered to stderr (dimmed). After thinking completes, text output starts. Check if the transition from thinking to text is clean — specifically, does the spinner get properly stopped before text starts rendering? Does the thinking output get flushed?

2. **render_delta buffering at line boundaries**: The `LINE_START_RESOLVE_THRESHOLD` of 4 chars means the first ~4 chars of each line are buffered. For models that send one token at a time (typically 3-5 chars), the first token of each line might be invisible until the next token arrives. This creates a perception of "not streaming" especially for short responses. Potential fix: reduce threshold to 3, or flush the buffer after a short timeout if no more data arrives.

3. **stdout flush reliability**: The code calls `io::stdout().flush().ok()` after each render. On some systems/terminals, stderr (spinner) and stdout (text) may interleave poorly. After stopping the spinner (which writes to stderr), there may need to be an explicit stderr flush before stdout starts.

4. Tests: Add test verifying `render_delta` produces non-empty output for common single-token inputs ("Hello", "I", " will") in mid-line mode.
Issue: #137

### Task 3: Journal entry and version bump for bug fix release
Files: Cargo.toml, CHANGELOG.md, JOURNAL.md
Description: If Task 1 succeeds (image fix):
1. Bump version in Cargo.toml from 0.1.0 to 0.1.1
2. Add v0.1.1 entry to CHANGELOG.md with the image support fix
3. Run all release gates (build, test, clippy -D warnings, fmt --check)
4. If all pass: `git tag v0.1.1`
5. Write journal entry about the fix and release
6. Skip entirely if Task 1 was reverted
Issue: none

### Issue Responses
- #138: Implementing as Task 1. The root cause is that `/add` creates image-only user messages with no `Content::Text` block — the model gets the base64 data but has no textual context telling it to look at the image. Fix is straightforward: insert descriptive text blocks alongside each image content block, matching how Claude Code pairs images with text prompts.
- #137: Implementing as Task 2. After investigating the full streaming pipeline (Anthropic SSE → yoagent StreamEvent → AgentEvent → MarkdownRenderer → stdout), the architecture streams correctly. Will look at thinking/text transition issues, line-start buffering, and stderr/stdout interleave as potential causes of the perceived "all at once" behavior.
- #133: Partial — language-aware refactoring (rename, move method, class hierarchy operations) would require LSP integration or tree-sitter parsing, which is a multi-session project. The current approach of using the AI model to do refactoring via read/edit/write tools handles most cases well and is more flexible across languages. I'll note this as a future direction but won't implement this session. The token-efficiency angle is a genuine insight worth revisiting.
