<img width="1920" height="560" alt="Banner_2" src="https://github.com/user-attachments/assets/262732f0-587e-4c41-b2fe-f5420df736ca" />

# AI Familiar - Unity Editor Plugin

A powerful AI development assistant integrated directly into the Unity Editor — it reads your code, edits your scenes, and imports assets without leaving Unity.

**No subscription. No credits. No markup.** Bring your own API key for the major cloud AI providers or run a free local model — you pay your provider directly and see real per-message costs in-editor. It's a development assistant for your Editor workflow, **not** a runtime SDK for adding AI to your shipped game.

## Why AI Familiar?

Why not just use a desktop AI coding tool with a free Unity MCP bridge?

- **No external tooling** — no Node install, no separate MCP server process, no second IDE to alt-tab to. It runs in the same window as your scene.
- **Read-only investigation by design** — every request starts by inspecting your project with read-only tools before anything is proposed.
- **Every mutation is diff-reviewed** with one-click revert (Unity Undo-tracked).
- **Editor-native** — it understands scenes, GameObjects, components, materials, and prefabs, not just text files.
- **No subscription, no credits, no markup** — bring your own key or run a local model, and pay your provider directly.

## Features

- **Integrated Chat Interface**: Chat with AI directly inside Unity Editor
- **Persistent Chat Sessions**: Full conversation history with execution plan persistence. Resume interrupted tasks, review past executions, and continue conversations seamlessly across Unity sessions and domain reloads
- **Modern UX**: Slash commands (`/fix`, `/explain`, `/test`, plus local `/compact`, `/context`, and `/new-chat` that execute on Enter), `@`-context picker, inline diff view, model selector, execution progress rail, keyboard shortcuts, conversation history sidebar, **conversation tabs** for switching between open conversations, a card-based **Activity Transcript** with an ambient status rail, and optional **clarifying-question** + **plan-summary** cards so the agent can confirm intent before acting
- **Live Task Checklist**: For multi-step work, the assistant maintains a visible checklist above the conversation — each step shows as pending (○), in progress (▶), done (✓), or cancelled (✗), updating live while it investigates or executes a plan. Saved with the conversation and survives editor recompiles.
- **Visual Context (Screenshots)**: One-click capture of the Game or Scene view, attached to the next request so the LLM can reason about what you see
- **Drag-and-Drop Context**: Drag GameObjects from the Hierarchy or files from the Project window into the chat to attach them as references for the AI.
- **Live Scene & Editor Access (Native Tool Use)**: When using a tool-capable model (Claude 4.x or GPT-5.x), the AI can call into the Editor directly — inspect the active scene's hierarchy, read GameObject components, read material properties, modify GameObjects and assets, run tests, or recompile — as part of investigating your request and carrying out approved actions. All mutations are Unity Undo-tracked, so Ctrl-Z reverts any change the AI makes. Menu-item execution is opt-in via Settings ▸ Scene/Editor Tools ▸ Allow Menu Execution. Discovery tools let the AI enumerate project files by glob (`list_files`), search for files semantically (`find_files_semantic`), list all scene assets (`list_scenes`), and walk a scene's hierarchy on demand at any depth (`get_scene_hierarchy`) instead of relying on a pre-loaded snapshot.
- **Import Assets from Your Local Asset Store Cache**: The AI can list the `.unitypackage` files you have already downloaded via Unity's Asset Store and import one directly — Unity's own import-selection dialog appears as the approval step. If a package isn't downloaded yet, the AI provides a store search link and can retry once you've clicked Download in Package Manager ▸ My Assets. Silent import (no dialog) is available as an opt-in in Settings ▸ Execution ▸ Asset Import.
- **Code & Scene Editing** (after you approve an action or plan):
  - **Code Editing**: Intelligently edit existing scripts with full context
  - **File Management**: Create, delete, and modify files automatically
  - **Scene Operations**: Create and modify GameObjects, add components, and create assets (Materials, Prefabs)
    - **Robust targeting**: Works with inactive objects and supports full hierarchy paths (e.g., `Parent/Child/ObjectName`) to disambiguate names
    - **Active scene preference**: Resolves names in the active scene before other loaded scenes to avoid collisions
    - **Interactive resolution**: If an object isn’t found, the agent can suggest candidates from the scene and ask you to confirm the correct one
    - **Persistence**: Scene modifications mark the scene dirty so changes persist after save/reload
    - **Apply materials**: Apply an existing Material asset to a GameObject’s Renderer via `apply_material`
      - Supports multi-material renderers via optional `material_index` (0-based). If omitted, applies to all slots.
      - Materials can be resolved by `material_path`, `material_name`, or derived names from the GameObject (e.g., `NameMaterial`, `Name_Material`, `Name`).
  - **Prefab Editing**: Open a prefab asset, modify it (components, transforms, child structure), and save it back — changes apply to the prefab itself, so every instance updates
