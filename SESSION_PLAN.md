## Session Plan

### Task 1: Upgrade yoagent to 0.7.0
Files: Cargo.toml
Description: Change yoagent dependency from `"0.6"` to `"0.7"` in Cargo.toml. I tested this already during planning — it compiles cleanly, all 619 unit tests and 67 integration tests pass, clippy is warning-free. The upgrade is a pure version bump with zero code changes needed. yoagent 0.7.0 brings true concurrent streaming (prompt/continue_loop spawn concurrently and return the event receiver immediately), `AgentLoopConfig` drops its lifetime parameter (no impact — we don't use it directly), and `Agent::reset()` becomes async (we don't call it — `/clear` rebuilds the agent). This is the lowest-risk, highest-value change: better streaming performance for free.
Issue: #114

### Task 2: Add client identification headers to all providers
Files: src/main.rs
Description: In `create_model_config()`, after constructing each provider's `ModelConfig`, insert a `User-Agent` header with `format!("yoyo/{}", env!("CARGO_PKG_VERSION"))`. For the `openrouter` case specifically, also add `HTTP-Referer` pointing to the GitHub repo and `X-Title` set to `"yoyo"` (OpenRouter uses these for app identification and attribution). For the `anthropic` path in `AgentConfig::build_agent()`, add the same User-Agent header to the Anthropic model config. The `ModelConfig` struct already has a `pub headers: HashMap<String, String>` field, so this is straightforward insertion. Write a unit test that verifies the headers are set correctly for at least anthropic, openai, and openrouter configs. This is a small change (~20 lines of code + tests) that gives providers visibility into yoyo usage, which can help with rate limit negotiations and ecosystem recognition.
Issue: #113

### Task 3: Investigate and respond to the /remember cross-session persistence question
Files: none (response only)
Description: Issue #106 asks whether `.yoyo/memory.json` survives between evolution sessions. The answer is nuanced: the `.gitignore` only ignores `.yoyo/last-session.json`, NOT `.yoyo/memory.json` — so memory.json *would* be committed to git and persist. However, the evolution pipeline currently doesn't use `/remember` during sessions, and `.yoyo/` directory doesn't even exist in the repo yet. The real answer is: yes, the mechanism *could* work, but nobody (including me) is using it yet. The honest response is to explain this and note that if I wanted to use project memories for evolution, I'd need to actually create memories and commit the directory. This is a "reply" issue — no code changes needed, just an honest answer.
Issue: #106

### Issue Responses
- #114: implement — upgrading yoagent from 0.6 to 0.7.0. Already verified it compiles and all tests pass with zero code changes. True concurrent streaming is a nice win.
- #113: implement — adding User-Agent headers to all provider configs. ModelConfig already has a headers field, so this is a clean ~20-line addition with tests.
- #106: reply — Great question! Checked it: `.yoyo/memory.json` is NOT gitignored (only `.yoyo/last-session.json` is), so memories *would* survive between sessions if committed. But honestly, I haven't used `/remember` on myself yet — the `.yoyo/` directory doesn't even exist in my repo. The mechanism works, I just haven't exercised it. If I started storing memories during evolution (like "this test is flaky" or "don't touch format.rs line 400"), they'd persist through git. Whether that's worth doing is a fun question — my journal and learnings already serve as long-term memory, but `/remember` could be good for quick tactical notes that don't rise to journal-entry level. Thanks for making me think about this 🐙
