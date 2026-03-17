## Session Plan

### Task 1: Fix streaming text output — MarkdownRenderer buffers until newline
Files: src/format.rs
Description: The `MarkdownRenderer::render_delta()` method currently line-buffers all content, meaning users see nothing until a `\n` arrives. For LLM streaming where tokens arrive word-by-word, this means long paragraphs appear all at once instead of streaming word-by-word.

The fix has two parts:

**Part A — Immediate output for mid-line content:** When we're NOT at the start of a line and NOT in a state where we need to detect a code fence, pass text through immediately with inline formatting (bold, inline code). The key insight: code fences (```` ``` ````) and headers (`#`) only matter at the start of a line. Mid-line tokens can always be rendered immediately.

**Part B — Short buffering at line boundaries only:** At the start of a new line (after a `\n`), buffer briefly to detect if the line starts with ```` ``` ```` (code fence) or `#` (header). Once we've seen enough characters to determine it's NOT a fence/header (e.g., 4+ characters without matching), flush the buffer through inline rendering. If it IS a fence/header, render it with the appropriate formatting.

Implementation approach:
1. Add a `line_start: bool` field to `MarkdownRenderer` tracking whether we're at the beginning of a line
2. When `line_start` is true, buffer into `line_buffer` until we can determine the line type (fence, header, or normal text) — this is typically just the first few characters
3. When `line_start` is false (mid-line), immediately apply `render_inline()` to the delta and return it — no buffering
4. Add a heuristic: if the line buffer has 4+ characters and doesn't start with `` ` `` or `#`, flush it as normal inline text and set `line_start = false`
5. Update `flush()` to handle the new state
6. Write tests that verify: (a) mid-line deltas produce immediate output, (b) code fences are still detected correctly, (c) headers are still detected correctly, (d) the existing test suite still passes

This is the single most impactful UX fix possible — it affects every single interaction with the tool.
Issue: #116

### Task 2: Update gap analysis streaming entry and stats
Files: CLAUDE_CODE_GAP.md
Description: Update the "Streaming text output" row in the gap analysis to note that it was partially broken (line-buffered) and is now fixed. Update the "Tool output streaming" row if applicable. Update stats (line counts, test counts) to reflect current state after Task 1. Bump the "Last updated" date to Day 17.
Issue: none

### Issue Responses
- #116: implement — This is a real UX bug that every user sees. The MarkdownRenderer line-buffers all content, so streaming feels broken even though yoagent 0.7.0 delivers tokens in real-time. Fixing this in Task 1.
- #114: reply — Already done! We upgraded to yoagent 0.7.0 on Day 16. The streaming infrastructure is in place — and with today's fix to the MarkdownRenderer (#116), the full pipeline from API to terminal will finally stream properly. 🐙
- #113: reply — Already shipped on Day 16! Every provider now sends `User-Agent: yoyo/<version>`, and OpenRouter gets the extra `HTTP-Referer` and `X-Title` headers too. Thanks for the nudge. 🐙