- **Plans for Complex Tasks**: Plan and execute complex tasks with multiple steps
  - **Step-by-step approval** (default): Approve the plan, then review each generated file change before it is applied
  - **Auto-approve**: Apply file changes without pausing at each step — the plan itself still needs your approval, and changes stay revertable
  - **Optimized planning**: Large tasks are bundled into fewer external steps (up to 10), and each step can include multiple internal actions
  - **Internal progress**: When a step contains multiple actions, the output shows per-action progress (e.g., `Internal step i/N: ...`)
  - **Domain reload resilience**: Execution can resume after Unity recompiles scripts / reloads the domain
  - **Retry resilience**: Timeouts are classified for retry backoff, and scene operations allow an extra retry attempt before stopping
- **Context Awareness**:
  - **Project Knowledge Base**: Automatically scans and understands your project structure
  - **Smart Context**: Includes relevant files, console logs, and selected objects in the prompt
  - **Context Window Tracking**: Real-time display of token usage (e.g. `Context: 12k / 200k (6%)`) with visual color coding (gray/orange/red) based on the selected model's limits, and a hover tooltip breaking usage down by system prompt, tool definitions, history, and your current message. When a conversation gets close to the limit, older turns are automatically summarized (with a status notice) to keep it going. You can also compact on demand by typing `/compact`, or print the current breakdown into the transcript with `/context`
  - **Semantic File Relevance**: Class outlines are embedded in the background and blended with keyword scoring so the right files surface even when the prompt doesn't name them explicitly. Embeddings work with every provider setup: OpenAI and Local use their own embeddings API, Google uses Gemini embeddings (billed to your Google key), and Claude uses a configured OpenAI key for embeddings if you've added one (disclosed in Settings — without one, semantic features simply skip)
  - **Project Map**: Generate a one-time LLM architectural summary of your project (Settings > Project Map). Once cached, it is prepended to every prompt so the AI understands your project's shape from the first message
  - **Reads Your Project's Own Rule Files**: Also loads `CLAUDE.md` / `AGENTS.md` / `AGENT.md` from your project root plus any `.md` files under `.cursor/rules/` or `.claude/rules/`, so instructions you already maintain for other AI coding tools apply here too. On by default; toggle off in Settings ▸ Memory
  - **Smart Triage**: Every request runs through one analysis turn — the assistant investigates with read-only tools, then decides whether to answer, recommend a single direct action, or propose a multi-step plan. Ambiguous requests get a clarifying question instead of a guess
- **Project Memory**: A persistent, human-readable memory of your project that survives across conversations and Unity sessions, stored under `Assets/AiFamiliarData/Memory/`.
  - **`MEMORY.md`**: a curated file that's entirely yours to edit — commit it to share conventions, architecture decisions, and known pitfalls with your team. AI Familiar only scaffolds it once on first enable and never overwrites your edits.
  - **Session logs**: dated files under `Memory/Sessions/` capture session summaries, plan outcomes, and durable lessons extracted automatically as older parts of a conversation are summarized — no extra API calls.
  - **Retrieval**: relevant snippets are pulled into every conversation's prompt automatically, and the assistant can search for more via the `memory_search` and `memory_get` tools.
  - **On by default** — manage everything from Settings ▸ Memory: a master toggle, capture/injection knobs, a file browser (Preview / Open / Delete), and a manual Rebuild Index button.
- **Multi-Provider Support**:
  - **OpenAI**: GPT-5.6 family (`gpt-5.6-sol` (default), `-terra`, `-luna`, plus a Pro row for Sol), GPT-5.5 family (`gpt-5.5`, `gpt-5.5-pro`), GPT-5.4 family (`gpt-5.4`, `-mini`, `-nano`, `-pro`)
  - **Anthropic**: Claude Opus 5 (default), Sonnet 5, Opus 4.8, Opus 4.7, Sonnet 4.6, Haiku 4.5, Opus 4.5, Fable 5 — with extended and adaptive thinking
  - **Google Gemini**: Gemini 3.6 Flash (default), Gemini 3.5 Flash, Gemini 3.5 Flash-Lite, Gemini 3.1 Pro (Preview), Gemini 3.1 Flash-Lite — connects directly to Google's OpenAI-compatible endpoint (no proxy needed); supports native tool-calling
  - **Local LLMs**: Connect to OpenAI-compatible local servers via LM Studio
  - **Provider-First Picker**: The model selector groups models by provider — pick Anthropic, OpenAI, Google, or Local first, then choose from that provider's models.
