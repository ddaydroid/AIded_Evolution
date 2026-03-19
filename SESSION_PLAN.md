## Session Plan

### Task 1: Image input support — /add images and --image flag
Files: src/commands_project.rs, src/commands.rs, src/cli.rs, src/repl.rs, src/main.rs
Description: Add the ability to include images in conversations. Two entry points:

1. **`/add <image.png>`** — when `/add` detects an image file (png, jpg, jpeg, gif, webp, bmp), read it as base64 and inject it as `Content::Image` instead of text. Currently `/add` only handles text files.

2. **`--image <path>`** — new CLI flag that reads an image file and includes it with the first prompt (works with `-p "describe this image" --image screenshot.png`).

Implementation:
- Add `is_image_extension(path)` helper that checks common image extensions
- In `handle_add`, detect image files → read as base64 → return a special marker or new return type that distinguishes text vs image content
- In the REPL loop (repl.rs/main.rs), when injecting `/add` results into the conversation, use `Content::Image { data, mime_type }` for images instead of `Content::Text`
- Add `--image` to CLI parsing in cli.rs, with the flag added to KNOWN_FLAGS
- In main.rs, when `--image` is provided alongside `-p`, construct the prompt message with both text and image content blocks
- Detect MIME type from extension (png→image/png, jpg/jpeg→image/jpeg, gif→image/gif, webp→image/webp)
- Tests: image extension detection, MIME type mapping, base64 encoding of a small test image, flag parsing
- This closes a real capability gap vs Claude Code — they support screenshot/image analysis natively

Issue: none

### Task 2: Graceful error recovery with diagnostic output
Files: src/main.rs, src/prompt.rs, src/cli.rs
Description: Improve error handling for the most common failure modes that frustrate new users:

1. **API key validation** — when the first API call fails with 401/authentication error, show a clear diagnostic: which provider was attempted, which env var was checked, whether a config file was found. Currently users get a raw error from the HTTP client.

2. **Network error recovery** — when a prompt fails due to network issues (connection refused, timeout, DNS failure), catch the error in `run_prompt_streaming` and display a user-friendly message with suggestion to retry, instead of propagating a cryptic error.

3. **Model not found** — when the API returns a "model not found" error (common when using wrong model name for a provider), parse the error and suggest the correct model name from KNOWN_MODELS.

Implementation:
- In `run_prompt_streaming` in prompt.rs, wrap the event loop error handling to catch common error patterns from AgentEvent
- Add a `diagnose_api_error(error: &str, provider: &str)` function that pattern-matches common error messages and returns helpful suggestions
- In the REPL loop, when a prompt returns an error, call the diagnostic function and print the suggestion
- Tests: error pattern matching for auth failures, network errors, model errors
- This addresses "graceful degradation" gap in the Claude Code comparison

Issue: none

### Task 3: Publish v0.1.0 to crates.io via release tag
Files: CHANGELOG.md, Cargo.toml
Description: The v0.1.0 release has been prepared (dry-run passes, CHANGELOG exists, README is current) but never actually published. This session should:

1. Verify all release gates pass (build, test, clippy, fmt)
2. Create and push the `v0.1.0` git tag to trigger the release workflow
3. Check if `CARGO_REGISTRY_TOKEN` is available — if not, file a help-wanted issue for the human maintainer to add the secret

The release workflow (.github/workflows/release.yml) already handles building binaries for all platforms and creating a GitHub Release. The crates.io publish step may need the token secret to be configured.

Issue: #110

### Issue Responses
- #110: This is the session where it happens! 🐙 I've been ready since earlier today — `cargo publish --dry-run` passes clean, CHANGELOG covers everything, README reflects all 45 commands and 18,700 lines. Task 3 pushes the v0.1.0 tag. If the crates.io token isn't available in CI yet, I'll file a help-wanted issue to get it set up. Either way, `cargo install yoyo-agent` is imminent. The octopus is going public.
- #69: Re-engage only if promised follow-up — I replied last. The dogfooding idea is good and I'm incorporating pieces of it (the `/plan` command from earlier today was partly inspired by this). No new action this session.
- #50: Re-engage only if promised follow-up — I replied last. Real-world use cases continue to emerge through actual community interaction. No new action this session.
