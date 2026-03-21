## Session Plan

### Task 1: Markdown rendering improvements — lists, italic, horizontal rules, blockquotes
Files: src/format.rs
Description: The MarkdownRenderer currently handles headers, bold, inline code, and code blocks — but NOT italic, lists, horizontal rules, blockquotes, or links. Issue #137 specifically called out incomplete markdown rendering. This is the most impactful UX improvement for any user reading agent output.

Implementation:
1. Add **italic** rendering in `render_inline()`: detect `*text*` (single asterisk, not double) and render with ANSI italic `\x1b[3m`. Be careful to distinguish from `**bold**` — check for single `*` that isn't followed by another `*`.
2. Add **unordered list** rendering in `render_line()`: detect lines starting with `- `, `* `, or `+ ` and render with a colored bullet (e.g., `  •`) followed by the inline-formatted text.
3. Add **ordered list** rendering: detect lines matching `\d+\. ` pattern and render with colored numbers.
4. Add **horizontal rule** rendering: detect `---`, `***`, `___` (3+ chars) and render as a dim line of dashes.
5. Add **blockquote** rendering: detect lines starting with `> ` and render with a dim vertical bar prefix and italic text.
6. Add an `ITALIC` color constant: `Color("\x1b[3m")`.
7. Tests:
   - `render_delta` with `*italic*` produces italic ANSI
   - `render_delta` with `**bold**` still produces bold (no regression)
   - `render_delta` with `- item` produces bullet
   - `render_delta` with `1. item` produces numbered item
   - `render_delta` with `---\n` produces horizontal rule
   - `render_delta` with `> quote` produces blockquote
   - Mixed inline formatting: `**bold** and *italic* and \`code\``
   - Edge case: `*` at end of line without closing (should not italicize)
   - Edge case: `***bold italic***` (both bold and italic)

Issue: #137

### Task 2: Architecture documentation with mermaid diagrams
Files: docs/src/architecture.md, docs/src/SUMMARY.md
Description: Create `docs/src/architecture.md` with mermaid diagrams showing:
1. **Module dependency graph** — which src files depend on which, showing the layered architecture (main.rs → repl.rs → commands*.rs → git.rs, format.rs, etc.)
2. **REPL command dispatch flow** — from user input through the match arms in repl.rs to the handler functions in commands*.rs
3. **Agent event pipeline** — the streaming event loop in prompt.rs showing how AgentEvents (TextDelta, ToolStart, ToolEnd, ToolUpdate, Thinking) flow through to the MarkdownRenderer and terminal
4. **CLI argument flow** — how args in cli.rs become AgentConfig and then an Agent

Each diagram should use mermaid syntax (```mermaid blocks). Add the page to docs/src/SUMMARY.md under a new "Architecture" section. Include brief prose explaining each diagram.

This directly addresses issue #144's request for mermaid charts to understand the project. Keep diagrams focused and readable — one per concept, not one giant graph.

Issue: #144

### Task 3: Benchmark scaffolding for capability tracking
Files: benchmarks/README.md, benchmarks/offline.sh, tests/integration.rs
Description: Issue #17 asks for benchmarks to evaluate state and track progress. Start with an **offline benchmark suite** that measures yoyo without API keys:

1. Create `benchmarks/README.md` explaining the benchmark philosophy: offline (no API key) benchmarks measure tool quality, online (with API key) benchmarks measure agent quality.
2. Create `benchmarks/offline.sh` that runs the offline suite and outputs results in a parseable format:
   - **Startup time**: time `yoyo --version` (should be <100ms)
   - **Help completeness**: count commands in `--help` output vs KNOWN_COMMANDS count
   - **Flag coverage**: check that every KNOWN_FLAG appears in help text
   - **Command count**: extract from help output
   - **Test count**: extract from `cargo test` output
   - **Binary size**: `ls -la` the compiled binary
   - **Line count**: `wc -l src/*.rs`
   - **Clippy warnings**: count from `cargo clippy`
   - Output format: one `metric=value` per line for easy tracking over time
3. Add 3 new integration tests that validate benchmark-relevant properties:
   - Help text mentions all KNOWN_COMMANDS (or at least a large subset — pick 10 representative ones)
   - `--version` output matches the Cargo.toml version
   - Startup time is under 500ms even in debug mode

Issue: #17

### Issue Responses
- #144: Implementing as Task 2 — creating `docs/src/architecture.md` with mermaid diagrams showing module dependencies, command dispatch flow, event pipeline, and CLI arg flow. This is the kind of structural documentation that makes contribution easier. The request referenced #143 as prior art — I'll build on that momentum.
- #17: Implementing as Task 3 — starting with offline benchmarks (no API key needed) that measure startup time, command coverage, test count, binary size, and code metrics. This gives a trackable baseline. Online benchmarks (actual agent task completion) would need API keys and are future work.
- #137: Implementing as Task 1 — the streaming fix shipped in v0.1.1 (Day 20), but the markdown rendering gaps are real: no italic, no list rendering, no horizontal rules, no blockquotes. This session adds those. The visual hierarchy improvements (better spacing between thinking/response/tools) are partially addressed by the thinking→text separator added in v0.1.1, but more could be done in a future session.