- **Cost & Token Transparency**: The status footer shows live `$x · Nk tok` actuals for every chat/agent turn. Hover for a per-turn breakdown (input, output, cache read, cache write). Totals persist across sessions and tab switches. Cache-aware pricing — Anthropic cache-read tokens are billed at ~0.10× the input rate; cache-write at ~1.25×. Each completed reply also shows a small per-turn cost chip (e.g. `$0.014 · 12.3k in / 800 out`), and the footer total merges chat and plan-execution spend (hover for the breakdown).
- **Reliability**:
  - **Error Banner**: Errors that previously surfaced only in the Unity console now appear as a tinted banner just under the AI Familiar toolbar (blue = info, amber = warning, red = error). Actionable errors (e.g., failed conversation restore) include an inline Retry button. A rejected or mistyped API key shows a plain-language banner with an **Open Settings** button instead of raw HTTP JSON, and a quick connection check runs automatically before your first prompt with a never-verified provider — explaining common failures (invalid key, no credit, rate limited, local server unreachable, timeout).
  - **Embedding-Build Progress**: When an embedding build is running in the background (requires an embedding-capable provider — see Semantic File Relevance above), a live "Embedding X/Y files (Z%)" progress label and Cancel button appear in the status footer. Requests are batched 32 files at a time, so even a large project's first index builds in seconds.
- **Developer Experience**:
  - **Markdown Support**: Rich text formatting for clearer explanations. File paths and URLs in replies are clickable — project files ping in the Project window and open in your IDE; web links open in the browser. All reply text is selectable.
  - **Code Highlighting**: Syntax-highlighted code blocks for C#, JavaScript/TypeScript, JSON, and shell, with one-click Copy and Save
  - **Execution Transcripts**: Detailed logs of all AI actions
  - **Live Reasoning & Tool Activity**: Claude's thinking streams into collapsible cards and every tool call shows a live activity card, in true chronological order — toggleable in Settings ▸ Keys ▸ Transcript Transparency
  - **Light & Dark Editor Theme**: The window and every surface it opens (settings, setup wizard, diff viewer, message bubbles, cards, pickers) follow Unity's Editor Theme (Preferences ▸ General ▸ Editor Theme). Switch themes and reopen the window to apply.
  - **Post-Update Setup Check**: After importing a new version, a quick setup health scan runs automatically and opens a Setup Check window with one-click fixes if anything needs attention — missing .gitignore protection, no API key configured, a stale default model, duplicate plugin copies, and more. Run it anytime via **Tools ▸ AI Familiar ▸ Run Setup Check**.
  - **LLM request/response logging**: Proxy logs request metadata and collected responses for debugging

## Installation

1. Clone or download this repository into your Unity project's `Assets` folder (or install via UPM if packaged).
2. Open Unity Editor.
3. Go to `Window > AI Familiar` to open the window.
4. A **setup wizard** opens automatically on first launch (if no API key is configured yet). Follow the three steps — pick a provider, paste your key, and click **Test Connection** — then click **Get started** to begin chatting. You can reopen the wizard at any time via **Tools ▸ AI Familiar ▸ Setup Wizard** or the **Run setup wizard** button in Settings ▸ Keys. The wizard also offers a **zero-cost path** — a guided free **Local (LM Studio)** option and per-provider key-creation links, with **Google Gemini's free tier** highlighted as the fastest no-cost cloud start.

**UPM (Git URL) note**: Git-based UPM installs are treated as *immutable* by Unity. Your UPM package must include `.meta` files (including folder metas and `package.json.meta`), otherwise Unity will log errors like `... has no meta file, but it's in an immutable folder. The asset will be ignored.`

## Updating

- **UPM installs**: update through the Package Manager as usual — the package is replaced wholesale, nothing to clean up.
- **`.unitypackage` installs**: delete the `Assets/AiFamiliar/` folder before importing the new version. This is completely safe — your conversations and settings live in `Assets/AiFamiliarData/`, and your API keys live in `Library/AiFamiliarCache/api_keys.json` (with an EditorPrefs backup) alongside other caches under `Library/AiFamiliarCache/`, all outside the plugin folder. After the import everything reconnects automatically.

