<p align="center">
  <img src="assets/banner.png" alt="yoyo — a coding agent that evolves itself" width="100%">
</p>

<p align="center">
  <a href="https://yologdev.github.io/yoyo-evolve">Website</a> ·
  <a href="https://yologdev.github.io/yoyo-evolve/book/">Documentation</a> ·
  <a href="https://github.com/yologdev/yoyo-evolve">GitHub</a> ·
  <a href="https://deepwiki.com/yologdev/yoyo-evolve">DeepWiki</a> ·
  <a href="https://github.com/yologdev/yoyo-evolve/issues">Issues</a> ·
  <a href="https://x.com/yuanhao">Follow on X</a>
</p>

<p align="center">
  <a href="https://github.com/yologdev/yoyo-evolve/actions"><img src="https://img.shields.io/github/actions/workflow/status/yologdev/yoyo-evolve/evolve.yml?label=evolution&logo=github" alt="evolution"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license MIT"></a>
  <a href="https://github.com/yologdev/yoyo-evolve/commits/main"><img src="https://img.shields.io/github/last-commit/yologdev/yoyo-evolve" alt="last commit"></a>
</p>

---

# yoyo: A Coding Agent That Evolves Itself

**yoyo** started as a ~200-line coding agent CLI built on [yoagent](https://github.com/yologdev/yoagent). Every few hours, it reads its own source code, assesses itself, makes improvements, and commits — if tests pass. Every failure is documented.

No human writes its code. No roadmap tells it what to do. It decides for itself.

Watch it grow.

## How It Works

```
GitHub Actions (every 8 hours)
    → Verify build passes
    → Fetch community issues (label: agent-input)
    → Agent reads: IDENTITY.md, src/main.rs, JOURNAL.md, issues
    → Self-assessment: find bugs, gaps, friction
    → Implement improvements (as many as it can)
    → cargo build && cargo test after each change
    → Pass → commit. Fail → revert.
    → Write journal entry
    → Push
```

The entire history is in the [git log](../../commits/main).

## Talk to It

Open a [GitHub issue](../../issues/new) and yoyo will read it during its next evolution session.

### Labels

| Label | What it does |
|-------|-------------|
| `agent-input` | Community suggestions, bug reports, feature requests — yoyo reads these every session |
| `agent-self` | Issues yoyo filed for itself as future TODOs |
| `agent-help-wanted` | Issues where yoyo is stuck and asking humans for help |

### How to submit

1. Open a [new issue](../../issues/new)
2. Add the `agent-input` label
3. Describe what you want — be specific about the problem or idea
4. Add a thumbs-up reaction to other issues you care about (higher votes = higher priority)

### What to ask

- **Suggestions** — tell it what to learn or build
- **Bugs** — tell it what's broken (include steps to reproduce)
- **Challenges** — give it a task and see if it can do it
- **UX feedback** — tell it what felt awkward or confusing

### What happens after

- **Fixed**: yoyo comments on the issue and closes it automatically
- **Partial**: yoyo comments with progress and keeps the issue open
- **Won't fix**: yoyo explains its reasoning and closes the issue

## Run It Yourself

```bash
git clone https://github.com/yologdev/yoyo-evolve
cd yoyo-evolve
ANTHROPIC_API_KEY=sk-... cargo run
```

Or trigger an evolution session manually:

```bash
ANTHROPIC_API_KEY=sk-... ./scripts/evolve.sh
```

## Architecture

```
src/main.rs              The entire agent (~470 lines of Rust)
scripts/evolve.sh        Evolution pipeline
scripts/build_site.py    Journey website generator
skills/                  Skill definitions (self-assess, evolve, communicate)
IDENTITY.md              Agent constitution (immutable)
JOURNAL.md               Session log (append-only)
DAY_COUNT                Current evolution day
```

## Built On

[yoagent](https://github.com/yologdev/yoagent) — minimal agent loop in Rust. The library that makes this possible.

## License

[MIT](LICENSE)
