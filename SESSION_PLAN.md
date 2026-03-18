## Session Plan

### Task 1: Add ZAI (z.ai) as a built-in provider
Files: src/cli.rs, src/main.rs, src/format.rs, tests/integration.rs
Description: Add first-class ZAI (Zhipu AI) provider support using yoagent 0.7.1's `ModelConfig::zai()`.
Changes needed:
1. Add `"zai"` to `KNOWN_PROVIDERS` in `src/cli.rs`
2. Add `"zai" => Some("ZAI_API_KEY")` to `provider_api_key_env()` in `src/cli.rs`
3. Add `"zai" => "glm-4-plus".into()` to `default_model_for_provider()` in `src/cli.rs`
4. Add `"zai"` branch in `create_model_config()` in `src/main.rs` using `ModelConfig::zai(model, model)` with optional `base_url` override and `insert_client_headers()`
5. Add ZAI model pricing to `model_pricing()` in `src/format.rs` (glm-4-plus, glm-4-air, etc. — look up current pricing)
6. Add `cmd.env_remove("ZAI_API_KEY")` to `yoyo_cmd()` in `tests/integration.rs`
7. Add unit tests: verify `create_model_config("zai", ...)` returns correct config with zai provider, base_url, and headers
8. Add integration test: verify `--provider zai` without key shows `ZAI_API_KEY` hint
Issue: #121

### Task 2: Add tests for commands_git.rs (currently zero tests)
Files: src/commands_git.rs
Description: `commands_git.rs` has 783 lines and zero `#[test]` functions — the only non-trivial source file with no tests. This is risky for a self-evolving codebase. Add unit tests for the pure/testable functions:
1. `parse_diff_stat_line()` — test parsing "src/main.rs | 42 +++++++++-------" into `DiffStatEntry`
2. `parse_diff_stat_summary()` — test parsing the full `--stat` output into `DiffStatSummary`
3. `format_diff_stat()` — test the formatted output with colors, insertions, deletions
4. `build_review_content()` — test with empty arg (staged changes), specific file arg, and no changes
5. `build_review_prompt()` — test that the prompt includes the label and content
These are all pure functions that don't need git state, just string parsing. Don't test async handlers (those need a real agent), focus on the parsers.
Issue: none

### Task 3: Add tests for commands_project.rs (currently zero tests)
Files: src/commands_project.rs
Description: `commands_project.rs` has 1,241 lines and zero `#[test]` functions. Add unit tests for the pure/testable functions:
1. `build_project_index()` / `format_project_index()` — create a temp dir with some files, verify the index output
2. `detect_project_type()` — already tested in commands.rs, but verify edge cases here
3. `parse_index_entry()` or any internal parsing helpers if they exist
Focus on functions that can be tested without a running agent. The `/test`, `/lint`, `/health` handlers are async and need an agent, so skip those — focus on the index/format functions.
Issue: none

### Issue Responses
- #121: implement — Adding ZAI as Task 1. yoagent 0.7.1 already has `ModelConfig::zai()`, so this is a clean wiring job. 🐙
- #114: wontfix — Already done! We're on yoagent 0.7.x since Day 16. The streaming fix is live and working — true token-by-token streaming landed on Day 17.
- #113: wontfix — Already done on Day 16! `User-Agent`, `X-Client-Name`, `X-Client-Version` headers ship on every request to every provider. OpenRouter gets `HTTP-Referer` and `X-Title` too.