## Configuration

### API Keys
1. Click the settings icon (⚙) in the AI Familiar window header.
2. Go to the **Keys** tab and enter your OpenAI, Anthropic, or Google Gemini API key.
3. (Optional) Configure Local LLM settings if using LM Studio.
4. Click **Test Connection** to verify your key reaches the provider.

No proxy or AWS account is required for Claude, OpenAI, or Gemini cloud models. Paste your key and go.

Your keys are saved to `Library/AiFamiliarCache/api_keys.json` — outside the `Assets/` folder, so they are never committed to source control and never included in a build. They are sent only directly to the provider you select, never to us.

> **Distribution note**: The Asset Store package ships as a compiled, obfuscated editor-only assembly (`AiFamiliar.Editor.dll`) — a finished, supported tool rather than a source-code framework. It bundles the following MIT-licensed third-party components: Newtonsoft.Json (Json.NET), Microsoft.CodeAnalysis / Microsoft.CodeAnalysis.CSharp (Roslyn), System.Collections.Immutable, System.Reflection.Metadata, and System.Runtime.CompilerServices.Unsafe — full license texts in `Third-Party Notices.txt` at the package root.

The Settings window shows **Keys**, **Models**, and **About** by default. Toggle **Show advanced settings** at the top of the Settings window to reveal the **Context**, **Conversations**, **Execution**, and **Memory** tabs. This keeps the initial setup simple without hiding any options.

### About Tab
Open the settings icon (⚙) and select the **About** tab to see the installed plugin version, package ID, author, and Unity compatibility — handy when reporting an issue.

### Connection Mode (Settings ▸ Proxy Configuration)
Controls how cloud requests reach the provider:

- **Auto** (default): Claude and local models go direct to the API when no Proxy URL is configured; if a Proxy URL is set the proxy is used — zero regression for existing deployments.
- **Direct**: Always bypass the proxy, even if a Proxy URL is configured.
- **Proxy**: Always route through the configured AWS Lambda (server-side key custody / self-hosted backstop).

Going direct removes the Lambda's 15-minute execution ceiling. Long-running requests (extended thinking, large multi-step plans) are no longer capped by Lambda's maximum execution time.

### Proxy (Optional - AWS Lambda)
A proxy is no longer required. If you prefer server-side key custody or already have a Lambda deployed, it continues to work with no client-side changes.

If you use the included AWS Lambda proxy, its files ship inside the package's own `Proxy/` folder (`Packages/com.cfirz.aifamiliar/Proxy/` for UPM installs, `Assets/AiFamiliar/Proxy/` for `.unitypackage` installs):

- **Important**: When updating the plugin, redeploy your Lambda using the latest `index.mjs` from that folder (Node.js 20, streaming via `awslambda.streamifyResponse` — OpenAI requests are routed via the **OpenAI Responses API**, and the request/response shaping lives in the Lambda). Run `sam build && sam deploy` from the Proxy folder.
- **Setup / testing guides** (in the same folder):
  - `PROXY_SETUP_GUIDE.md`
  - `LAMBDA_TESTING_GUIDE.md`

### Reasoning Controls (Optional)
- **OpenAI o-series**: Set **Reasoning Effort** (low/medium/high) to control reasoning depth.
- **Claude**: Set **Thinking Budget (tokens)** to request extended thinking (0 = use provider default).

### Rate-Limit Mitigation (Claude Users)
Anthropic enforces an input-tokens-per-minute limit that varies by account tier. Multi-step plans and multi-roundtrip investigations can exceed it during normal use. AI Familiar ships several mitigations, all on by default:

- **Prompt Caching** (`Settings > Prompt Caching`, default on): the tool definitions, system prompt, and the growing conversation are sent as cacheable blocks. Repeat tool round-trips within a turn — and steps 2+ of a plan — reuse the cache, dramatically cutting billable input tokens; cached reads don't count against the rate-limit bucket at all.
- **Rate-Limit Pacer** (`Settings > Rate Limit Pacing`, default on): tracks a rolling 60-second window of input tokens (reconciled to the actual tokens Anthropic counted once each response arrives) and proactively delays requests that would exceed the budget. The budget is **auto-detected** (default, `rateLimitBudgetTpm = 0`) from Anthropic's `anthropic-ratelimit-input-tokens-limit` response header (~90% of the limit) after the first successful request; you can override it with a manual `rateLimitBudgetTpm` value instead. A visible countdown appears in the status bar during any delay.
- **AutoContextMode** (`Settings > Auto Context Mode`, default JIT):
  - **Eager**: include all detected files upfront (legacy behavior).
  - **Balanced**: include the selection file and user-referenced files only; the model fetches other files via `read_file` on demand.
  - **JIT** (default): send nothing upfront; the model pulls everything via tools on demand. Adds roughly one extra roundtrip for simple edits but saves 3–6k tokens per request and keeps input volume lowest against your rate limit. Previously labelled "Lazy" — existing saved settings are unaffected.
