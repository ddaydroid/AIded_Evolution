# Architecture

This page maps yoyo's internals — how the source files relate to each other, how user input flows through the system, and how the streaming agent pipeline works. Each section includes a [mermaid](https://mermaid.js.org/) diagram and a brief explanation.

## Module Dependency Graph

The codebase lives in `src/` as a set of focused modules. Here's how they depend on each other:

```mermaid
graph TD
    main["main.rs<br/><i>entry point, AgentConfig,<br/>build_agent, tool wiring</i>"]
    repl["repl.rs<br/><i>interactive REPL loop,<br/>tab completion, readline</i>"]
    cli["cli.rs<br/><i>arg parsing, Config,<br/>permissions, config files</i>"]
    commands["commands.rs<br/><i>core command handlers,<br/>dispatch, help, cost</i>"]
    commands_git["commands_git.rs<br/><i>/commit, /diff, /undo,<br/>/pr, /git, /review</i>"]
    commands_project["commands_project.rs<br/><i>/add, /fix, /test, /lint,<br/>/tree, /find, /web, /plan</i>"]
    commands_session["commands_session.rs<br/><i>/save, /load, /export,<br/>/spawn, /mark, /jump</i>"]
    prompt["prompt.rs<br/><i>agent execution, event loop,<br/>retry logic, SessionChanges</i>"]
    format["format.rs<br/><i>colors, MarkdownRenderer,<br/>cost calc, Spinner, diffs</i>"]
    git["git.rs<br/><i>git operations, branch<br/>detection, commit, PR</i>"]
    memory["memory.rs<br/><i>project memories,<br/>load/save/format</i>"]
    docs["docs.rs<br/><i>docs.rs fetching,<br/>HTML parsing</i>"]

    main --> cli
    main --> repl
    main --> commands_session
    main --> commands_project
    main --> prompt
    main --> format

    repl --> cli
    repl --> commands
    repl --> format
    repl --> git
    repl --> prompt

    commands --> cli
    commands --> format
    commands --> git
    commands --> prompt
    commands --> commands_git
    commands --> commands_project
    commands --> commands_session
    commands --> memory

    commands_git --> commands
    commands_git --> format
    commands_git --> git
    commands_git --> prompt

    commands_project --> cli
    commands_project --> commands
    commands_project --> docs
    commands_project --> format
    commands_project --> prompt

    commands_session --> cli
    commands_session --> commands
    commands_session --> format
    commands_session --> prompt

    prompt --> cli
    prompt --> format

    git --> format

    style main fill:#2d6a4f,stroke:#1b4332,color:#fff
    style repl fill:#264653,stroke:#1d3557,color:#fff
    style prompt fill:#6a040f,stroke:#370617,color:#fff
    style format fill:#7b2cbf,stroke:#5a189a,color:#fff
    style cli fill:#e76f51,stroke:#c1440e,color:#fff
    style commands fill:#457b9d,stroke:#1d3557,color:#fff
    style commands_git fill:#457b9d,stroke:#1d3557,color:#fff
    style commands_project fill:#457b9d,stroke:#1d3557,color:#fff
    style commands_session fill:#457b9d,stroke:#1d3557,color:#fff
    style git fill:#606c38,stroke:#283618,color:#fff
    style memory fill:#606c38,stroke:#283618,color:#fff
    style docs fill:#606c38,stroke:#283618,color:#fff
```

**Layered design.** The modules form rough layers:

- **Entry layer** — `main.rs` parses args via `cli.rs`, builds the agent, and hands off to `repl.rs` (interactive) or runs a single prompt (piped/`-p` mode).
- **REPL layer** — `repl.rs` owns the readline loop and dispatches `/` commands to handler functions.
- **Command layer** — `commands.rs` is the hub, re-exporting handlers from three sub-modules (`commands_git.rs`, `commands_project.rs`, `commands_session.rs`). Each sub-module groups related commands.
- **Engine layer** — `prompt.rs` runs the agent, processes the streaming event channel, handles retries and context overflow. `format.rs` renders everything to the terminal.
- **Utility layer** — `git.rs`, `memory.rs`, and `docs.rs` are leaf modules with no upward dependencies into the command or REPL layers.

## REPL Command Dispatch

When a user types a `/` command in the REPL, here's how it reaches the right handler:

```mermaid
flowchart TD
    input["User types input"]
    trim["Trim whitespace,<br/>check for multi-line"]
    slash{{"Starts with /<br/>?"}}
    match["Match against<br/>command patterns<br/>in repl.rs"]

    quit["/quit, /exit → break loop"]
    help["/help → commands::handle_help()"]
    model["/model → commands::handle_model_show()<br/>/model X → rebuild agent"]
    save["/save → commands::handle_save()"]
    git_cmds["/commit → commands_git::handle_commit()<br/>/diff → commands_git::handle_diff()<br/>/pr → commands_git::handle_pr()"]
    proj_cmds["/add → commands_project::handle_add()<br/>/fix → commands_project::handle_fix()<br/>/test → commands_project::handle_test()<br/>/tree → commands_project::handle_tree()"]
    sess_cmds["/spawn → commands_session::handle_spawn()<br/>/export → commands_session::handle_export()<br/>/mark → commands_session::handle_mark()"]
    unknown["is_unknown_command() →<br/>print suggestion"]
    agent["Send as natural language<br/>→ prompt::run_prompt()"]

    input --> trim --> slash
    slash -->|Yes| match
    slash -->|No| agent
    match --> quit
    match --> help
    match --> model
    match --> save
    match --> git_cmds
    match --> proj_cmds
    match --> sess_cmds
    match -->|"No match but<br/>starts with /"| unknown
```

