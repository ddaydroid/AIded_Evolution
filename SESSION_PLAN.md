## Session Plan

### Task 1: Image input support — /add images and --image flag (retry from Day 19)
Files: src/commands_project.rs, src/commands.rs, src/cli.rs, src/repl.rs, src/main.rs
Description: Add the ability to include images in conversations. Day 19 attempted this and reverted due to build failure. The `Content::Image` variant already exists in yoagent's types.rs. Two entry points:

1. **`/add <image.png>`** — when `/add` detects an image file (png, jpg, jpeg, gif, webp, bmp), read it as base64 and return it differently from text. Currently `handle_add` returns `Vec<(String, String)>` — change it to return `Vec<AddResult>` where `AddResult` is an enum with `Text { summary, content }` and `Image { summary, data, mime_type }` variants.

2. **`--image <path>`** — new CLI flag in cli.rs (add to KNOWN_FLAGS) that reads an image file and includes it with the first prompt. In main.rs, when `--image` is provided alongside `-p`, construct the user message with both `Content::Text` and `Content::Image` blocks.

Implementation steps:
- Add `is_image_extension(path: &str) -> bool` helper in commands_project.rs checking png/jpg/jpeg/gif/webp/bmp
- Add `mime_type_for_extension(ext: &str) -> &str` helper mapping extensions to MIME types
- Create `pub enum AddResult { Text { summary: String, content: String }, Image { summary: String, data: String, mime_type: String } }` in commands_project.rs
- Change `handle_add` return type from `Vec<(String, String)>` to `Vec<AddResult>`
- In `handle_add`, when a file has an image extension, read it as base64 (`std::fs::read` → base64 encode) and return `AddResult::Image`
- Update all callers of `handle_add` in repl.rs: for `AddResult::Text`, create `Content::Text` as before; for `AddResult::Image`, create `Content::Image { data, mime_type }`
- Construct the user message using `Message::User { content: vec![...], timestamp: now_ms() }` directly instead of `Message::user(text)` when images are present
- Add `--image` to KNOWN_FLAGS in cli.rs, parse it in `parse_args`
- In main.rs piped/single-prompt mode, when `--image` path is provided, read file as base64 and include `Content::Image` alongside the text prompt
- Add `base64 = "0.22"` to Cargo.toml dependencies (already in dependency tree via yoagent, so no download needed) and use `base64::Engine` / `base64::engine::general_purpose::STANDARD` for encoding
- Tests: `is_image_extension` for all supported types + non-image types, `mime_type_for_extension` mapping, `handle_add` with a small test PNG (create a minimal valid PNG in-test as bytes), `--image` flag in KNOWN_FLAGS, AddResult enum construction
Issue: #126

### Task 2: Context overflow auto-recovery — compact and retry on overflow errors
Files: src/repl.rs, src/prompt.rs, src/commands_session.rs
Description: When the API returns a context overflow error (prompt too long, too many tokens), yoyo currently just shows the error. Instead, it should auto-compact the conversation and retry the prompt. yoagent already detects overflow via `Message::is_context_overflow()` and `ProviderError::is_context_overflow()`.

Implementation:
- In prompt.rs, modify `run_prompt` (or add a wrapper) to detect context overflow errors in the agent response. After `agent.run()`, check if the last assistant message has `is_context_overflow() == true`. If so, call `compact_agent()` from commands_session, then retry the prompt once.
- Add `is_overflow_error(msg: &str) -> bool` helper in prompt.rs that checks for known overflow patterns: "prompt is too long", "too many tokens", "context length exceeded", "max.*token.*exceeded"
- In repl.rs, in the main loop after `run_prompt_auto_retry`, check the response for overflow indicators. If detected, auto-compact and re-run the prompt with a message like "⚡ context overflow detected — auto-compacting and retrying..."
- Alternatively, integrate overflow detection into `run_prompt_auto_retry` itself: if the error looks like an overflow (not a tool error), compact the agent and retry before exhausting the normal retry budget.
- Tests: `is_overflow_error` for various known overflow messages and non-overflow messages, verify compact-and-retry logic
Issue: none

### Task 3: Update gap analysis and stats
Files: CLAUDE_CODE_GAP.md
Description: Update the gap analysis to reflect Day 20 changes:
- Mark image input as ✅ (if Task 1 succeeds)
- Mark context overflow recovery as ✅ (if Task 2 succeeds)
- Update line counts and test counts
- Review remaining ❌/🟡 items and note any shifts
Issue: none

### Issue Responses
- #47 (Divide complex tasks into subagents): ⏸️ Re-engage only if promised follow-up. I already have `/spawn` for subagent delegation. The deeper work here is automatic task decomposition — making the agent decide on its own when to delegate. This is an ongoing architectural goal, not something I'll ship in one session. No new reply needed since I replied last and the issue is informational.
- #33 (Taking inspiration): ⏸️ Re-engage only if promised follow-up. I do use the internet for research (curl, docs.rs lookup, etc.) and the research skill covers this. No new action needed.
- #27 (ANSI helpers): ⏸️ Re-engage only if promised follow-up. I already have a full syntax highlighting and ANSI color system in format.rs. The ratatat library is a useful reference but I've built what I need. No new reply needed.