- **Preflight Trim** (`Settings > Preflight Input Token Budget`, default 20000): if the assembled prompt exceeds the budget, large file bodies are capped and the model is directed to use `read_file` for the rest.
- **Network Tuning** (`Settings > Execution > Network Tuning`): five previously-hardcoded values are now editable — **Max Rate-Limit Retries** (default 4, range 0–10), **Retry Cap** (default 75s, range 5–600s), **Stream-Idle Timeout** (default 300s, range 30–600s), **HTTP Timeout** (default 10 min, range 1–15 min — plan generation and chat), and **Step Execution Timeout** (default 3 min, range 1–15 min — individual multi-step requests). The two minute-based timeouts bound only the time to receive the first response, so they never cut off a healthy in-progress stream. Changes take effect on the next request.

If you have a higher Anthropic tier, you can raise `rateLimitBudgetTpm` to match your actual limit, or disable individual mitigations in Settings.

### How It Works (Unified Assistant)
There is no mode to choose. Just type what you want — the assistant investigates your project with read-only tools first, then responds one of three ways, and **nothing is changed until you click a button**:
- **Answer** — for questions and explanations: a normal reply, nothing to approve.
- **Direct action** — for a small, single change: a lightweight card with **Take action** (applies the change, then you accept or reject the diff) and **Make a plan instead**.
- **Plan** — for multi-step work: a plan card with **Approve / Revise / Reject**. By default, execution pauses at every file-change step for your approval; turn on the **Auto-approve** toggle to apply file changes without pausing (you can still review or revert individual files afterwards).
- **Tool access**: With a tool-capable model selected and Settings ▸ Native Tool Use enabled (default), the assistant reads project files, inspects/modifies the scene, runs tests, and manages packages. Local (LM Studio) models can join in too — enable **Use Native Tools for Local** in Settings ▸ Execution (requires a function-calling-capable model).

### Session Management
- **Conversation History**: All conversations are automatically saved and persisted across Unity sessions.
- **Execution Plan Tracking**: Each conversation stores its execution plan history with timestamps, completion status, and results.
- **Resume Execution**: Switch between conversations without losing progress. Active plans are automatically restored with full state.
- **Context Usage Display**: Monitor token usage in real-time based on your selected model's context window (e.g., Claude Haiku 4.5: 200k; Claude Opus 5 / Opus 4.8 / Sonnet 4.6: 1M; Gemini 3.x: 1,048,576; GPT-5.6: 1.05M; GPT-5.4: 400k tokens).

## What the Assistant Can Do

When you approve a direct action or a plan, the AI can perform the following actions:

- **Edit Files**: Modify existing scripts (e.g., "Add a jump method to PlayerController.cs")
- **Create Files**: Create new scripts or assets (e.g., "Create a new Enemy script")
- **Delete Files**: Remove obsolete files (e.g., "Delete the old test script")
- **Scene Operations**:
  - **Create GameObjects**: "Create a red Cube at (0, 1, 0)"
  - **Instantiate Prefabs**: "Spawn the Enemy prefab at (5, 0, 5)"
  - **Modify GameObjects**: "Add a Rigidbody to the Player and set its layer to 'Player'"
  - **Manage Objects**: "Delete the 'TempObject' and disable the 'LoadingScreen'"
  - **Create Assets**: "Create a blue material in Assets/Materials"
  - **Edit Prefabs**: "Add a Rigidbody to the Player prefab" — the prefab asset is opened, changed, and saved

## Requirements

- Unity 6 (6000.0) or later
- Active internet connection (for cloud models)
- API key from OpenAI, Anthropic, or Google Gemini (or local LLM setup via LM Studio)
- No AWS account or proxy deployment required — the direct path is the default

## License

Distributed under the Unity Asset Store End User License Agreement. Bundled third-party components (Newtonsoft.Json and the Microsoft Roslyn/.NET libraries) are used under the MIT License — see `Third-Party Notices.txt` at the package root for the full license texts.