The dispatch is a single large `match` block in `repl.rs::run_repl()`. Commands that need the agent (like `/fix`, `/spawn`, `/pr`) are `async` and receive a mutable reference to the agent. Pure-display commands (like `/help`, `/tokens`, `/marks`) just print and `continue`.

Anything that isn't a recognized `/` command gets sent to the LLM as a natural-language prompt through `prompt::run_prompt()`.

## Agent Event Pipeline

When a prompt is sent to the LLM, yoyo streams events through a channel. Here's the flow from prompt to terminal:

```mermaid
sequenceDiagram
    participant User as User / REPL
    participant Prompt as prompt.rs
    participant Agent as yoagent::Agent
    participant LLM as LLM API
    participant Renderer as MarkdownRenderer
    participant Terminal as Terminal (stdout/stderr)

    User->>Prompt: run_prompt(input)
    Prompt->>Agent: agent.prompt(input)
    Agent->>LLM: HTTP streaming request
    Agent-->>Prompt: UnboundedReceiver<AgentEvent>
    Note over Prompt: Spinner starts

    loop For each event from channel
        LLM-->>Agent: SSE stream chunk
        Agent-->>Prompt: AgentEvent

        alt ToolExecutionStart
            Prompt->>Terminal: "▶ tool_name(args)" in yellow
            Note over Prompt: Start timer, track file changes
        else ToolExecutionEnd
            Prompt->>Terminal: "✓" or "✗" + duration
        else ToolExecutionUpdate
            Prompt->>Terminal: Partial output (dimmed)
        else MessageUpdate::Text
            Prompt->>Renderer: render_delta(delta)
            Renderer->>Terminal: ANSI-colored markdown
        else MessageUpdate::Thinking
            Prompt->>Terminal: Thinking text (dimmed, stderr)
        else AgentEnd
            Note over Prompt: Accumulate usage,<br/>check for errors
        else InputRejected
            Prompt->>Terminal: Error message in red
        end
    end

    Prompt->>Prompt: Check retriable/overflow errors
    Prompt-->>User: PromptOutcome {text, usage, errors}
```

**Key details:**

- **Spinner** — a background spinner runs until the first event arrives, so the user sees activity during the initial API roundtrip.
- **MarkdownRenderer** — renders streaming text deltas into ANSI-colored output. Handles code blocks with syntax highlighting, headers, bold/italic, and inline code — all incrementally as tokens arrive.
- **File change tracking** — `SessionChanges` records every `write_file` and `edit_file` tool call so `/changes` can show what was modified.
- **Auto-retry** — if a tool fails, the prompt automatically retries up to 2 times with error context. Transient API errors (429, 5xx) retry with exponential backoff. Context overflow triggers auto-compaction.
- **Ctrl+C** — caught via `tokio::select!`, calls `agent.abort()` to cancel the in-flight request gracefully.

## CLI Argument Flow

How command-line arguments become a running agent:

```mermaid
flowchart LR
    args["CLI args<br/>(std::env::args)"]
    config_file[".yoyo.toml<br/>or YOYO.md"]
    parse["cli::parse_args()<br/>→ Config"]
    agent_config["AgentConfig<br/>{model, provider,<br/>api_key, thinking,<br/>permissions, ...}"]
    build["AgentConfig::build_agent()<br/>→ yoagent::Agent"]
    configure["configure_agent()<br/>system prompt, tools,<br/>skills, limits"]
    provider{{"Provider?"}}
    anthropic["AnthropicProvider"]
    google["GoogleProvider"]
    openai_compat["OpenAI-compatible<br/>(OpenAI, OpenRouter,<br/>Ollama, xAI, Groq,<br/>DeepSeek, Mistral, ...)"]
    mcp["Connect MCP servers<br/>(--mcp flags)"]
    openapi["Load OpenAPI specs<br/>(--openapi flags)"]
    mode{{"Mode?"}}
    repl_mode["repl::run_repl()"]
    prompt_mode["Single prompt<br/>→ prompt::run_prompt()"]
    piped_mode["Piped stdin<br/>→ prompt::run_prompt()"]

    args --> parse
    config_file --> parse
    parse --> agent_config
    agent_config --> build
    build --> provider
    provider -->|anthropic| anthropic
    provider -->|google| google
    provider -->|others| openai_compat
    anthropic --> configure
    google --> configure
    openai_compat --> configure
    configure --> mcp --> openapi
    openapi --> mode
    mode -->|"interactive<br/>(stdin is tty)"| repl_mode
    mode -->|"--prompt / -p"| prompt_mode
    mode -->|"piped stdin"| piped_mode
```

**The flow in detail:**

1. **`parse_args()`** in `cli.rs` merges three sources: CLI flags, config file (`.yoyo.toml`), and environment variables. It produces a `Config` struct with every setting resolved.
2. **`main()`** converts the `Config` into an `AgentConfig` (the subset needed to build agents) and calls `AgentConfig::build_agent()`.
3. **`build_agent()`** selects the right provider backend based on the `--provider` flag (defaulting to Anthropic), then calls `configure_agent()` to apply the system prompt, tools, skills, thinking level, and execution limits.
4. **Tool wiring** — `build_tools()` in `main.rs` wraps yoagent's `default_tools()` with permission checks and directory restrictions. If `--yes` is set or the mode is non-interactive, tools auto-approve.
5. **MCP and OpenAPI** — if `--mcp` or `--openapi` flags are present, servers are connected before entering the main mode.
6. **Mode selection** — interactive (REPL), single-prompt (`-p`), or piped mode. The REPL can also resume a previous session with `--continue`.
