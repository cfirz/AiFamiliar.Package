# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.48.0] - 2026-07-29

### Added
- **Prefab Editing**: The assistant can now open a prefab asset, change it (add/remove components, adjust transforms, rename or restructure children), and save it back — previously only scenes could be edited this way. While a prefab is open, inspection follows it inside: the hierarchy walk can target the prefab's contents and object searches include them, so the assistant works against the real prefab instead of guessing from its serialized text.

### Changed
- **Plan Steps Now Actually Perform Scene and Prefab Work**: Previously, a plan step describing a scene or prefab change (e.g. "add a Rigidbody to the Player prefab") could be marked "✓ completed" without making any change at all — the step-execution format had no way to express scene/prefab mutations, so the assistant silently produced nothing. Steps now use the same editor tools the assistant already has for scenes and prefabs, and finish with a plain summary of what was done.
- **No-Op Steps Are Now Retried, Then Honestly Failed**: A step that makes zero changes gets one retry with corrective guidance before being reported as a real failure, instead of being falsely marked complete. A step that answers with an invented operation name is likewise rejected and re-prompted rather than being accepted as "nothing to do". Weaker or less capable local models may see more step failures than before — those failures are real; previously they were hidden.
- **Step Results Describe What Actually Happened**: Instead of a generic "Staged changes for" message (sometimes with no file name at all), a completed step now lists the editor operations performed or the file that was changed.
- **Tool Activity Now Shows During Plan Steps**: With "Show Tool Activity" enabled, plan-step execution now displays the same live tool-activity cards already shown during investigation and single actions.
- **.gitignore Protection Now Covers the Whole Plugin Data Folder**: Setup previously listed individual entries (API-keys backup, settings folder, conversations). It now excludes `Assets/AiFamiliarData/` as a whole, plus its `.meta` file, so rules, session logs, and anything else the plugin writes locally stay out of your repository too — with one deliberate exception: the curated `Memory/MEMORY.md` (and its `.meta`) stays tracked, since it's meant to be committed and shared with your team. Projects that already ran the setup will see the prompt once more, offering to update their `.gitignore`.
- Scene and prefab files referenced by a plan step are no longer inlined into the request as raw text — they're pointed to for the assistant to inspect and edit via tools instead, saving tokens on plans that touch scenes.

## [1.47.1] - 2026-07-29

### Changed
- **Clearer Preflight Input Budget tooltip**: reworded to describe what the setting does rather than naming an internal component.

## [1.47.0] - 2026-07-26

### Added
- **Live Task Checklist**: For multi-step work, the assistant now maintains a visible task checklist — a collapsible "Tasks" pane above the conversation shows each step as pending (○), in progress (▶), done (✓), or cancelled (✗), updating live while the assistant investigates or executes a plan. The checklist is saved with the conversation, survives editor recompiles, and clears automatically when older conversation turns get summarized.
- **/compact Command**: Type `/compact` (or pick it from the slash-command menu) to summarize older conversation turns on demand instead of waiting for the automatic trigger — useful before pasting something large or when the context meter runs hot. It shows progress, can be cancelled, frees an estimated token count, and also works when automatic summarization is turned off.
- **/context Command**: Type `/context` to print the context-window breakdown for this conversation into the transcript — the same numbers as the footer meter's tooltip (system prompt, tool definitions, history, current message), without sending anything to the model.
- **Post-Update Setup Check**: After you import a new version of the plugin, AI Familiar now notices the version change and runs a quick setup health scan. If anything needs attention it opens a Setup Check window listing each item with a one-click fix — missing .gitignore protection, no API key configured (when the default model isn't local), proxy mode without a URL, a saved default model that's no longer in the catalog, the deprecated lessons toggle still on, or two copies of the plugin in the project. The window also has an on-demand "Test connection" button, and the same check can be run anytime via Tools > AI Familiar > Run Setup Check. It prompts once per version, stays silent when everything passes, and steps aside when the first-run wizard is about to handle setup instead.

### Changed
- **Slash Commands Now Run on Enter**: Typing a local command like `/compact`, `/context`, or `/new-chat` and pressing Enter now executes it directly. Previously only picking from the popup worked — a typed command was sent to the AI as a chat message.
- **.gitignore Protection Now Covers Conversations and Backups**: The "Setup .gitignore Protection" button (Settings and the setup wizard) now also adds `Assets/AiFamiliarData/Conversations/*` (conversation history) and `/Backups/` (the plugin's file-backup folder at the project root) alongside the existing API-key entries, so none of it ends up in your repository. Projects that already ran the setup will see the banner again once, offering to add the new entries.
- **.gitignore Prompt Actually Appears in New Projects**: The Settings banner and setup-wizard note previously only showed when a `.git` folder sat directly at the Unity project root — so projects whose repository root is a parent folder, or projects not yet under git, were never prompted. Git detection now walks parent directories, and even with no repository at all the prompt still appears (as a gentler notice) so the exclusions are in place before your first commit. The `.gitignore` is always written at the Unity project root, which git honors from a parent repository too.

### Fixed
- **Chat Cost Was Reported as $0 for Tool-Using Turns**: Token usage from turns where the assistant investigates with tools (which is every normal question on Claude, GPT, and Gemini) was silently dropped — the footer total, per-turn cost chips, and saved conversation totals all read zero, and only plan-execution spend ever showed up. Every tool round-trip is now counted and summed correctly per turn, a turn that fails partway (e.g. a rate limit mid-investigation) still records the rounds that ran, and plan steps now report their real token usage instead of a rough text-length estimate.

## [1.46.2] - 2026-07-19

### Added
- **Project Memory**: AI Familiar now keeps a persistent, human-readable memory of your project under `Assets/AiFamiliarData/Memory/` — a curated `MEMORY.md` you can edit and commit to share with your team, plus dated session logs that capture session summaries, plan outcomes, and durable lessons automatically as part of normal conversation summarization (no extra API calls). Relevant snippets are pulled into every conversation automatically, and the assistant can search for more with two new tools, `memory_search` and `memory_get`. On by default — manage it from the new Settings ▸ Memory tab: a master toggle, knobs for what gets captured and injected, a file browser (Preview / Open / Delete), and a manual Rebuild Index button. The previous lessons system (embedding-only, no readable file) is deprecated in favor of this; turning its legacy toggle off migrates old lessons into a session log automatically.
- **Context Usage Tooltip**: Hovering the status footer's context meter now shows a breakdown of where the tokens are going for the next request — system prompt, tool definitions, conversation history, and your current message.
- **Reads Your Project's Own Rule Files**: In addition to its own Rules folder, AI Familiar now also loads `CLAUDE.md` / `AGENTS.md` / `AGENT.md` from your project root plus any `.md` files under `.cursor/rules/` or `.claude/rules/` — so instructions you already maintain for other AI coding tools apply here too. Toggle off in Settings ▸ Memory if you'd rather it didn't.

### Changed
- **Long Conversations Compact Sooner When Needed**: Alongside the existing message-count trigger, conversations now also summarize older turns when the estimated next request gets close to the model's context window (default trigger: 80% of the window, adjustable in Settings ▸ Memory), with a status notice explaining what happened.

### Fixed
- **Approval Card Icon No Longer Corrupts After Recompiles**: The "Approval required" / "Accepted" / "Rejected" card titles (and the ambient rail's blocked-state dot) used a pause glyph that Unity renders as broken blocks after a domain reload — recompiling scripts or running editor tests would corrupt the icon on already-drawn cards. They now use reload-safe glyphs (‖ / ✓ / ✗).

## [1.46.1] - 2026-07-12

### Fixed
- **Text No Longer Clipped at Card Edges**: Wrapping text in cards could overrun the card's right padding and get clipped at the window edge — affecting markdown bullet lists (including "Next Steps"), plan-card step rows, and plan-summary decision rows. The text now shrinks and wraps correctly inside the card.
- **Setup Wizard Now Appears in Every New Project**: The first-run setup wizard could fail to auto-open in a brand-new project if you had ever finished (or dismissed) it in any other project on the same machine — the "already completed" flag was stored machine-wide. It is now remembered per project, so every fresh project without a configured key gets the guided setup. Projects that already have a key are unaffected.
- **Project-Map Progress Window No Longer Sticks Around**: After generating the Project Map from Settings ▸ Project Memory, the progress dialog could stay open indefinitely (eventually relabeled "Importing assets" by Unity, with a climbing "busy for…" timer) even though generation had finished and the editor kept working normally. Progress updates queued during generation could re-open the bar after it was closed; they are now ignored once the operation completes.

## [1.46.0] - 2026-07-06

### Added
- **Light & Dark Theme Support**: The AI Familiar window and every surface it opens — settings, the onboarding wizard, the diff viewer, message bubbles, cards, and pickers — now follow Unity's Editor Theme (Preferences ▸ General ▸ Editor Theme). On the Light theme the plugin renders light-on-light-safe with dark text instead of a fixed dark panel; the Dark theme is unchanged. (Switch themes and reopen the window to apply the new theme.)
- **Clickable Links in Answers**: File references in the assistant's replies are now clickable — bare paths like `Assets/Scripts/Player.cs` (including ones in backticks), `[text](url)` links, and web URLs. Clicking a project file pings it in the Project window and opens scripts in your IDE; web links open in the browser. All reply text is now selectable, too.
- **Better Diff Viewer**: The file-diff window is now a single unified inline view (like GitHub/VS Code) instead of two unsynced side-by-side panes — added/removed/context lines in one scroll, with line numbers for both sides, +/− markers, and syntax highlighting. The line pairing uses a proper diff algorithm, so small edits in large files show tight, readable changes.
- **Tiered Settings Inspector**: Selecting the AI Familiar settings asset now shows a grouped inspector — Basic (connection, model, tool use, transparency), Behavior (gates, memory, context mode, caching), and a collapsed Tuning section for the numeric knobs and network timeouts, with a "Reset tuning to defaults" button. Nothing about how settings are stored changed.

- **Welcome Card with Starter Prompts**: New and empty conversations now open with a short welcome card explaining the three ways the assistant responds (answer / quick ⚡ action / plan — nothing changes without your approval) plus clickable starter prompts like "What's in my currently open scene?" that submit with one click. It disappears the moment the conversation has real content and never clutters saved conversations.
- **"Don't have an API key?" Setup Path**: The first-run wizard now includes a zero-cost branch — a guided free Local option (LM Studio download and model-catalog links, with guidance to pick a tool-calling-capable model, and a one-click "Use Local (free)" switch) plus per-provider key-creation links, with Google Gemini's free tier called out as the fastest no-cost cloud start. Provider help URLs throughout the wizard are now clickable buttons instead of plain text.
- **Per-Turn Cost Chip**: Each completed assistant reply now shows a small dimmed line with what that turn actually cost and its token counts (e.g. "$0.014 · 12.3k in / 800 out"), persisted with the conversation so it survives recompiles. Free (Local) turns stay chip-less.
- **One Merged Cost Total**: The footer cost now includes plan-execution spend alongside chat spend, with a tooltip breakdown ("Chat $X + Plans $Y = $Z"). Previously plan cost appeared only on the plan's summary card and the footer total silently understated real spend; conversations whose only activity was a plan showed no total at all.
- **Rate on the Asset Store**: After the 5th successfully completed plan, a one-time dismissible card asks whether you'd like to leave a review (shown once ever — dismissing or ignoring it means it never returns). A permanent **Tools ▸ AI Familiar ▸ Rate on Asset Store** menu item is always available.
- **Plain-Language Connection Errors with One-Click Recovery**: A rejected or mistyped API key now shows a clear banner ("Your ⟨provider⟩ API key was rejected. It may have been revoked or mistyped.") with an "Open Settings" button, instead of raw HTTP error JSON. Before your first prompt with a provider that has never connected successfully, a quick connection check now runs automatically and explains common failures in plain language — invalid key, out of credit, rate limited, LM Studio not reachable at the configured address, or a timeout. A rejected key during plan execution is also no longer retried pointlessly.
- **Heads-Up When a Model Can't Take Actions**: Models without live tool support (for example Local models with tool use disabled) now show a one-time notice explaining that the assistant will answer questions only, with a link to the setting that enables actions and plans. Providers whose tool phase doesn't stream (Gemini, Local) now show an "Investigating…" status during it instead of appearing frozen.

### Changed
- **Long Conversations Open Instantly**: Reopening a conversation with hundreds of entries no longer freezes the editor while every card is built. The most recent 150 entries render immediately; older ones load on demand via a "Load earlier" button at the top, streamed in the background.
- **Much Cheaper Multi-Step Claude Turns (Prompt Caching)**: Claude requests now cache the tool definitions, system prompt, and the growing conversation across the tool round-trips of a turn. Repeat rounds re-read the prior context at a fraction of the input price, and cached reads don't count against Anthropic's rate-limit budget — so long investigations are both cheaper and throttled less. The system prompt is also assembled stable-part-first so consecutive prompts reuse the cache too.
- **"Take action" Builds on the Investigation**: When the assistant recommends a change after investigating your project, executing that change now receives the investigation's findings (what was read, what was concluded) instead of starting a fresh investigation — noticeably faster and cheaper single actions.
- **Semantic Features Now Work with Claude and Gemini**: Semantic file search, documentation discovery, prior-lesson recall, and conversation memory previously did nothing unless OpenAI or a Local model was the selected chat provider — silently, while the settings hint claimed otherwise. Now Google chat uses Gemini's own embeddings (billed to your Google key), and Claude chat uses a configured OpenAI key for embeddings (clearly disclosed in Settings; never without a key you entered, and never when Enable Semantic Search is off). Adding a key now takes effect immediately, without restarting the editor.
- **Embedding Calls Are Batched**: Building the semantic file index used to send one HTTP request per file — a 500-file project meant 500+ sequential calls right after setup. Requests now go out 32 at a time, and conversation embedding saves the conversation once per batch instead of once per message.
- **Better, Cheaper Embedding Model**: Embeddings upgraded from `text-embedding-ada-002` to `text-embedding-3-small` — measurably better retrieval at roughly a fifth of the price. Existing indexes rebuild automatically (one-time, and cheap now that calls are batched). Stored plan lessons reset once, since they were recorded in the retired model's embedding space.

### Fixed
- **Tool Results No Longer Trimmed Before the Model Reads Them**: On turns where the assistant issued several tool calls at once, the transcript-trimming that keeps long turns under rate limits could remove tool results the model had not seen yet — it paid for the calls and never got the answers. Results newer than the model's last reply are now never trimmed.
- **The Assistant Can Read What It Discovers**: File discovery could surface documentation paths (`Docs/`, `Packages/`, root markdown files) that the read-file tool then refused to open, because reading was restricted to `Assets/`. Read access now covers those project-local paths (with the same traversal protections); write access is unchanged.
- **Budget-Capped Turns Can Still Recommend an Action**: Hitting the tool-roundtrip cap used to force a text-only answer even when the assistant had already identified the fix. The wrap-up round now keeps the recommend-action tool available, so you still get the one-click action card.
- **Finished Step Cards No Longer Spin Forever After a Script Recompile**: When a plan step that wrote or edited a script triggered a recompile, the transcript card for that step (and its "Compiling · apply + recompile" card) could keep showing the spinning Running badge indefinitely, even though the step had actually finished. Cause: the code that marked those cards done ran after the recompile started, and the recompile's domain reload could destroy that code before it ran. Reopening the conversation now repairs any leftover spinning cards against the plan's real, saved status before they're redrawn.
- **Rate-Limit Pacer No Longer Over-Throttles**: The client-side pacer that spaces out requests to avoid tripping Anthropic's input-token rate limit was still targeting a retired 28,000-token/minute ceiling, stalling multi-step tool turns for 40-55 seconds even on accounts with much higher limits. It now auto-detects your account's real limit from Anthropic's response headers (falling back to a much higher default before the first response arrives), and cached prompt reads no longer count against its budget. The console notice for an active pacing delay also now appears once per wait instead of once per second. Existing settings migrate automatically — no action needed.
- **Icons No Longer Distort After a Script Recompile**: After a domain reload, several window icons could render corrupted — the settings gear squashed into a blob, the plan rail's pause/stop buttons going blank, and occasional giant glyph artifacts overlapping the tab strip. Cause: these were Unicode symbols served by the OS emoji fallback font, whose glyph atlas breaks on reload. The gear is now Unity's built-in settings icon, pause/stop are drawn as plain shapes, and the state-badge symbols were moved to reload-safe text glyphs.
- **Plans No Longer Get Stuck After a Script Recompile**: When a plan step created or edited a script, the resulting recompile could restore the plan into its pre-approval state — the step counter reset and execution silently never resumed. Three fixes land together: the plan's "executing" status is now written to disk the moment you approve (and plan-state saves are no longer skipped when conversation auto-save is off); after a recompile the restore keeps whichever snapshot is further along instead of blindly trusting the disk copy, repairing the stale one in place; and the restore no longer saves its own half-loaded state back over the good copy. Interrupted mid-call steps still halt safely for an explicit retry/skip/abort, and cancelled plans still stay cancelled.
- **`run_tests` Tool Actually Filters and Reports Failures**: The AI's `run_tests` tool documented substring filtering but performed exact-name matching — a natural filter like "RateLimitPacer" silently ran zero tests. Filters now match substrings of test full names as documented. Failed tests now return their assertion message and the first stack-trace line (previously only the test name), and a run that matches zero tests says so explicitly instead of reporting an empty success.
- **Silently Dropped Status Messages**: Several notifications were routed through a retired renderer and never appeared anywhere. Most visibly, clicking the attach-screenshot button with no Game or Scene view open did nothing at all — it now shows a warning banner explaining what to do. Cancelling a plan and a transactional plan failing ("rolled back") now leave a permanent card in the conversation transcript instead of vanishing, so you can still see what happened after switching tabs or a recompile.

## [1.45.0] - 2026-07-02

### Added
- **Watch the Assistant Think and Work**: For Claude models, the assistant's reasoning now streams into dimmed, collapsible "thinking" cards, and every tool it runs shows a live activity card — so you can follow the investigation in real time instead of waiting on a spinner. Both are on by default and toggleable under Settings ▸ Keys ▸ Transcript Transparency. Showing thinking changes only visibility, not billing.
- **Adjustable Tool Budget with Graceful Wrap-Up**: The number of tool round-trips the assistant may use per turn is now configurable (Settings ▸ Execution ▸ Network Tuning, default 16). Hitting the cap no longer fails the turn — the assistant is asked to wrap up with a best-effort answer from what it has already gathered.

### Changed
- **One Unified Assistant — no more Chat / Agent / Multi-Step modes**: The mode toggle is gone. Just type what you want; the assistant investigates your project with read-only tools first, then responds one of three ways — and nothing is changed until you click a button:
  - **Answer** — for questions and explanations: a normal reply, nothing to approve.
  - **Direct action** — for a small, single change: a lightweight card with **Take action** (applies it, then you accept or reject the diff) and **Make a plan instead**.
  - **Plan** — for multi-step work: the familiar plan card with **Approve / Revise / Reject**.
  - **Clarifying question** — when your request is ambiguous, the assistant asks one question with clickable option buttons instead of guessing; your pick re-runs the analysis.
- **Native Tool-Use for Local LLMs**: Local (LM Studio) models can now use live tools — read files, inspect the scene, recommend actions and plans — just like the cloud providers. Enable **Use Native Tools for Local** in Settings ▸ Execution. Requires a local model that supports function-calling (e.g. Qwen, Llama 3.1).
- **Chronological Transcript Log**: When the assistant investigates using multiple tool calls, its narration now appears as a true timeline — a bit of reasoning, then the tool cards for what it just did, then the next bit of reasoning — instead of one long reply dumped at the end. Reopening a past conversation replays the same interleaved order.
- **Friendly Tool Names in Activity Cards**: Tool-activity cards and the status rail now show plain-language labels ("Reading file", "Searching", "Updating component") with a category icon, instead of raw tool names like `read_file` or `get_scene_hierarchy`.
- **Thinking Cards Stay Open**: Extended-thinking cards no longer auto-collapse once the model finishes reasoning — the reasoning stays visible until you collapse it yourself via the card's chevron.
- **Flat, Selectable Prompt Bubbles**: Your own messages in the transcript now render as a single flat color instead of a bubble-within-a-bubble, while remaining fully selectable text.

### Fixed
- **Staged Changes Survive Mid-Commit Recompiles**: A script recompile that landed while a transactional plan's file changes were being committed could orphan staging files or leak a stale pending-changes list into the next plan. Commit cleanup now completes before the reload can interrupt it, leftovers from an interrupted run self-heal with a warning banner, and a re-apply after a reload can no longer overwrite the original backups.
- **Stray Tool Cards No Longer Appear in Conversations**: Tool-activity cards from background work (including one run's cards bleeding into every open conversation, and cards emitted by internal test runs) no longer pollute your open conversations or replay after a recompile.

## [1.44.0] - 2026-06-26

### Added
- **First-Run Setup Wizard**: The first time you open AI Familiar without an API key configured, a setup wizard now opens automatically and gets you started in three steps — pick your provider (OpenAI, Anthropic, Google, or Local), paste your API key (or set a Local base URL), and click **Test Connection** to confirm it reaches the provider — then **Get started** drops you straight into chat with that provider's default model selected. You can reopen it any time via **Tools ▸ AI Familiar ▸ Setup Wizard** or the **Run setup wizard** button in Settings ▸ Keys.
- **Import Assets from Your Local Asset Store Cache**: When native tool-use is enabled, the AI can now list and import `.unitypackage` files you have already downloaded from the Unity Asset Store — no scripting required.
  - **List downloaded packages**: the AI calls `list_downloaded_asset_packages` to scan your local Asset Store download cache and show package names, publishers, categories, sizes, and modification times. If a package you need isn't there, the AI will give you a direct Asset Store search link and ask you to Download it via Package Manager ▸ My Assets, then re-scan.
  - **Import a package**: `import_asset_package` triggers Unity's own import-selection dialog (the standard approval step). After import, the AI uses `list_files` / `find_files_semantic` to locate the new content and can place it in the scene via `add_asset_to_scene`.
  - **Silent import** (advanced): `import_asset_package(interactive:false)` skips the dialog and requires the new **Allow Silent Asset Import** toggle in Settings ▸ Execution ▸ Asset Import (default off). Silent import is irreversible — not Undo-tracked. Packages containing scripts will trigger a domain reload after import.
  - Security: only packages inside a recognized Asset Store cache directory may be imported — the tool refuses arbitrary disk paths.

### Changed
- **Simpler Settings for New Users**: The Settings window now shows only the **Keys**, **Models**, and **About** tabs by default. The advanced tabs (**Context**, **Conversations**, **Execution**, **Project Memory**) are revealed by a **Show advanced settings** toggle at the top of the window — so first-time setup isn't overwhelming, while every option stays one click away.
- **Menu Execution Toggle in Settings**: The **Allow Menu Execution** setting (which gates the `execute_menu_item` tool) can now be toggled from Settings ▸ Execution ▸ Scene / Editor Tools, instead of only by editing the settings asset in the Inspector. Still off by default.

## [1.43.0] - 2026-06-06

### Added
- **Google Gemini Models**: Google is now a fully functional provider. Pick **Google** in the model picker and choose **Gemini 3.5 Flash** (default), **Gemini 2.5 Pro**, **Gemini 2.5 Flash**, or **Gemini 3.1 Flash-Lite**. Enter a Google AI Studio API key in Settings ▸ Keys (**Google Gemini API Key**) and use Gemini across Chat, Agent, and Multi-Step modes — including **native tool-calling** (live `read_file` / scene / project tools), with accurate token + cost tracking in the status footer.
  - Connects directly to Google's **OpenAI-compatible** endpoint — no proxy/Lambda needed (Gemini is always direct).
  - Native tool-use uses the Chat-Completions `tool_calls` format, collected from the (non-streaming) response for deterministic dispatch.
  - Gemini embeddings are not wired yet, so semantic file search is skipped while Gemini is your selected provider — select OpenAI (or a Local LLM) as your provider if you want semantic search (see "Embeddings Follow Your Selected Provider" under Changed).
- **Claude Opus 4.8**: Anthropic's latest Opus model (`claude-opus-4-8`) is now available and is the new default model. It supports adaptive thinking (like Opus 4.7), a 200K context window, and native tool-use. Opus 4.7 / 4.5 / 4.1, Sonnet 4.6, and Haiku 4.5 all remain selectable; existing saved selections are unaffected.
- **Provider-First Model Picker**: Instead of one long flat list of every model, the picker now groups models by provider — pick **Anthropic**, **OpenAI**, **Google**, or **Local (LM Studio)** first, then choose from only that provider's models. The model selector is a button at the bottom-left of the prompt box that opens provider tabs + the filtered model list; the Settings ▸ Models ▸ Default Model picker is provider-first too. **Google** is fully wired (see the Google Gemini entry above).
- **Direct API Connection (No Proxy Required)**: Claude and OpenAI cloud requests can now go direct to the provider — no AWS Lambda deployment needed. Enter your API key in Settings ▸ Keys and start using the plugin immediately. Local LLMs were already direct.
  - New **Connection Mode** setting (Settings ▸ Proxy Configuration): `Auto` (default) — goes direct when no Proxy URL is set, otherwise uses the configured proxy, so existing proxy deployments keep working with zero changes; `Direct` — always bypass the proxy even if one is configured; `Proxy` — always route through the Lambda (server-side key custody / self-hosted backstop).
  - OpenAI direct path includes the full Chat → Responses API request reshaping that was previously handled by the Lambda, implemented in a new `OpenAIResponsesRequestBuilder`.
  - **Important**: going direct removes the Lambda's 15-minute execution ceiling — long-running requests (extended thinking, large plans) now run as long as needed, constrained only by the stream-idle timeout.
  - **Test Connection** button in Settings ▸ Keys sends a minimal probe through the actual request path and shows a green/red result.
- **Live Cost & Token Display**: The status footer now shows real token usage and cost actuals (`$x · Nk tok`) for every chat/agent streaming turn, with a per-turn breakdown in the tooltip. Costs persist across sessions and tab switches.
  - New `ConversationCostTracker` correctly MAX-merges token counts across Anthropic's split `message_start`/`message_delta` callbacks, avoiding both double-counting and the naive last-wins zero-input bug.
  - Cache-aware pricing via `TokenEstimator.CostFromUsage`: Anthropic cache-read tokens priced at ~0.10× the input rate, cache-write at ~1.25×. OpenAI and Local billed at the standard flat rates.
  - Five new fields persisted on `Conversation`: `cumulativeInputTokens`, `cumulativeOutputTokens`, `cumulativeCacheReadTokens`, `cumulativeCacheWriteTokens`, and `cumulativeCostUsd` — restored when a tab is reopened.
  - Multi-Step mode cost accounting is unchanged (reported via `ExecutionSummary.estimatedCost`); these two sources are disjoint and never double-counted.
- **Tier-Aware Rate-Limit Budget**: `RateLimitPacer` now auto-detects your Anthropic tier from the `anthropic-ratelimit-input-tokens-limit` response header on successful Claude responses (90% of the header value is used as the effective budget). Manual `rateLimitBudgetTpm` override still wins when set; falls back to the 28,000 default when neither is available. The `rateLimitBudgetTpm` tooltip documents the `0 = auto-detect` behavior.
- **About Tab in Settings**: A new **About** tab in the Settings window shows the installed plugin version (plus package ID, author, and Unity compatibility), so it's easy to confirm which version you're running for support and bug reports. The version resolves correctly whether installed via UPM, `.unitypackage`, or run from source.
- **Drag-and-Drop References**: Drag GameObjects from the Hierarchy or files/assets from the Project window directly onto the chat composer to attach them as references for your next message. Attached items appear as removable chips with a shared "Clear all" button, and a drop overlay guides you while dragging. Text files are inlined as context; GameObjects are resolved at send time, so they survive renames and moves.

### Changed
- **Embeddings Follow Your Selected Provider**: Semantic search now uses only your selected provider's embedding API instead of silently falling back to OpenAI. On Claude or Gemini (which don't expose an embeddings API) semantic search is skipped cleanly rather than making surprise OpenAI calls — so a stale or invalid OpenAI key no longer triggers repeated 401 auth errors while you're using another provider. OpenAI and Local LLM users are unaffected.

### Fixed
- **Plugin Now Loads When Imported Into a New Project**: The packaged plugin previously failed to load on import — Unity reported `Unable to resolve reference 'Microsoft.CodeAnalysis.CSharp'` (and `Microsoft.CodeAnalysis`) and disabled the entire assembly. The build now bundles the Roslyn assemblies that the C# code-analysis features depend on — `Microsoft.CodeAnalysis`, `Microsoft.CodeAnalysis.CSharp`, and the `System.*` assemblies they load at runtime — under `Editor/Roslyn/`, so both the UPM package and the `.unitypackage` import and load cleanly with no manual steps.
- **Agent-Mode Answers Render as Text, Not Raw JSON**: When Agent mode answered a question directly ("no plan needed"), the reply could appear as a raw JSON action object (`{"action":"comment_only","comment":"..."}`) instead of the formatted answer — both live and, after a reload or reopening the conversation from History. Agent-mode replies are now parsed into their human-readable text everywhere, and the formatted result is persisted so it survives a project reload or history reopen.
- **Fresh Chat on Editor Launch**: AI Familiar now opens a clean, empty conversation each time you start the Unity Editor instead of auto-restoring your last chat. (Recompiling/domain reloads still preserve your in-progress conversation — only a full editor restart starts fresh.) An existing empty chat is reused when available, so blank tabs don't accumulate.
- **Cancelled Plans No Longer Re-Run on Reload**: Cancelling a multi-step plan now persists correctly, so the cancelled plan is no longer recovered and re-executed after every domain reload — which previously could re-trigger background embedding work (and 401 spam against an invalid OpenAI key).

## [1.42.0] - 2026-05-31

Close-out of deferred backlog items: configurable request timeouts, code-block syntax highlighting, and reliability/test polish.

### Added
- **Configurable Request Timeouts** (`Settings > Execution > Network Tuning`): two new fields — **HTTP Timeout** (default 10 min) for plan generation and chat, and **Step Execution Timeout** (default 3 min) for individual multi-step requests, each 1–15 minutes. They bound the time to *receive the first response* (header fetch); the streaming generation itself is still governed by the separate Stream-Idle Timeout, so changing them can never cut off a healthy in-progress response. A request that exceeds the timeout now reports an actionable error pointing at the setting.
- **Syntax Highlighting in Code Blocks**: generated code blocks for C#, JavaScript/TypeScript, JSON, and shell now render with colored keywords, strings, comments, and numbers (previously plain monospace). Other languages fall back to plain text. Code blocks are now colorized read-only text — use the existing **Copy** / **Save** buttons to extract code.

### Changed
- **Error Banner No Longer Loses Stacked Notifications**: when a new banner replaces one that is still showing (e.g. during cascading failures), the previous message is carried over as a compact "(also: …)" prefix instead of vanishing silently. The banner also keeps the higher severity's color and dismissal behavior when a lower-severity message overwrites a still-shown error.

## [1.41.0] - 2026-05-31

### Added
- **Four New JIT Discovery Tools**: When native tool-use is enabled, the AI can now locate project content on demand without receiving a preloaded dump:
  - `list_files(glob, max)` — enumerate any files in the project matching a glob pattern (e.g. `Assets/**/*.unity`, `Docs/**/*.md`). Returns paths only; pair with `read_file` for content. Default 200 results, hard cap 1000. Excludes Library/Temp/.git/meta files automatically.
  - `find_files_semantic(query, top_k, kind)` — semantic search using the project's embedding index. Natural-language queries ("where is the audio mixer code?") match files by meaning, not just keywords. Optional `kind` filter: `script`, `doc`, or `any`. Returns `indexReady: false` when the index is still building so the AI falls back to `grep`/`list_files` gracefully.
  - `list_scenes()` — lists every `.unity` scene asset in the project with its build-settings index and current load state. Useful before calling `load_scene`.
  - `get_scene_hierarchy(scene_path?, root_path?, depth, max_nodes, include_components)` — walks a loaded scene's GameObject tree at a configurable depth (default 3, max 2000 nodes). Pass `root_path` to page into a deep subtree. Returns an error with guidance when the scene is not loaded.
- **Documentation Files in Semantic Search** (`Settings > Documentation Indexing > Index Documentation Files`, default on): `*.md` and `*.txt` files across the entire repo are now indexed alongside C# class outlines, making documentation discoverable via `find_files_semantic`. Disable if your project has large auto-generated doc trees you don't want indexed.
- **Cross-Scene Workflow Protocol**: A new built-in protocol in the system prompt teaches the AI the correct save → load → map → mutate → save sequence when working across multiple scenes. Only active when native tools are enabled.

### Changed
- **`AutoContextMode` "Lazy" renamed to "JIT"**: The option previously labelled "Lazy" is now labelled "JIT" (Just-In-Time) in Settings. The underlying value is unchanged — your existing saved settings migrate automatically with no action required.
- **Default context mode changed from Balanced to JIT**: New installs now default to JIT, which sends no file content upfront and lets the AI fetch what it needs via tools. This is the most effective mode for staying under Anthropic's tier-1 rate limit. If you have an existing project your saved mode is preserved.
- **Scene hierarchy snapshot in system prompt shrunk to roots only**: The `<SCENE_HIERARCHY>` block injected into the prompt is now roots-only with child and component counts (previously 2 levels / up to 200 lines). The AI uses `get_scene_hierarchy` to drill deeper when needed, saving roughly 1–2k tokens per request.
- **Tool roster summary in system prompt trimmed**: The per-tool enumeration inside the system prompt is replaced by a 2-line primer. The full tool schemas already travel in `request.tools`.
- **Tool-result elision tightened**: Old `tool_result` payloads are now replaced with an elision marker at 8,000 characters of accumulated content (previously 12,000). The number of recent results kept intact increased from 2 to 3, giving the AI a wider working memory at the tighter threshold.
- **Targeted requests skip expensive file retrieval**: When native tools are active and your message names a specific file, the keyword+semantic retrieval pass in the prompt builder is skipped — the AI fetches the file directly via `read_file`. Saves roughly 1–3k tokens on file-specific requests.

## [1.40.2] - 2026-05-31

T3.5 polish bundle — closes the deferred follow-ups from 1.40.0 and fixes two test infrastructure bugs that caused flaky failures on first run after C# changes.

### Fixed
- **Test Suite No Longer Stuck After a Crash**: `StepExecutorTests` used to leak an empty OpenAI API key into the global `EditorPrefs` if it crashed mid-test. Subsequent test runs failed with `api_key_missing` until the user manually re-entered the key in Settings. The fixture now snapshots the user's real EditorPref state at `[OneTimeSetUp]`, pins a known test value per `[SetUp]`, writes the empty test value directly to EditorPrefs (no longer via `SetApiKey`), and restores the original state at fixture exit even if any test throws.
- **Test Fixtures No Longer Race the Compiler**: `RateLimitPacerTests` and `RequestFactoryPromptCachingTests` now use the shared `TestHelpers.EnsureSettingsAvailableOrIgnore()` guard — when Unity is mid-compile and `AiFamiliarSettings.Instance` returns null, tests `Assert.Ignore` cleanly rather than throwing `NullReferenceException`. Extends the 1.39.1 fix that already covered `ConversationManagerTests` and `ProxyClientNetworkTuningTests`.
- **Agent-Mode Chat With Tools Could Write Empty Responses**: When the LLM finished the native-tool turn loop with only `tool_use` blocks (no JSON action body), the agent-mode chat path silently wrote an empty assistant message. Step execution had the same bug and shipped a workaround in 1.40.0; that workaround is now extracted into a shared helper (`NativeToolTurnLoop.EnsureJsonFinalizationAsync`) and reused by `ExecuteChatMode` when `_isAgentMode` is true. Non-agent chat is unchanged — free text without JSON has always been fine there.
- **`run_tests` / `add_package` Defensive Against Thread-Pool Continuations**: Both tools previously assumed the caller arrived on Unity's main thread. They now detect off-thread invocation via `EditorMainThreadDispatcher.IsOnMainThread` and hop to the main thread for the synchronous Unity API calls (`TestRunnerApi.Execute`, `ScriptableObject.CreateInstance`, `Client.Add`, callback registration, cleanup). The polling sections (`Task.WhenAny` / `Task.Delay`) stay thread-agnostic. The main-thread fast-path keeps zero overhead in the typical chat / plan / step-execution caller path.

### Changed
- **Truncation Marker In `get_gameobject` / `get_components` Output**: The `_truncated` sentinel was previously embedded as a JObject inside the `components` array, which the LLM occasionally treated as a real component. It now appears as sibling fields on the parent object (`componentsTruncated: true`, `componentsOmitted: N`, `componentsCap: 30`) so the array is homogeneous.
- **System Prompt — SHAPE-B References Removed When Tools Are Active**: The capability block (`SystemPrompts.ToolCallingInstructionsWithTools`) used to tell the model "prefer tools over SHAPE B missing_files". With native tools active, SHAPE B is moot — the model should just call `read_file`. References removed; the no-tools fallback prompt (`ToolCallingInstructions`) keeps its SHAPE-B guidance unchanged.
- **`PathResolver.Walk` Is Allocation-Free**: Tree-walking for hierarchy-path lookups used to allocate a string on every visited node via `sb.ToString()`. Now compares char-by-char against the target path. No behavior change; pure perf cleanup on large scenes.

## [1.40.1] - 2026-05-25

### Fixed
- **`editor_command` Step With `save_scene` No Longer Errors Out**: When native tools are active, the model sometimes emits a step with `action: editor_command, command_data.command_type: save_scene` instead of calling the native `save_scene` tool — the legacy dispatcher rejected this with `"Unknown command type: save_scene"`. Added a defensive bridge in `SceneOps.ExecuteCommand` so the legacy path saves the active scene in place when this happens. Save As (with an explicit path) still requires the native `save_scene` tool, which exposes `path` and `target_scene_path` arguments. New `SceneOpsSaveSceneTests` regression test included.
- **Multi-Step Plans No Longer Stall Forever After a Mid-Run Domain Reload**: A two-step plan whose Step 1 modified a C# file (triggering Unity assembly reload) would have its state correctly persisted and restored, but Step 2 never executed — the plan sat in `Executing` forever. Root cause was a delay-call ordering race in `AiFamiliarWindow.CreateGUI`: the post-reload resume check (`OnDelayedResumeCheck`) was registered against `EditorApplication.delayCall` *before* `LoadInitialConversation`, so on the same tick it fired first against the bootstrap orchestrator's default `Idle` state and silently no-op'd; by the time `LoadInitialConversation` restored `State=Executing, StepIndex=1`, nothing else triggered the resume. Resume is now driven from `OnConversationLoaded` after `RestoreExecutionPlanState`, which also fixes the related case where switching tabs to a conversation with a mid-flight plan didn't kick off `ResumeExecutionAsync`. Safe against duplicate loops via the existing `_isExecuting` guard in `AgentExecutionController.ResumeExecutionAsync` and the existing `HaltedOnFailure` short-circuit in `CheckAndResumeExecution`. New `DomainReloadResumeTests` locks in the contract.
- **No More Duplicate GameObjects When the LLM Adds a Child to a Populated Parent**: On an existing scene, asking the AI to "add a SelectButton to the UI panel" sometimes produced a *second* `SelectButton` sibling of an existing one. Root cause was a three-way gap: (1) `create_gameobject` had no parent-local duplicate check at the native-tool layer; (2) the only existing guard in `SceneOps.cs` was scene-*global*, so creating a same-named object under a different parent silently converted to a modify on the wrong target; (3) the LLM couldn't see what was already there — `AppendSceneHierarchy` walks only 2 levels and `get_gameobject` returned `childCount` but not child names. Fix: new `SiblingGuard` helper wires into `CreateGameObjectTool` and `AddAssetToSceneTool` and refuses the call with `error_code: "duplicate_sibling"` + `existing_path` + `existing_instance_id` when a child with the same name (case-insensitive) already exists under the target parent — pointing the LLM to `update_gameobject` instead. `get_gameobject` now takes `include_children: true` and returns up to 50 direct children (name, instance_id, active, childCount). The legacy `SceneOps` guard is tightened to parent-local. System prompts gained an explicit pre-flight rule. 9 new regression tests in `Phase1SceneToolsTests` and `Phase2MutationToolsTests`.
- **API Keys No Longer Disappear After a Unity Reimport All / Library Wipe**: `APIKeysConfig.Load()` had an ordering bug — when `Library/AiFamiliarCache/api_keys.json` was missing it saved an *empty* config to disk **before** the EditorPrefs-recovery step ran. So any operation that wiped `Library/` (Reimport All, build scripts, manual clean) left the cache file permanently zeroed even though EditorPrefs still held the user's keys. The in-memory singleton recovered, but next session the cycle repeated. Reordered: EditorPrefs recovery now runs before Save, and the file is re-written when recovery happens so the fix sticks. `Save` is also now atomic (write to `.tmp`, then `File.Replace` / `File.Move`) so a crash mid-write can no longer produce a truncated file, and `Save(null)` is now a guarded no-op. New `APIKeysConfigStorageTests` regression test.

## [1.40.0] - 2026-05-25

The big add this release: the AI can now inspect and modify the Unity Editor and the active scene directly via native tool-use — in Chat, Multi-Step planning, AND Multi-Step execution. Before, asking "what's on the Player object?" got back "I can't access the scene from here." Now it calls a tool, looks, and answers.

### Added
- **Editor & Scene Tool Surface (33 New Tools)**: When native tool-use is enabled (Settings ▸ Native Tool Use, default on, requires Claude or GPT-5.x), the LLM can call the following directly in Chat, Multi-Step planning, and Multi-Step execution:
  - **Inspect**: `get_scene_info` (active + additively loaded scenes), `find_gameobjects` (by name / tag / layer / component), `get_gameobject` (full snapshot including transform + components, with optional serialized field values), `get_components`, `select_gameobject`, `get_material_info`, `send_console_log`, `recompile_scripts`.
  - **Mutate (Unity Undo-tracked)**: `create_gameobject`, `update_gameobject`, `delete_gameobject`, `duplicate_gameobject`, `reparent_gameobject`, `set_transform_gameobject` (with `move_gameobject` / `rotate_gameobject` / `scale_gameobject` thin wrappers), `add_component`, `remove_component`, `update_component`, `create_material`, `assign_material`, `modify_material`, `create_prefab`, `add_asset_to_scene`, `create_scene`, `load_scene`, `save_scene`, `unload_scene`, `batch_execute` (atomic Undo group for multi-tool sequences), `run_tests`, `add_package`.
  - **Gated**: `execute_menu_item` — disabled by default behind the new **Allow Menu Execution** toggle (Settings ▸ Scene/Editor Tools). Menu items can enter Play Mode and trigger Build, so this requires explicit opt-in.
- **macOS ⌘ Shortcuts**: The Ctrl-based shortcuts (`Ctrl+Enter` to send, `Ctrl+K` for new conversation, `Ctrl+H` for history) now also accept ⌘ on macOS. Hint labels show the correct platform glyph.

### Fixed
- **"I Can't Access the Scene From The Planning Step"**: The system-prompt capability block no longer tells the LLM it has zero tool access — it enumerates the live tool roster when native tool-use is active. Models were declining scene questions because they trusted that statement; they now reach for `find_gameobjects` / `get_gameobject` instead.
- **Step Execution No Longer Empties Out When the Model Stops on Tool Calls**: A model that finished the native-tool turn loop without emitting any JSON would leave step execution with an empty response and a "No JSON found in response" parse error. Step execution now detects that case and sends one tool-free follow-up round explicitly asking for the step's JSON action object, recovering the workflow without losing the prior tool context.
- **Obfuscated Package Builds Lost JSON Keys**: Four call sites that built ad-hoc request and log objects via anonymous types serialized to wire JSON with renamed keys after the package's obfuscation pass — surfacing as Anthropic 400 `tool_choice.type: Field required` errors and a crash in the proxy's redacted-system log. Switched to literal-key serialization and added a build-time skip rule so the regression class fails the build instead of user-side. Affects packaged Asset Store builds; source-import users were unaffected.

## [1.39.1] - 2026-05-25

Close-the-loop patch — finishes the error-surfacing work from 1.39.0 on the failure path.

### Fixed
- **Failed Plans No Longer Orphan Staged Files Silently**: When a transactional plan fails hard and the rollback can't clean up staged files, the error banner now points you at `Library/AiFamiliarCache/staging/` instead of leaving the files there with no signal. Matches the existing cancel-time behavior.
- **Error Banner Crash-Safe After Window Close**: The banner now properly clears its internal references on dispose, so UI updates queued just before the window closes are dropped cleanly instead of writing to a detached element.

### Added
- **Local LLM Tool-Use Override**: New **Allow for Local LLM** checkbox under Settings ▸ Execution ▸ Native Tool Use lets you opt your LM Studio model into the native-tool turn loop. Default off — enable only after confirming your model emits clean function-call output.

### Changed
- **Project Memory Faster on `.cs` Rename/Delete**: Paths in stored lessons are now pre-normalized at write-time, so the cleanup pass on script renames/deletes does simple string compares instead of normalizing every path on every check. Behavior unchanged; existing cache files are forward-compatible.

## [1.39.0] - 2026-05-04

### Added
- **Error Banner**: A severity-tinted banner just under the toolbar surfaces errors that previously only hit the console. Info (blue) auto-dismisses after 6 s, Warning (amber) after 12 s, Error (red) stays until dismissed. Actionable errors carry an inline **Try again** button — for example, a failed conversation-restore offers one-click retry.
- **Embedding-Build Progress and Cancel**: When AI Familiar builds class-outline embeddings in the background, the status footer now shows a live `Embedding X/Y files (Z%)` label and a Cancel button. A regression where a previous cancel would brick later rebuilds is also fixed. Requires an embedding provider (OpenAI key) — the bar is hidden otherwise.
- **Network Tuning (Settings ▸ Execution)**: Three previously-hardcoded `ProxyClient` constants are now editable: **Max Rate-Limit Retries** (default 4), **Retry Cap** (default 75 s), **Stream-Idle Timeout** (default 300 s). Changes take effect on the next request.

### Fixed
- **Conversation Restore Failures No Longer Start a Blank Session**: A failed restore now shows the error banner with a Retry button and leaves the UI ready, instead of silently dropping you into an empty conversation.
- **Stale Apply/Revert Buttons After Approval-Card Failure**: Approval-card sync failures now surface through the error banner instead of leaving per-file Apply/Revert buttons in a permanently broken state.
- **Project Memory Stale Paths After `.cs` Rename/Delete**: Lessons now drop or rewrite their file references when scripts are renamed or deleted, so prior-lesson retrieval doesn't get polluted with paths that no longer exist.

## [1.38.0] - 2026-04-30

### Added
- **Conversation Tabs**: Browser/IDE-style tab strip above the output area for switching between open conversations in both Chat and Agent modes. Tabs sit just under the toolbar and above the status and execution rails. Each tab shows the conversation title, an active-state highlight, a busy dot during streaming or plan execution, a close button, and there's a trailing **+** to start a new conversation. Up to 10 tabs are kept open at once; the least-recently-focused is evicted when exceeded. Tabs persist across domain reloads (`[SerializeField]`) and Unity restarts (`EditorPrefs`); History sidebar selections auto-pin as tabs. Streaming chats pin to the originating tab so deltas, completions, and errors land on the conversation that initiated the request even if you've switched away. The execution rail aligns with the *active* tab's plan state, so an in-flight plan in tab A no longer bleeds an "Executing Plan" label into tab B.

### Changed
- **Lambda Proxy Rewritten in Node.js 20 with End-to-End Streaming**: The AWS Lambda proxy (`Assets/Proxy/`) was rewritten from Python (`lambda_function.py`) to Node.js 20 (`index.mjs`) using `awslambda.streamifyResponse`. The previous Python handler called `urlopen().read()` which buffered the entire upstream response before returning to API Gateway, defeating end-to-end streaming and causing 504 Gateway Timeout errors on slow models (GPT-5-pro, o3, Opus extended-thinking). The new handler pipes upstream chunks straight to the client. Provider routing (OpenAI Responses API / Anthropic Messages API), `Authorization`/`X-API-Key` validation, OpenAI Chat→Responses message-to-input conversion, native tool-use forwarding, and CORS behavior are preserved verbatim. The SAM template (`template.yaml`) now provisions both endpoints from one stack: the existing **Lambda Function URL** with `InvokeMode: RESPONSE_STREAM`, and a new **API Gateway REST API** with `ResponseTransferMode: STREAM` (the Response Streaming feature launched 2025-11-19). Both endpoints support 15-minute request timeouts. **Migration**: redeploy with `sam build && sam deploy` from `Assets/Proxy/`. The REST API endpoint type must be `REGIONAL` (not Edge-optimized — its 30s idle timeout would cut off slow reasoning models). Existing client (`ProxyClient.cs`) needs no changes — it already streams via `ReadAsStreamAsync` and tolerates `:` SSE keep-alives. See updated `PROXY_SETUP_GUIDE.md` and `TROUBLESHOOTING_502.md`.

### Fixed
- **Truncated Responses After Switching to a Large-Output Model**: `RequestFactory.CreateSuggestRequest` only capped `max_tokens` at the per-model ceiling but never raised a stale low value. Switching from Claude Haiku to GPT-5.5 or Claude Opus 4.7 left the old 8192 in place, causing the OpenAI Responses API to return `status: "incomplete"` with `incomplete_details.reason: "max_output_tokens"`. A new per-model `RecommendedMaxOutputTokens` field in `ModelCapabilities` supplies a floor; `CreateSuggestRequest` now raises `maxTokens` to that floor before applying the ceiling cap. Recommended values: GPT-5.5 / 5.5-pro → 32,768; GPT-5.4 family / GPT-5 family → 16,384; Claude Opus 4.7 / 4.5 / 4.1 / Sonnet 4.6 → 65,536; Claude Haiku 4.5 → 16,384; O3 / O3-mini / LM Studio → unchanged at 8,192. `ModelSelector` defaults realigned to match.
- **OpenAI Replays Failing with `'input_text'` Error**: After the Node.js Lambda rewrite, conversations with replayed assistant turns (multi-step plan step 2+, follow-up chats) failed on OpenAI with `"Invalid value: 'input_text'. Supported values are: 'output_text' and 'refusal'."` The Node.js handler hardcoded `input_text` for every text part. A new `defaultTextType(role)` helper now routes assistant messages as `output_text` and user messages as `input_text` across all three text-emission paths (tool-use replay, structured content, plain string). Anthropic was unaffected.
- **Selected Model Drifting Out of Sync with Settings**: `InitializeDependencies` was unconditionally overwriting `_savedModelType` from `settings.defaultModel` on every startup, racing with the EditorPrefs read in `GetModelConfig`. The dropdown could show Claude (post-overwrite) while the actual request resolved to OpenAI — producing a confusing "API key not configured for provider: OpenAI" message even when Claude Opus 4.7 was selected. EditorPrefs now wins after first install; the user's selection mirrors back into `settings.defaultModel` so embedding-flow readers (`ConversationManager`) and any future consumers stay aligned. Missing-key errors now name the missing provider and point users to the gear icon (the actual UI affordance) instead of a non-existent Tools menu entry.
- **Phantom "OpenAI API key not configured" Console Spam**: A misleading `[EmbeddingService] OpenAI API key not configured` error fired as a side effect of `ShowErrorCard` saving a transcript-only entry — visible whenever Claude was the active provider. `GenerateEmbeddingsForNewMessages` now early-exits when no messages need embedding and skips silently when the embedding-capable provider is missing. The Enable Semantic Search tooltip in the API Keys window explains when an OpenAI key is actually required.
- **Rail Buttons Crushed by Long Titles**: Pause/Stop/collapse buttons in the execution rail compressed to unreadable widths when the conversation title or step description got long. Buttons now have explicit `min-width` and `flex-shrink: 0`, and plan-step descriptions truncate with ellipsis instead of pushing the controls off-screen.
- **History Tab Showing Live Spinners**: Replaying a non-live conversation (history tab, abandoned session) sometimes left spinners ticking and re-lit Pause/Stop on the ambient status rail because persisted Running/Blocked entry states were taken at face value. `TranscriptViewController.RenderAll` now takes an `isLiveConversation` flag — non-live replays downgrade Running/Blocked entries to Skipped and suppress rail-activity updates so old sessions render cleanly.
- **Numbered/Bulleted Prompts Reformatted as Styled Lists**: User-input bubbles render with plain-text segments, so prompts like "1. Do X. 2. Do Y." stay verbatim in the transcript instead of being transformed into styled list items. Code fences still route through the code block UI for paste-friendly display.

## [1.37.0] - 2026-04-27

### Fixed
- **GPT-5.5 Plan Generation No Longer 400s on `tool_choice`**: `PlanGenerator` and `StepExecutor` sent `tool_choice = { type: "auto" }` to all providers. Anthropic's Messages API requires the object form, but OpenAI's Responses API requires the bare string `"auto"` for generic auto/none/required and reserves the object form for selecting specific hosted/function tools. GPT-5.5 rejected with `"Invalid value: 'auto'. Value must be 'file_search'."`. New `PlanGenerator.BuildToolChoice(provider)` helper returns the right shape per provider; `StepExecutor` reuses it. Two new tests in `PlanGeneratorToolChoiceTests` lock in the JSON wire format.
- **IntentClassifier No Longer Silently Returns Empty for Reasoning Models**: The classifier capped `max_tokens` at 50 — fine for non-reasoning models but disastrous on GPT-5/5.4/5.5/o3, which burn the entire budget on hidden chain-of-thought before emitting any assistant text. With nothing returned, classification fell open to `NewFeature`. Bumped to 256 tokens and now forces `reasoning_effort = "low"` on the dedicated classifier `ModelConfig` so reasoning is minimal regardless of caller config. `gpt-5.5-pro` rejects `"low"` (only accepts `medium`/`high`/`xhigh`) so `MinReasoningEffortFor(modelName)` upgrades `-pro` variants to `"medium"`. Coverage in new `IntentClassifierReasoningTests`.
- **OpenAI Responses Streaming No Longer Doubles Final JSON**: `OpenAIResponsesParser.TryExtractStreamDelta` returned the `text` field of `response.output_text.done` events as a delta. But that field is the *cumulative* text already streamed via preceding `output_text.delta` events — the caller appended both, doubling the response and producing `"Additional text encountered after finished reading JSON content"` parse failures (visible at boundary between `{plan}{plan}`). `done` events now return `true` (still recognized) but no `deltaText`. New `OpenAIResponsesParserTests` asserts accumulated deltas equal final text exactly.
- **Selected Model Survives Domain Reload and Library/ Wipes**: `AiFamiliarWindow.GetModelConfig` was reading `_modelField?.value` from a UI Toolkit element rebuilt by `CreateGUI()` on every domain reload. The post-reload resume path fired via `EditorApplication.delayCall` and raced with UI construction; when `_modelField` was null the null-coalesce defaulted to `ModelType.ClaudeOpus47`, silently switching the request mid-run from OpenAI to Claude (and producing `"Invalid API key format. Claude keys start with 'sk-ant-'"` when only an OpenAI key was configured). Two-layer fix: `GetModelConfig` now reads from the `[SerializeField] _savedModelType` backing store, and the selection is also mirrored into `EditorPrefs` (key `AiFamiliar_SelectedModelType_v1`) which survives `Library/` wipes, window recreation, and any path that nukes EditorWindow serialized state. `OnEnable` hydrates the field from EditorPrefs.
- **API Keys Persist Across Recompiles**: `APIKeysConfig` primary storage moved from `Assets/AiFamiliarData/.api_keys.json` (inside `Assets/`, so reimported on every recompile and racing with Save → users reported keys "disappearing" mid-task) to `Library/AiFamiliarCache/api_keys.json` — outside the AssetDatabase, untouched by recompiles. Save no longer calls `AssetDatabase.Refresh`. EditorPrefs remains a defense-in-depth secondary. Legacy `.api_keys.json` is read once on first load if the new file is absent and migrated forward; subsequent runs ignore it. Coverage in new `APIKeysConfigStorageTests`.
- **Friendlier 504 Error**: The verbose three-paragraph AWS-jargon block returned for API Gateway timeouts now reads as a single actionable line: *"The model took too long to respond (504 timeout). Try a faster model (e.g. gpt-5.5 instead of -pro), or raise the AWS API Gateway timeout to 120+ seconds."*
- **Step Failure Errors Surface the Underlying Cause**: `StepExecutor` previously emitted only generic `"(failed)"` system messages when an internal action failed, swallowing the actual `ExecutionResult.Error` text (e.g. *"GameObject 'Player' not found"*). The error string is now appended to the system message so the user sees the cause without digging through stack traces.
- **Step Execution No Longer Returns "No JSON found in response"**: The native tool turn loop is now disabled for step-execution requests, which emit a structured-JSON-only output contract. The two were protocol-incompatible — when the model emitted only `tool_use` blocks the loop returned `FinalText == ""` and the parser failed. Native tools remain enabled for plan generation and intent classification (free-text outputs). Removed the misleading "(Note: File content could not be loaded.)" hint that tempted the model into reading phantom paths; replaced with directive "(This file does not exist yet. Create it as part of this step. Do not attempt to read it.)".
- **Plan No Longer Barrels Forward After a Hard Step Failure**: Non-transactional plans previously kept executing later steps after a step exhausted its retries, leading to cascading failures (e.g. step 4 trying to attach a component whose script step 1 had failed to create). Plans now halt on hard failure with a new `OrchestratorState.HaltedOnFailure` state and a clear status message — the user can cancel and restart instead of inheriting a corrupt scene. Transactional plans continue to use the existing rollback path.
- **Domain Reload No Longer Silently Re-runs an In-Flight Step**: When a step's LLM call was interrupted by a Unity domain reload (e.g. triggered by a previous step's `.cs` file write), the orchestrator would silently re-execute the step on resume, doubling cost and history. `PlanStep` now carries a per-attempt `inFlightCallId` (persisted to the conversation) that's set when the LLM call starts and cleared when it returns. On resume, a non-null id means the previous call was interrupted — the step is marked Failed and the plan halts so the user explicitly chooses to retry, skip, or abort. Belt-and-suspenders: `StepExecutor` now waits for `EditorApplication.isCompiling` to clear before launching the next LLM call, narrowing the in-flight-during-reload window.
- **Diagnostic Logging for Anthropic Prompt Caching**: When `cache_control` is set on a Claude system prompt, `ProxyClient.LogRequest` now emits the redacted on-wire JSON shape so it's possible to verify the array-of-blocks structure matches Anthropic's spec. The streaming pipeline now also captures `cache_creation_input_tokens` / `cache_read_input_tokens` from the Anthropic `message_start` SSE event (previously only `message_delta` was parsed, which omits cache fields), and `LogCollectedResponseIfAvailable` emits a `[ProxyClient] LLM cache usage (...)` line summarizing the hit on every request — so cache effectiveness is visible without parsing raw SSE.
- **Per-Model Cache Threshold Documented**: Anthropic only engages prompt caching when the cacheable prefix exceeds a per-model token threshold (Opus 4.7/4.6/4.5 and Haiku 4.5: ≥4096 tokens, Sonnet 4.6: ≥2048, older Sonnet 4.5 / Opus 4.1: ≥1024). Below threshold the `cache_control` marker is silently ignored, which previously looked like "caching is broken". The `enablePromptCaching` settings tooltip now explains this and suggests Sonnet 4.6 for workflows that depend on cache hit-rate.
- **Default `max_tokens` Raised to 8192**: The legacy default in `APIKeysConfig` was 2000 — a GPT-3.5-era cap that routinely truncated Claude responses mid-output when a step generated a substantial source file (the response would end with `stop_reason="max_tokens"` and unparseable JSON, triggering an unnecessary retry round-trip). New installs now default to 8192; existing user configs persisted in EditorPrefs keep their stored value. `ModelCapabilities.MaxOutputTokensCeiling` still clamps any pathological value (Claude non-Haiku: 65,536, Haiku: 16,384, GPT-5.x: 16,384–32,768).

### Added
- **`create_asset` Now Supports `asset_type: "Prefab"`**: `SceneOps.CreateAsset` previously rejected anything other than `Material` with *"Unsupported asset type"*. The Prefab branch resolves the GameObject by name, defaults `asset_path` to `Assets/Prefabs/{name}.prefab`, validates the path is under `Assets/`, auto-appends `.prefab`, and saves via `PrefabUtility.SaveAsPrefabAssetAndConnect` (so the source GO becomes a prefab instance). Planner and executor system prompts updated to document the option with concrete examples. Coverage in new `SceneOpsCreatePrefabTests` (8 cases including default path, lowercase asset_type, missing extension, missing GO, path outside Assets/).
- **GPT-5.5 Family**: Registered OpenAI's new `gpt-5.5` (flagship) and `gpt-5.5-pro` models (GA April 24, 2026) with a 1,000,000-token context window and 32K output ceiling. Reasoning effort controls follow the same pattern as `gpt-5.4-pro` — exposed in the UI for `gpt-5.5-pro`, omitted by default for the flagship (the API picks `medium` automatically per the new GPT-5.5 default). Added entries to `ModelConfig`, `ModelCapabilities`, and `ModelSelector.GetAvailableModels`. The default model in `AIConfig.json` is now `gpt-5.5` (was `gpt-5.4-mini`); the GPT-5.4 family stays available as prior-gen since GPT-5.5 mini / nano variants are not yet released.
- **1M Context Window on Claude Sonnet 4.6**: `ModelConfig.GetContextWindowSize` now reports 1,000,000 tokens for Sonnet 4.6, matching Anthropic's GA 1M context (April 2026). Replaces the retired `context-1m-2025-08-07` beta on Sonnet 4 / 4.5 (which were never registered in this plugin). `PlanLimits.GetContextCapsForWindow` adds a corresponding ≥1M tier (40 / 50 / 150) so 1M-window models retrieve more files for the planner. Other Claude 4.x models (Opus 4.7 / 4.5 / 4.1, Haiku 4.5) retain the 200K standard window.
- **Rate-Limit Mitigation for Claude Tier-1 Users**: Claude users on Anthropic's default tier (30k input tokens/minute) no longer hit hard rate-limit failures during multi-step plan execution. Seven layered mitigations ship by default:
  - **Anthropic prompt caching** (`enablePromptCaching`, default on): the system prompt is sent as a cacheable content block. On steps 2+ of a plan, the invariant prefix is billed at the cache-read rate and counts against a separate (higher) cache-read TPM bucket — the primary cause of previous over-limit errors.
  - **Client-side token-bucket pacer** (`enableRateLimitPacing`, default on; `rateLimitBudgetTpm`, default 28000): tracks a rolling 60-second window of estimated input tokens per model and proactively delays outgoing requests that would exceed the budget, preventing rapid-fire plan steps from tripping the ceiling before they start.
  - **AutoContextMode** (`autoContextMode`, default Balanced): controls how much file content is pushed into the prompt upfront. `Balanced` includes the selection file and user-referenced files only; prompt-detected files are dropped and fetched via `read_file` when the model asks. `Eager` restores previous behavior; `Lazy` sends nothing upfront.
  - **Preflight input budget trim** (`preflightInputTokenBudget`, default 20000): a final pass in `MessageBuilder` caps large file bodies in the outgoing user message to ~5000 chars each when the estimated token count would exceed the budget, with a hint pointing to the `read_file` tool.
  - **Tool-result elision**: within a native-tool turn loop, once cumulative message content exceeds ~12k chars, older `tool_result` payloads are replaced with an elision marker so repeated `read_file` calls across 10 rounds don't accumulate unbounded history. The most recent 2 tool results are always preserved intact.
  - **Header-aware retry with longer retries**: `ProxyClient` now reads `Retry-After` and `anthropic-ratelimit-*-reset` headers on 429 responses to use the authoritative wait time instead of fixed backoff. Retry count raised from 2 to 4; retry cap raised from 60s to 75s.
  - **Visible retry countdown**: a live "Rate limited — retrying in Xs (attempt N/M)" message appears in the status footer during any retry or pacer delay instead of a silent freeze.
  - **`read_file` range reads**: `MaxBytes` lowered from 100k to 20k (~5k tokens); optional `offset` (1-based line) and `limit` (line count) arguments let the model read specific ranges of large files without hitting the cap.
- **Transactional Plan Execution** (opt-in via Settings ▸ Transactional Execution): When enabled, multi-step plan file changes are deferred and applied atomically after the final step completes. Any hard step failure discards every staged change and transitions the plan to a new `Failed` terminal state. Backups survive crashes via a persisted registry at `Library/AiFamiliarCache/backup_registry.json`. Scene mutations stay direct (not rolled back) — a pre-execution warning surfaces on mixed file + scene plans.
- **Native Tool Use** (opt-in via Settings ▸ Native Tool Use, Claude-only for now): The LLM can call `read_file`, `grep`, `get_console`, and `get_class_outline` on demand during plan generation and step execution, instead of receiving a bundled context dump. Tools are built on a new `ToolRuntime` registry + `NativeToolTurnLoop` that handles the multi-round dispatch cycle. Built-in tools are path-allowlisted (`read_file`) and ReDoS-bounded (`grep` has a 2-second per-file regex timeout). OpenAI support pending Lambda transform (`Docs/todo.md`).
- **Cross-Conversation Project Memory** (opt-in via Settings ▸ Project Memory): After each completed plan, a compact "lesson" (intent + prompt + files touched + outcome) is embedded and stored in `Library/AiFamiliarCache/project_memory.json`. On new plans, the top-3 most similar prior lessons are injected as a `<PRIOR_LESSONS>` block so the agent learns from prior outcomes across conversations. New menu: Tools ▸ AI Familiar ▸ Project Memory ▸ (Clear All Lessons / Show Status / Reveal Cache File).
- **Intent Classifier**: Requests are now classified before plan generation (regex-first, LLM-fallback). QnA and Explain requests short-circuit directly to chat mode without generating a plan. BugFix intent lifts console errors into the planning prompt as a `<CONSOLE_ERRORS>` block. SceneSetup intent appends a two-level `<SCENE_HIERARCHY>` snapshot. AmbiguousShouldAsk forces a clarifying-question response instead of a speculative plan. Local provider skips the LLM fallback; any error defaults to NewFeature.
- **Project Map**: One-time LLM-generated architectural summary of the project, generated on demand via a new button in Settings. Cached at `Library/AiFamiliarCache/project_map.md` and prepended to every system prompt as a `<PROJECT_MAP>` block. A staleness warning is shown (but the map is still used) when the file set has changed by 15% or more since generation.
- **Semantic File Relevance**: Class outlines from the Knowledge Base are embedded in the background (`FileEmbeddingBuilder`) and used to augment keyword scoring in `MessageBuilder`. Final score blends keyword score with cosine similarity (up to +10 points), surfacing files the keyword pass would miss. Embeddings are persisted to `Library/AiFamiliarCache/file_embeddings.json`. Falls back to keyword-only when no embedding provider is available (e.g., Claude provider with no OpenAI key configured).
- **Adaptive Context Caps** (`PlanLimits.ContextCaps`): File caps for "Likely Relevant Scripts", fallback sample, and `MaxFilesForContextRetrieval` now scale with the model's context window — ≥200K tokens uses 25/30/80, ≥64K uses 15/20/45, baseline stays at 10/15/30.

### Changed
- **Settings Window Reorganized into 6 Tabs**: The single ~765-line scrolling Settings form is now a tabbed window — **Keys**, **Models**, **Context**, **Conversations**, **Execution**, and **Project Memory**. The reorganization surfaces 10 previously-buried settings: transactional plans, native tool-use, screenshot validation, prompt caching, rate-limit pacing + budget, auto-context mode, preflight token budget, capture / inject prior lessons, and local model context window. Project Map controls move under Project Memory alongside the new Clear Lessons / Status / Reveal Cache buttons. The window now picks up the plugin's dark-blue palette.
- **Plan Regeneration Steered by User Feedback**: The plan card's "Edit plan" button is replaced with an inline **Feedback for next plan** notes field. Type guidance like *"use fewer steps"* or *"skip the test step"* and click Regenerate — the notes are appended to the original prompt so the next plan reflects your correction. Approving a plan now also auto-collapses the plan card (per-step cards already show their own timers).
- **Plan Clarification Types**: `PlanClarificationRequiredException` now carries a `PlanClarificationType` — `Disambiguation`, `MissingInfo`, or `MissingFiles`. `MissingFiles` requests are resolved silently by auto-loading the requested paths and re-invoking plan generation without any UI prompt. Up to 3 refinement rounds are allowed before the error surfaces to the user.
- **Plan Editor — Step Controls**: Each plan step now has a skip toggle (marks `StepStatus.Skipped`; orchestrator advances past skipped steps) and a collapsible "files (N)" panel for adding or removing `contextFiles` before approving the plan.
- **Pinned Step-Execution System Prompt**: `StepExecutor` builds the system prompt once per plan and reuses it across all steps, saving ~3-4K tokens × (N-1) steps and keeping the block byte-identical for Anthropic prompt-cache hits.
- **Plan-Generation Prompt Structure**: `BuildPlanGenerationPrompt` now uses XML-delimited sections (`<ROLE>`, `<CONTEXT_CHECK>`, `<OUTPUT_CONTRACT>`, `<RESPONSE_SHAPES>`, `<WHEN_TO_ASK>`, `<PLAN_RULES>`, `<INTERNAL_ACTIONS>`, `<FILE_DISCOVERY>`, `<DOMAIN_RELOAD>`). A `<CONTEXT_CHECK>` preamble biases the model toward asking clarifying questions when intent is ambiguous.
- **Honest Capability Statement** (`SystemPrompts.ToolCallingInstructions`): Rewritten to accurately describe what the model has access to — no live tool access; use SHAPE B to request missing files, or state caveats explicitly in chat mode.
- **Renamed `CursorSystemPrompts` → `SystemPrompts`**: Class and all constants renamed (e.g., `CursorBasePrompt` → `BasePrompt`). GUID preserved; no behaviour change.
- **Roslyn-based `CodeParser`**: The C# class-outline extractor was rewritten from regex to `Microsoft.CodeAnalysis` (`CSharpSyntaxTree`). The public API is preserved so downstream consumers needed no changes, but `#if UNITY_EDITOR` is now honored correctly, generics in base lists parse cleanly, partial and nested classes are recognized, and the `ProjectKnowledgeBase` cache schema bumps to v2 to force a rebuild. Roslyn DLLs are shipped at `Assets/Plugins/Roslyn/` and auto-referenced by the Editor assembly.

### Removed
- `IterativeRefinementHandler.cs` — superseded by the inline clarification loop in `AgentExecutionController`.
- `PersistentMemory.cs`, `UserProfile.cs`, `DataCache.cs`, `ContextCache.cs` — legacy persistence layer removed.
- `PlanningTodoPanelUI.cs`, `ThinkingPanelUI.cs`, `WindowEvents.cs`, `PromptSizeChecker.cs` — legacy UI components removed.

## [1.36.0] - 2026-04-18

### Added
- **Activity Transcript**: New card-based output view inspired by modern AI IDEs — each assistant turn, phase, plan, step, tool call, approval, and run summary renders as its own collapsible card with a live elapsed-time badge. Now the default output mode.
- **Ambient Status Rail**: A pinned header above the transcript mirrors the topmost running or blocked activity alongside the current model, context usage, and cost readouts, so you always know what the agent is doing without scrolling.
- **Screenshot Capture**: New camera button in the prompt input captures the Game or Scene view and attaches it to your next request as multimodal visual context for the LLM.
- **Clarifying Questions**: When a request is ambiguous, the agent can now ask a short, structured clarifying question before planning. Questions render as a dedicated card with selectable options and an optional free-text answer.
- **Plan Summary Cards**: Before executing a plan or applying edits, the agent can emit a plan-summary card that spells out the headline action, key non-trivial decisions, their rationale, and the next action — so you see *what* and *why* up front.
- **Next Steps Loading Indicator**: The Next Steps card now appears immediately with a spinner and live elapsed-time badge while guidance is being generated, instead of popping in only once finished.
- **Refreshed Model Catalog (2026 lineup)**:
  - OpenAI: `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.4-pro`, `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `o3`, `o3-mini`
  - Anthropic: Claude Opus 4.7 (new default), Sonnet 4.6, Haiku 4.5, Opus 4.5, Opus 4.1
- **Adaptive Thinking**: Claude Opus 4.7 and Sonnet 4.6 support adaptive thinking mode alongside the legacy token-budget mode for older Claude models.
- **Expanded Reasoning Effort Levels**: OpenAI reasoning effort now accepts `none`, `low`, `medium`, `high`, and `xhigh`.

### Changed
- **Default Model**: New default is Claude Opus 4.7 (was Claude Sonnet 4.5).
- **GPT-5.4 Output Ceiling**: Raised to 32K output tokens.
- **API Keys & Proxy URL Persistence**: Credentials now persist through `EditorPrefs` instead of a JSON file, fixing the issue where keys were lost after domain reloads or Unity restarts due to reload-timing race conditions.
- **Output Panel Cleanup**: Removed duplicate file-change representations and the non-functional placeholder Accept/Reject buttons on code blocks to reduce visual noise around agent edits.
- **Rebrand Cleanup (Asset Store compliance)**: Removed remaining legacy "AI Editor Agent" / "AI Assistant" references — package id is now `com.cfirz.aifamiliar`, UI element names and internal symbols updated, and legacy `.unitypackage` artifacts are no longer shipped.
- **Unified Context Toggles Row**: Context toggles are consolidated into a single compact row; the redundant "Include Context:" label and duplicated Console Logs toggle were removed, and the remaining toggle is now labeled "Include Console Logs".
- **Editor Tab Renamed**: The EditorWindow tab label is now "Ai Familiar" to match the rebrand.
- **Conversation Title Overflow**: Long conversation titles now ellipsize and shrink gracefully instead of pushing the side action buttons off the window.
- **Screenshot Button Placement**: Repositioned so it no longer overlaps the Submit button on narrow window widths.

### Fixed
- **Card Timers Freeze on History View**: Activity card elapsed-time timers now freeze and clear correctly when browsing past conversations so old sessions no longer show counting clocks.
- **Plan Card Duplication on Domain Reload**: Plan cards are now deduped by plan id, preventing a fresh plan card from being appended on every script recompile.
- **Orphaned Step Spinner After Domain Reload**: When execution resumes post-recompile, re-emitted step cards now re-point to the still-running card in the transcript instead of leaving a stale spinner alongside a fresh one.
- **Auto-Collapse on Resolution**: Approval cards now auto-collapse on Accept / Reject / Fail; empty Phase and Step cards hide the expand chevron so there's nothing misleading to click.
- **Embedding Service Console Spam**: Background embedding tasks no longer touch `EditorPrefs` from a worker thread, eliminating the 1000+ console error spam on session start.
- **Step Result Rendering**: Completed step cards now show their result summary inline in the card body.
- **Deprecated Model Migration**: Conversations saved with removed model ids are automatically migrated to Claude Opus 4.7 on load.

### Removed
- **Bottom Plan-Editor Dock**: Inline plan cards are now the only plan-approval surface.
- **Legacy Model IDs**: Stale OpenAI and Anthropic model entries (GPT-4.x, o1, Claude 3.x) removed from the catalog.

## [1.35.1] - 2026-04-11

### Changed
- **Project Rebrand**: Renamed from "AI Editor Agent" to "AI Familiar" — updated package name (`com.cfirz.aifamiliar`), assembly, namespace, menu items, and display name throughout

## [1.35.0] - 2026-04-10

### Added
- **Slash Commands**: Type `/` in the prompt to access quick commands — `/fix`, `/explain`, `/test`, `/refactor`, `/optimize`, `/scene`, and `/new-chat`
- **Context Picker**: Type `@` to add project files, scenes, and scripts as context for your prompt, with visual pills showing active context items
- **Model Selector**: Switch between AI models (Claude, OpenAI, local LLMs) mid-session via a popover in the top bar
- **Execution Rail**: Collapsible progress panel during agent execution showing step-by-step progress with pause/stop controls
- **History Sidebar**: Toggle with Ctrl+H to browse, search, and restore past conversations
- **Plan Review Panel**: Review and approve agent execution plans before they run, with step-by-step file context
- **Keyboard Shortcuts**: Press `?` to view all available shortcuts (Ctrl+K for new chat, Ctrl+Shift+A to toggle mode, Ctrl+H for history, and more)
- **Next Steps Output**: After agent execution completes, the assistant automatically generates guidance on what to do next with the generated code
- **Status Footer**: Bottom bar showing connection status, context count, token cost estimate, and current model
- **Inline Diff View**: Code blocks now support a Diff/Full toggle to view only changed lines, plus Accept/Reject buttons for proposed changes
- **New Model Support**: Added Claude Sonnet 4.5 (now default), Claude Opus 4/4.1, GPT-5/5 Mini/5 Nano, GPT-4.1 family, and O3/O3 Mini reasoning models

### Changed
- **Default Model**: Changed from Claude Sonnet 4 to Claude Sonnet 4.5
- **Mode Toggle**: Chat and Agent modes are now switched via a segmented control at the top of the window
- **Prompt Input**: Enhanced input field with `/` and `@` trigger detection, improved submit behavior (Ctrl+Enter)
- **Code Block UI**: Redesigned with language detection, line numbers, file path breadcrumbs, and save/copy actions
- **Scene Operations**: Duplicate GameObjects are now detected and treated as modify operations instead of creating duplicates; unresolved object names suggest similar matches
- **Approval Panel**: Hidden during active execution to reduce UI clutter; reappears when user input is needed

### Removed
- **Legacy Window**: Removed the original monolithic `AIAssistantWindow` in favor of the decomposed controller-based architecture introduced in v1.34.0

## [1.34.0] - 2026-02-27

### Added
- **Expanded Test Infrastructure**: Comprehensive mock factory system for testing all major subsystems
  - Domain-specific factories for orchestration, conversation, context, and execution mocking
  - Fluent `TestDataBuilder` API for constructing complex test scenarios with chainable methods
- **Integration Test Suite**: Five new integration test files covering end-to-end workflows for plan generation, step execution, conversation persistence, scene operations, and file operations
- **Refactored AI Assistant Window**: New controller-based `AIAssistantWindowRefactored` decomposes the monolithic 2119 LOC window into 9 focused files (~2870 LOC total) using controller composition with event-driven communication
  - Dedicated controllers for conversation management, message rendering, plan editing, file change review, and status display
  - Centralized `WindowState` container and `WindowStateManager` for serialization-friendly state with domain reload resilience

### Changed
- **UI Architecture**: Main editor window refactored from monolithic class to controller composition pattern, reducing the primary window file from 2119 to ~750 LOC (65% reduction)
- **Project Organization**: Moved `TEST_COVERAGE_ANALYSIS.md` to `Docs/` folder; removed duplicate root `CHANGELOG.md`

## [1.33.0] - 2026-01-31

### Added
- **Persistent Execution Plans**: Chat sessions now retain execution plan history with full state metadata. All plans executed within a conversation are stored with their completion status, timestamps, and results.
- **Context Window Tracking**: Real-time display of context usage percentage based on the selected model's token limits. Supports all providers (OpenAI, Claude, local LLMs) with per-model context window sizes.
- **Conversation Resume**: Seamlessly resume interrupted plan executions. When switching between conversations, active plans are automatically restored with full execution state.
- **Execution Metadata**: New `ExecutionPlanMetadata` class tracks plan lifecycle including start time, completion time, final state, execution summary, and model configuration used.
- **Message Type Classification**: Messages are now categorized by type (UserPrompt, AssistantResponse, SystemMessage, PlanGenerated, ExecutionStarted, etc.) for better organization and future filtering capabilities.
- **Context Usage Color Coding**: Visual feedback for context usage - gray (<70%), orange (70-90%), red (≥90%) - helps prevent exceeding model limits.
- **Smart Context Calculation**: Intelligent token estimation using recent messages (last 20) plus summarized older messages, context bundles (referenced files, console logs), system prompts, and active plan tokens.
- **Local Model Context Configuration**: Support for custom context window sizes when using local LLM providers via LM Studio or similar endpoints.

### Changed
- **Conversation Data Model**: Extended with `executionPlans` list, `activeExecutionPlanId`, and `lastExecutionState` fields for comprehensive execution tracking.
- **Chat Message Model**: Added `linkedExecutionPlanId` and `messageType` fields to link messages with their originating plans and categorize message types.
- **Model Configuration**: Updated `ModelConfig.GetContextWindowSize()` with accurate token limits for all supported models (GPT-4o: 128k, Claude Sonnet 4.5: 200k, GPT-5: 1M, o1/o3 reasoning models: 200k, etc.).
- **Multi-Step Orchestrator**: Enhanced with state persistence methods (`LoadStateFromConversation()`, `SaveStateToConversation()`) to enable execution resume across domain reloads and conversation switches.
- **Conversation Manager**: Index now includes execution state metadata (`hasActivePlan`, `lastExecutionState`) for fast filtering and display of active executions.
- **UI Context Display**: Context usage percentage now updates dynamically on model selection, file references changes, message sends, plan completion, and conversation loading.

### Fixed
- **Domain Reload Resilience**: Execution plans now survive Unity domain reloads during compilation. State is automatically restored when scripts reload.
- **Backward Compatibility**: Existing conversations load seamlessly with null-safe deserialization. Missing execution plan fields default to empty lists/null values.
- **Context Calculation Accuracy**: Context bundle tokens (referenced files, console logs, project context) are now properly included in usage calculations.

## [1.32.0] - 2026-01-24

### Changed
- **Plugin Renamed for Asset Store Compliance**: Entire plugin systematically renamed from `UnityAgent` to `AiEditorAgent`
  - Assembly definition: `UnityAgent.Editor` → `AiEditorAgent.Editor`
  - Package identifier: `com.cfirz.unityagent` → `com.cfirz.aieditoragent`
  - Folder structure: `Assets/Editor/UnityAgent` → `Assets/Editor/AiEditorAgent`
  - Data folder: `Assets/UnityAgentData` → `Assets/AiEditorAgentData`
  - UnityPackage export path: `Assets/AiEditorAgent/` (Asset Store compliant base folder name)
  - Build scripts, CI/CD workflows, and all documentation updated to reflect new naming
- **Automatic Migration**: Config files automatically migrate from old `UnityAgentData` location to new `AiEditorAgentData` location on first load
- **Git History Preserved**: All renames performed using `git mv` to preserve file history and Unity .meta GUIDs

## [1.31.0] - 2026-01-18

### Added
- **LLM request/response logging**: Proxy requests now log request metadata and collected response content to make provider debugging easier.
- **Material persistence docs**: Added troubleshooting and testing notes for the material application fix.

### Changed
- **Scene object lookup preference**: GameObject resolution now prefers matches in the active scene before other loaded scenes to reduce cross-scene collisions.
- **Step execution logs**: Step execution now logs the selected provider/model and retry attempt count; non-cancellation LLM errors log as warnings.
- **Scene operation retries**: Scene operations allow one extra retry beyond `MaxRetries` before stopping.

### Fixed
- **Scene changes persist**: Scene-modifying operations now mark scenes dirty after changes so create/modify/delete/set_active/instantiate/apply_material persist after save/reload.
- **Timeout detection**: "Timed out" errors are now classified as connection issues so retries use the correct backoff.

## [1.30.0] - 2026-01-18

### Added
- **Optimized plan sizing (Multi-Step)**: Plan validation and plan-generation instructions now share a single max-step limit (`MaxPlanSteps`), and the planner is guided to bundle related work into fewer external steps.
- **Multi-action step execution**: Step execution now supports returning an `actions[]` array (or a single action for backward compatibility) so one external step can perform multiple internal actions sequentially.
- **Internal progress messages**: Multi-action steps now emit progress updates in the output (e.g., `Internal step i/N: <action>...`) as each internal action runs.
- **Expanded editor test coverage**: Added integration/unit tests for multi-action parsing/execution, retry strategy behavior, object resolution flows, and internal-action label caching.

### Changed
- **Step execution maintainability**: Refactored `StepExecutor` into focused helpers (retry strategy, action labeling, object resolution, compilation fix loop, and shared timeout handling) while keeping the orchestration behavior consistent.

### Fixed
- **More actionable resolution errors**: Improved warnings when object-resolution LLM responses can’t be parsed by including a (truncated) response snippet for debugging.
- **Consistent timeout handling**: Unified timeout behavior and logging across step execution and compilation-fix requests.

## [1.29.0] - 2026-01-18

### Added
- **Multi-material support for `apply_material`**: Added optional `material_index` (0-based) to select a specific renderer material slot. If omitted, the material is applied to all slots.
- **Editor tests for `apply_material`**: Added `SceneOpsApplyMaterialTests.cs` covering single/multi-material renderers, derived material name resolution, error cases, and `material_index` validation.

### Fixed
- **`apply_material` on multi-material renderers**: Now correctly supports applying to a specific slot (via `material_index`) or all slots when index is omitted, instead of only affecting the first slot.

## [1.28.0] - 2026-01-18

### Added
- **GameObject disambiguation (Multi-Step / Agent Mode)**: When a scene operation fails with "GameObject not found", the agent can collect candidate objects (including **hierarchy path**, active state, tag/layer, and components), ask the LLM for a likely match, and request **user confirmation** before retrying.
- **Hierarchy path targeting**: Scene operations can now target objects by full hierarchy path (e.g., `Parent/Child/ObjectName`) for more reliable selection when names are ambiguous.

### Changed
- **UPM (Git URL) package build output**:
  - No longer copies `UnityAgent.Editor.asmdef` into the built package (avoids DLL/asmdef assembly name conflicts in Unity).
  - Excludes `Config.meta` / `Rules.meta` from package output (these folders are intentionally excluded when empty).
  - Creates/updates a package `.gitignore` to ignore `*.unitypackage` and common build artifacts.
- **EmbeddingService quota handling**: When OpenAI returns quota/rate-limit errors (e.g., HTTP 429 / `insufficient_quota`), embeddings are temporarily disabled (5 minute cooldown) and warnings are de-duplicated to avoid log/API spam.
- **Lambda proxy update required**: If using the AWS Lambda proxy, redeploy `Assets/Proxy/lambda_function.py` to prevent "Unsupported parameter: 'response_format'" errors with OpenAI

### Fixed
- **Scene operations on inactive objects**: GameObject lookups now include inactive objects, so `modify_gameobject`, `delete_gameobject`, `set_active`, and parent lookups work even when objects (or parents) are inactive.
- **Delete retry loop**: Stop retrying deletion steps when the error indicates the object was "not found for deletion" (non-retryable).
- **EmbeddingService JSON serialization**: Fixed JSON serialization errors after code obfuscation that caused "A member with the name '' already exists" errors when opening the AI Assistant window in a clean project
  - Request body is now built manually to avoid obfuscation issues with anonymous types
  - Added obfuscation rules to skip all JSON-related classes (Message, SuggestRequest, ResponseFormat, etc.)
- **OpenAI Responses API compatibility**: Removed unsupported `response_format` parameter from Responses API requests
  - OpenAI's Responses API doesn't support the `response_format` parameter that was previously used for structured outputs
  - The proxy now relies on instructions to request JSON format instead

## [1.27.0] - 2026-01-14

### Added
- **GameObject rename support**: `modify_gameobject` command now supports renaming GameObjects via the `new_name` field in `EditorCommandData`
- **Scene operation error detection**: New error type classification for scene operations (GameObject/Component/Property not found)
- **Intelligent error messages**: Error messages now include suggestions for similar names and common mistakes
  - GameObject not found errors suggest similar names in the scene
  - Component errors suggest correct component name casing (e.g., "Transform" not "transform")
  - Property errors list available properties and provide Transform-specific guidance

### Changed
- **Retry logic for scene operations**: Scene operations now allow more retry attempts (up to MaxRetries + 1) before stopping
- **Error guidance**: Enhanced retry prompts with actionable guidance for scene operation errors
  - GameObject name mismatch detection (case-sensitivity, renamed objects)
  - Component type verification (correct casing, common components)
  - Property path correction (lowercase for Transform properties, dot notation)
  - Value format validation (Vector3, Color structures)
- **Logging improvements**: Detailed command execution logs include command type, target name, step number, and retry attempt

### Fixed
- **Scene operation retry logic**: Fixed issue where scene manipulation steps would fail prematurely with "Same error type 'unknown' repeating, stopping retries" warning
  - Scene operation errors are now properly classified instead of falling to "unknown" error type
  - LLM receives specific guidance to correct scene operation mistakes on retry
- **Execution loop warning**: Suppressed harmless warning "Cannot execute step in state: Completed" that appeared at the end of successful multi-step executions

## [1.26.1] - 2026-01-10

### Fixed
- **UPM (Git URL) installs**: Package builds now include (or generate) required `.meta` files so Unity doesn’t ignore assets in immutable Git-based UPM installs.
- **Package contents**: Build cleanup now removes generated `package.json.meta`, `README.md.meta`, and `CHANGELOG.md(.meta)` between builds to avoid stale artifacts.

### Changed
- **UPM build output**: `CHANGELOG.md` is now copied into the built UPM package alongside `README.md`.
- **Git ignore**: Keeps `Packages/**/*.meta` tracked so Git-based UPM installs can import packages without missing metas.
- **Package template version**: Updated `Assets/Editor/Build/Templates/package.json` to `1.26.1`.
- **Repo cleanup**: Removed stale `Assets/Scripts.meta`.

## [1.26.0] - 2026-01-10

### Added
- **⚠️ Lambda update required (existing proxy users)**: If you use the included AWS Lambda proxy, you must redeploy/update your deployed `Assets/Proxy/lambda_function.py` to this version to keep OpenAI requests working correctly (Responses API routing + request/response shaping).
- **OpenAI Responses API support (proxy + client parsing)**: The included Lambda proxy now routes OpenAI requests via the Responses API, and the Unity client can parse both streaming and non-streaming Responses formats.
- **Expanded model catalog**: Added support for newer OpenAI/Anthropic model IDs (including GPT-5 family, GPT-4.1 family, o3 family, and Claude Opus 4 / 4.1).
- **Model capability shaping**: Requests are now shaped per provider/model (token limit field selection, temperature support, structured output support, and conservative output ceilings).
- **Reasoning controls in Settings**:
  - **Reasoning Effort** for OpenAI o-series models (low/medium/high)
  - **Thinking Budget** (tokens) for Claude extended thinking models
- **Testability improvements**: Added `IProxyClient` + `MockProxyClient` so StepExecutor tests can run without real network calls or API keys.

### Changed
- **Token limit handling**: OpenAI requests prefer `max_output_tokens` (Responses API), and agent-mode output caps are no longer universally clamped to 4096 (now capped per model capability).
- **Settings/model persistence**: Model selection and provider inference are now provider-aware (including Local model round-trip), reducing config drift across reloads.

### Fixed
- **Agent JSON extraction**: Improved `AIAgentParser` JSON extraction so validation produces clearer errors (e.g., missing required fields) and JSON-in-code-block cases parse more reliably.
- **Test runner stability**: Avoids writing API key files / refreshing `AssetDatabase` in test runs; StepExecutor tests avoid deadlocks and hanging by using proper async patterns and mocks.

## [1.25.0] - 2025-12-12

### Added
- **Manual vs Auto Confirmation for Multi-Step**: Multi-step plans can now run in **Manual** mode (explicit approval) or **Auto** mode (auto-approve and execute).
- **Domain Reload Resume for Plans**: Multi-step execution state is persisted so execution can resume after Unity script compilation / domain reloads.
- **Plan UI Improvements**:
  - **Cancel Plan** action added to the plan UI.
  - Clear **“Waiting for user action…”** status surfaced when a plan is awaiting approval / paused.
  - Step list status indicators updated for better readability.

### Changed
- **Multi-Step Behavior**: Plan generation no longer always auto-executes; it now respects the selected confirmation mode (Manual vs Auto).
- **Repo Cleanup**: Removed old loading demo scripts from `Assets/Scripts/`.

### Fixed
- **Manual Approval Deadlock**: Pending changes are surfaced immediately during manual approval so Approve/Discard can reliably unblock execution.
- **Plan Persistence Edge Cases**: Failure/skip progress and selection-only context now persist correctly across reloads; invalid saved state is safely reset.
- **SceneOps Component Errors**: Adding invalid/missing components now returns a clear error instead of silently continuing.

## [1.24.0] - 2025-12-11

### Added
- **Advanced Scene Operations**: Expanded Agent Mode commands for scene management
  - **Instantiate Prefab**: Spawn prefabs while preserving prefab links via `instantiate_prefab`
  - **Delete GameObject**: Remove objects using `delete_gameobject`
  - **Set Active State**: Enable/disable objects using `set_active`
  - **Tag and Layer Support**: Set `tag` and `layer` when creating or modifying GameObjects
- **Schema Enhancements**: Agent JSON schema now includes scene properties (`prefab_path`, `active_state`, `tag`, `layer`)

## [1.23.0] - 2025-12-09

### Added
- **Scene Operations Support**: Agent Mode can now directly manipulate the Unity Scene and create assets
  - **Create GameObjects**: Support for creating primitives (Cube, Sphere, etc.) and empty GameObjects
  - **Modify GameObjects**: Add components and modify properties/fields on existing objects
  - **Create Assets**: Support for creating material assets with shader and color properties
  - **Undo Support**: All scene operations register undo steps for safety
- **New Models Support**: Added support for OpenAI o1 and o3 reasoning models
  - **Model Types**: Support for `o1-preview`, `o1-mini`, and `o3` models
  - **API Compatibility**: Automatic handling of `max_completion_tokens` and parameter restrictions for reasoning models
- **Unity 6000+ Compatibility**: Improved compilation error retrieval
  - Implemented robust reflection-based access to `LogEntries` compatible with Unity 6000+
  - Added fallback mechanisms for error retrieval

### Changed
- **Agent Response Parsing**: Enhanced validation and error handling
  - Improved detection of placeholder text to reject non-functional code responses
  - Better handling of malformed JSON with unescaped newlines in string values
- **Project Operations**: Refactored path handling
  - improved reliability of backup and staging directory paths across platforms
- **UI**: Improved "Apply Changes" button visibility logic in Agent Mode

## [1.22.0] - 2025-12-04

### Added
- **Obfuscation Integration**: Automatic DLL obfuscation in package build pipeline
  - Obfuscar integration for code protection during package builds
  - Automatic Obfuscar detection from multiple installation sources (Chocolatey, NuGet, local tools)
  - Graceful fallback to un-obfuscated DLL if Obfuscar is not available
  - Obfuscated DLLs stored in `Build/Obfuscated/` directory
- **Command-Line Build Support**: Build packages from Unity command line
  - `BuildPackageFromCommandLine.cs` enables batch mode package building
  - `build_package.ps1` PowerShell script for local automated builds
  - Automatic Unity installation detection and compilation validation
  - Comprehensive error reporting and troubleshooting guidance
- **CI/CD Automation**: GitHub Actions workflow for automated package builds
  - Automated package building on push to main/development branches
  - Manual workflow dispatch support
  - Automatic Obfuscar installation in CI environment
  - Build artifacts uploaded for download (packages and obfuscated DLLs)
  - Build logs uploaded for debugging
- **Obfuscar Installation Script**: Automated Obfuscar installation tool
  - `tools/install_obfuscar.ps1` supports multiple installation methods
  - Chocolatey, NuGet, and GitHub direct download installation options
  - Automatic verification of installation success
  - Cross-version compatibility handling for NuGet packages
- **Publishing Guide**: Comprehensive documentation for package publishing
  - Pre-publishing checklist for code quality, documentation, and security
  - Obfuscation setup and configuration instructions
  - Build automation guide for local and CI/CD environments
  - Package structure and validation guidelines

### Changed
- **PackageBuilder**: Enhanced build pipeline with obfuscation support
  - `HandleDll()` now includes obfuscation step before copying to package
  - `PrepareDirectories()` creates `Build/Obfuscated/` directory
  - Build process automatically uses obfuscated DLL when available
  - Improved logging indicates whether obfuscated or raw DLL was used
- **Build Process**: Streamlined package creation workflow
  - Obfuscation integrated seamlessly into existing build pipeline
  - Build continues successfully even if obfuscation fails (uses raw DLL)
  - Enhanced error handling and logging throughout build process
- **Package Structure**: Proxy files now included in package distribution
  - Proxy setup guides and Lambda function code included in package `Proxy/` folder
  - Users can access proxy deployment guides directly from installed package
  - `CopyProxyFiles()` method automatically includes proxy files during build
  - Proxy files moved from root `proxy/` directory to `Assets/Proxy/` for better organization
- **Project Organization**: Improved file structure for packaging
  - Moved proxy files from `proxy/` to `Assets/Proxy/` for inclusion in package builds
  - Moved README.md from `Assets/Editor/UnityAgent/README.md` to `Assets/README.md` for package distribution

### Fixed
- **Project Cleanup**: Removed obsolete files and reorganized structure
  - Moved `SSEParser.cs` from `Assets/Editor/AIAssistant/API/` to `Assets/Demo/` for demo purposes
  - Deleted old execution transcripts from `Assets/Editor/AIAssistant/ExecutionTranscripts/`
  - Cleaned up unused meta files and temporary documentation

## [1.21.0] - 2025-12-04

### Added
- **Plan Generation Status Indicators**: Real-time progress feedback during plan generation
  - Status messages displayed during plan generation: "Analyzing...", "Planning...", "Formatting...", "Arranging..."
  - Status indicators show in conversation window for Chat/Agent modes
  - Status updates integrated into Planning Todo Panel for Multi-Step Mode
  - Loading spinner animation provides visual feedback during plan generation
- **StatusIndicatorUI Component**: Reusable status indicator component for better code organization
  - Extracted status indicator logic from `AIAssistantWindow` into dedicated `StatusIndicatorUI` class
  - Encapsulates streaming box, loading spinner, and text display logic
  - Reduces complexity of main window class (~60 lines moved to component)
  - Reuses existing "streaming box" styling for consistency

### Changed
- **Code Organization**: Refactored status indicator implementation for better maintainability
  - Status indicator logic moved to separate `StatusIndicatorUI` component class
  - `AgentExecutionController.GeneratePlanAsync()` now accepts optional `statusCallback` parameter
  - `StepExecutor` methods updated to support status callbacks during execution
  - Status display logic unified across different execution modes

### Fixed
- **Proxy Cleanup**: Removed unused JavaScript Lambda function implementation
  - Deleted `proxy/lambda_function.js` (Python version is the maintained implementation)
  - Updated proxy documentation to reflect Python-only deployment

## [1.20.0] - 2025-12-04

### Added
- **Smart Context & History Optimization**: Intelligent system for managing conversation context within token limits
  - **Token-Aware History**: Automatically calculates and truncates conversation history to fit within model context windows
  - **Adaptive Summarization**: Automatically summarizes older parts of the conversation when space is running low
  - **Noise Filtering**: Filters out UI status messages (ticks, loading indicators) from the context sent to the AI
- **Semantic Memory Foundation**: Added infrastructure for message embeddings and semantic search integration
- **Design Decision Tracking**: New system to track and retrieve architectural decisions linked to specific files

### Fixed
- **Domain Reload State**: Fixed issue where applying pending changes would sometimes lose state during domain reload
  - Implemented proper state saving before triggering AssetDatabase.refresh
- **Prompt Construction**: Improved "Cursor-style" prompt building for better agent reliability

## [1.19.0] - 2025-12-04

### Changed
- **Project Restructuring**: Major codebase reorganization
  - Renamed main plugin folder from `Assets/Editor/AIAssistant` to `Assets/Editor/UnityAgent`
  - Namespace updated to `UnityAgent.Editor` for better organization
  - Created `UnityAgent.Editor.asmdef` assembly definition for proper dependency management
- **UI Architecture Refactoring**: Improved separation of concerns
  - Moved UI components to `UnityAgent/UI/Components` and `UnityAgent/UI/Controllers`
  - Introduced `AgentExecutionController` and `ResponseHandler` for better logic separation

### Added
- **Packaging System**: New build tools for UPM package generation
  - `PackageBuilder` tool to automate package creation
  - Support for creating `com.cfirz.unityagent` UPM package
  - Placeholder support for DLL obfuscation in build pipeline

## [1.18.0] - 2025-12-03

### Added
- **Staged File Execution**: Multi-step plan execution now stages changes to a temporary directory instead of modifying project files directly
  - **Safety**: Changes are isolated in `Temp/AIAssistant/Staging/` until explicitly applied
  - **Review Workflow**: New "Pending Changes" UI section allows reviewing all staged changes before they affect the project
  - **Atomic Application**: "Apply All" button to commit all staged changes at once
  - **Discard Option**: "Discard All" button to safely clear staged changes without modifying the project
  - **File Comparison**: Comparison window now works with staged files to preview changes before application
- **Step Execution Timeout Monitoring**: Real-time timeout warnings for long-running LLM requests
  - Warnings logged at 30 seconds, then every 60 seconds during request execution
  - Helps identify slow LLM servers or network issues before timeout occurs
  - Background monitoring runs without blocking the main request
- **Request Duration Tracking**: Comprehensive timing information for all API requests
  - Request duration logged on completion and in error handlers
  - Helps identify performance patterns and debug timeout issues

### Changed
- **Step Execution Timeout**: Reduced timeout for step execution from 10 minutes to 3 minutes
  - Step execution requests now use dedicated `HttpClient` with 3-minute timeout
  - Plan generation requests continue using 10-minute timeout for complex operations
  - Faster failure detection when LLM server is slow or unresponsive
- **Execution Workflow**: Multi-step execution no longer validates compilation after each step (since changes are staged, not applied)
  - Compilation validation happens only after applying pending changes
- **Error Handling**: Enhanced timeout and error messages with actionable guidance
  - All timeout errors now include elapsed time and HttpClient timeout value
  - Improved error messages distinguish between different error types (timeout, connection, cancellation)

### Fixed
- **Silent Timeout Failures**: Fixed issue where step execution would hang silently when LLM requests timed out
  - Intermediate timeout warnings now provide visibility into long-running requests
  - Proper error handling ensures timeouts are caught and logged with full context

## [1.17.0] - 2024-12-01

### Added
- **Step Execution Timeout Monitoring**: Real-time timeout warnings for long-running LLM requests
  - Warnings logged at 30 seconds, then every 60 seconds during request execution
  - Helps identify slow LLM servers or network issues before timeout occurs
  - Background monitoring runs without blocking the main request
- **Request Duration Tracking**: Comprehensive timing information for all API requests
  - Request duration logged on completion and in error handlers
  - Helps identify performance patterns and debug timeout issues
  - Duration information included in all timeout error messages

### Changed
- **Step Execution Timeout**: Reduced timeout for step execution from 10 minutes to 3 minutes
  - Step execution requests now use dedicated `HttpClient` with 3-minute timeout
  - Plan generation requests continue using 10-minute timeout for complex operations
  - Faster failure detection for step execution when LLM server is slow or unresponsive
- **Error Handling**: Enhanced timeout and error messages with actionable guidance
  - All timeout errors now include elapsed time and HttpClient timeout value
  - Improved error messages distinguish between different error types (timeout, connection, cancellation)
  - Standardized error message format with consistent troubleshooting guidance
- **StepExecutor Logging**: Enhanced logging throughout step execution lifecycle
  - Detailed logging around request start, completion, and error handling
  - Request duration logged for both successful and failed requests
  - Improved visibility into step execution progress and failures

### Fixed
- **Silent Timeout Failures**: Fixed issue where step execution would hang silently when LLM requests timed out
  - Intermediate timeout warnings now provide visibility into long-running requests
  - Proper error handling ensures timeouts are caught and logged with full context
  - Request duration tracking helps identify patterns in timeout behavior

## [1.16.0] - 2025-11-30

### Added
- **Cursor-Adapted System Prompts**: Centralized prompt system adapted from Cursor IDE (`CursorSystemPrompts.cs`)
  - Defines distinct personas, tool usage guidelines, and code editing protocols
  - **Agent Mode Protocols**: Specialized instructions for code editing, including strict JSON schema enforcement
  - **Response Formatting**: Standardized markdown formatting instructions for consistent output
- **Enhanced Agent Capabilities**: Improved file handling and response reliability
  - **Full File Context**: Agent mode now includes complete file content for editing operations to ensure context awareness
  - **Strict JSON Schema**: Explicit JSON schema validation added to prompts to reduce parsing errors
  - **Step-Specific Prompts**: New `BuildStepExecutionPrompt` for executing plan steps with focused, minimal context
- **Context Awareness Improvements**: Reduced hallucinations and improved relevance
  - **Available Scripts List**: Plan generation prompts now include a list of actual project scripts (from Knowledge Base) to prevent hallucinated file paths
  - **Persistent User Memory**: Automatically includes "User Preferences and Facts" from persistent profile in all prompts
  - **Rules Integration**: Automatically injects custom rules from `Assets/Editor/AIAssistant/Rules/` into the system prompt

### Changed
- **Prompt Construction Refactoring**: Complete rewrite of prompt generation logic
  - Replaced `PromptBuilder` with `MessageBuilder` for asynchronous, context-aware message construction
  - unified "Chat" and "Agent" prompt logic with mode-specific specialized instructions
  - Better handling of conversation history with token-based limiting
- **Model Selection Logic**: Replaced `ModelRecommender` with `ModelSelector`
  - Cross-provider model recommendation (checks both OpenAI and Claude models)
  - Selects best model based on context size requirements vs. available token limits
- **Token Estimation**: Replaced `TokenCalculator` with `TokenEstimator`
  - Centralized token counting and cost estimation logic
  - Updated pricing models for latest GPT-4o and Claude 3.5 Sonnet models
- **Type System**: Centralized core types in `AIAssistantTypes.cs`
  - `ContextBundle` and `Message` types moved to dedicated file for better organization

### Fixed
- **JSON Response Parsing**: Improved `UnescapeContent` method to correctly handle double-escaped characters (newlines, quotes) in agent responses

## [1.15.0] - 2025-01-27

### Added
- **Fixed-Position Streaming Box**: Real-time streaming text display during AI response generation
  - Streaming box appears at fixed position in output window during response generation
  - Height set to 3 lines for consistent display
  - Auto-scrolls to keep streaming box visible during text generation
  - Automatically removed when streaming completes
  - Styled with semi-transparent background for visual distinction
- **Thinking Steps as Assistant Messages**: Thinking steps now integrated directly into conversation flow
  - Thinking steps displayed as assistant messages in the output window
  - Status indicators (⟳ in progress, ✓ completed, ✗ error, • pending) shown in messages
  - Special styling with reduced opacity and italic text to distinguish from final responses
  - Thinking steps preserved in conversation history for context

### Changed
- **Assistant Message Styling**: Removed background color from assistant messages
  - Assistant messages now display without bubble background for cleaner, document-style appearance
  - Maintains consistent spacing and padding for readability
  - User messages retain background color for visual distinction
- **Thinking Panel Repurposed as Todo List**: Thinking panel now displays execution plans
  - Panel title changed from "Thinking Steps" to "Todo list"
  - Displays execution plan steps when available (Multi-Step Mode)
  - Shows progress counter in "To-dos X/Y:" format
  - Expandable/collapsible panel with step status indicators
  - Backward compatible with thinking steps display when no execution plan is present
- **Message Spacing**: Consistent spacing between user and assistant messages
  - Uniform margin-bottom values applied to all message types
  - Even line spacing maintained throughout conversation

### Fixed
- **Streaming Display**: Improved streaming text display with fixed-position box prevents text jumping during generation
- **Message Layout**: Consistent message spacing prevents layout shifts when thinking steps are added

## [1.14.0] - 2025-11-25

### Added
- **Local LM Studio Support**: Connect to local LLM servers running via LM Studio without requiring a proxy server
  - **Local Model Type**: Added "Local" option to model selection dropdown
  - **Local API Provider**: New `APIProvider.Local` provider type for direct local server connections
  - **Local Configuration**: Configurable local server settings stored in `APIKeysConfig`
    - **Local API Base URL**: Default `http://localhost:1234/v1` (configurable)
    - **Local API Key**: Default `lm-studio` (configurable)
    - **Local Model Name**: Free-text field for entering model name as shown in LM Studio (e.g., `deepseek-coder-v2-lite-instruct`)
  - **Direct Connection**: Local requests bypass proxy URL and connect directly to local server
  - **OpenAI-Compatible API**: Uses OpenAI-compatible API format (`/chat/completions` endpoint with `Authorization: Bearer` header)
  - **UI Integration**: Local model name field appears automatically when "Local" model is selected
  - **Settings Window**: Local LLM Configuration section added to API Keys Config Window for easy setup

### Changed
- **ProxyClient**: Enhanced to detect Local provider and route requests directly to local server
  - Local requests use `localApiBase` from `APIKeysConfig` instead of proxy URL
  - Constructs URL as `{localApiBase}/chat/completions` for local requests
  - Uses OpenAI-compatible headers (`Authorization: Bearer`) for local provider
- **ModelConfig**: Updated to handle Local model type
  - `GetModelNameFromEnum()` returns empty string for Local (model name comes from UI field)
  - `GetProviderFromModelType()` returns `APIProvider.Local` for Local model type
- **AIAssistantWindow**: Enhanced model selection UI
  - Shows/hides local model name TextField based on model selection
  - Local model name field persists user input and saves to `APIKeysConfig`
  - Validates local model name is not empty before sending requests
- **APIKeysConfigWindow**: Added Local LLM Configuration section
  - TextField for Local API Base URL with default value and tooltip
  - TextField for Local API Key with default value and tooltip
  - TextField for Local Model Name with tooltip guidance
  - All fields auto-save on change

### Fixed
- **Model Name Handling**: Fixed model name retrieval for Local provider to use UI field value instead of enum conversion

## [1.13.0] - 2025-11-18

### Added
- **Markdown-Based Rich Text Formatting**: LLM messages now display with proper document-style formatting using GitHub-style Markdown
  - **Markdown Parser** (`MarkdownParser.cs`): Converts Markdown text into structured block trees
    - Supports paragraphs, headings (H1-H6), bullet lists, ordered lists, and horizontal rules
    - Handles nested lists with proper indentation tracking
    - Preserves list item continuations (multi-line list items)
    - Integrates seamlessly with existing code block extraction
  - **Markdown Renderer** (`MarkdownRenderer.cs`): Renders Markdown blocks into UI Toolkit VisualElement trees
    - Converts each block type to appropriate VisualElement structure with proper styling
    - Applies USS classes for consistent styling across all Markdown elements
    - Handles spacing, margins, and indentation for proper visual hierarchy
    - Supports nested list rendering with correct layout
  - **Markdown Stylesheet** (`MarkdownStyles.uss`): Comprehensive styling for all Markdown elements
    - Paragraph spacing and margins for readability
    - Heading styles (H1-H6) with progressive font sizes and weights
    - List styles (bullets and numbered) with proper indentation and alignment
    - Horizontal rule styling for visual separators
  - **System Prompt Enhancement**: AI now instructed to format responses in GitHub-style Markdown
    - Uses headings (###) for section titles
    - Uses bulleted lists (-) and numbered lists (1. 2. etc.) for structured content
    - Avoids HTML formatting in favor of Markdown

### Changed
- **Message Display**: Assistant messages now render with full Markdown formatting instead of plain text
  - Replaced `TextField`-based text rendering with `MarkdownRenderer` for structured display
  - Text segments between code blocks are parsed and rendered as Markdown
  - Code blocks remain unchanged and display with syntax highlighting as before
  - Original message content preserved for copy functionality
- **MessageContentParser**: Updated to work with Markdown rendering pipeline
  - `formatText` parameter now defaults to `false` (Markdown rendering replaces TextFormatter)
  - Text segments passed to MarkdownRenderer instead of TextFormatter
  - Maintains backward compatibility with existing code block extraction
- **Streaming Support**: Enhanced streaming message display to support Markdown
  - During streaming, messages display as plain text for immediate feedback
  - After streaming completes, messages are re-rendered with full Markdown parsing
  - Ensures Markdown stylesheet is applied during re-render

### Fixed
- **Message Formatting**: Improved readability of assistant messages with proper document structure
  - Headings now display with appropriate font sizes and spacing
  - Lists display with proper indentation and bullet/number alignment
  - Paragraphs have consistent spacing for better readability

## [1.12.0] - 2025-11-17

### Added
- **Planning Todo Panel**: Expandable todo panel that displays planning steps and progress during plan generation and execution
  - `PlanningTodoPanelUI` component displays execution plan steps as a todo list
  - Shows progress counter in "To-dos X/Y:" format
  - Expandable/collapsible panel with expand button (+/−)
  - Minimized view shows current step description inline with progress
  - Expanded view shows full list of all steps with status indicators
  - Step status indicators: ✓ (completed), ⟳ (in progress), → (current pending), • (pending), ✗ (failed), ⊘ (skipped)
  - Panel positioned at bottom of output container with semi-transparent overlay
  - Automatically shows/hides based on orchestrator state (visible during Planning, AwaitingApproval, Executing, Paused states)
  - Expansion state persists across Unity domain reloads
  - Real-time progress updates during step execution
  - Efficient single-step updates without full panel rebuild
  - Text truncation with tooltips for long step descriptions
  - Custom USS styling via `PlanningTodoPanelStyles.uss`

### Changed
- **AIAssistantWindow**: Integrated planning todo panel into main window
  - Panel created and positioned in `CreateGUI()` method
  - Panel updated when plan is generated via `OnPlanGenerated()` event
  - Panel visibility controlled by `OnOrchestratorStateChanged()` event handler
  - Step progress updated during execution via `OnStepCompleted()` and `ExecutePlanAsync()`
  - Expansion state saved to `_savedPlanningTodoPanelExpanded` field for persistence

## [1.11.0] - 2025-11-16

### Added
- **Auto-Execute Plans**: Multi-step plans now automatically execute without requiring manual approval
  - Plans are generated and immediately executed in Auto mode
  - Planning progress displayed in conversation window: "Planning: Analyzing your request..."
  - Plan summary shown in conversation before execution begins
  - Seamless transition from planning to execution
- **File Change Tracking**: Comprehensive tracking of all file modifications during step execution
  - `FileChangeMetadata` class tracks original content, new content, and change summaries
  - Tracks change types: Created, Modified, Deleted
  - Stores backup paths for revert functionality
  - Associates changes with specific execution steps
- **File Change List UI**: Visual display of all file changes in conversation window
  - `FileChangeListUI` component displays file changes after each step
  - Shows file path, change type badge (NEW/MOD/DEL), and change summary
  - Clickable file paths open comparison window
  - Accept (✓) and Revert (✗) buttons for each file change
  - Reverted files automatically filtered from display
- **File Comparison Window**: Side-by-side comparison view for reviewing changes
  - `FileComparisonWindow` EditorWindow displays original vs modified content
  - Side-by-side layout with line numbers
  - Header shows file path, change type badge, and change summary
  - Footer with Accept, Revert, and Close buttons
  - Handles empty states for created/deleted files
  - Proper UI initialization handling to prevent display issues

### Changed
- **Multi-Step Mode Workflow**: Plans now auto-execute instead of requiring approval step
  - `OnPlanGenerated()` automatically calls `ApprovePlan()` and `ExecutePlanAsync()`
  - Execution mode set to Auto before approval
  - Plan summary displayed in conversation before execution starts
- **Step Execution**: Enhanced to track file changes during execution
  - `StepExecutor.ExecuteStepAttemptAsync()` reads original file content before changes
  - Creates `FileChangeMetadata` objects for each file modification
  - Stores file changes in `StepExecutionResult.FileChanges` list
  - File changes displayed in conversation after each step completes
- **ChatMessage**: Extended to support file change metadata
  - Added `fileChanges` property to `ChatMessage` class
  - File changes serialized with conversation history
  - File change lists displayed when rendering messages
- **ProjectOps**: Added file revert functionality
  - `RevertFileChange()` method restores files from backups
  - Handles Created, Modified, and Deleted file types
  - Deletes created files if no backup exists
  - Returns success/failure status for UI feedback

### Fixed
- **Compilation Error Retrieval**: Improved reliability of Unity LogEntries API access
  - Updated reflection approach to use `System.Type.GetType("UnityEditor.LogEntries,UnityEditor.dll")`
  - Added fallback to assembly-based approach if primary method fails
  - Improved error logging with full stack traces for debugging
  - Per-entry error handling to continue processing even if individual entries fail
  - Enhanced fallback method provides helpful guidance when errors can't be retrieved

## [1.10.0] - 2025-11-16

### Added
- **Hybrid Context-Sharing System**: Intelligent project-aware context system that balances token efficiency with contextual fidelity
  - **Project Knowledge Base**: Persistent knowledge base that parses and caches project structure
    - Automatic project scanning on initialization (limited to 1000 files)
    - Caches class outlines, dependencies, and project summaries to disk
    - Thread-safe singleton pattern with automatic cache invalidation
    - File change detection via `KnowledgeBaseAssetPostprocessor` for automatic updates
    - Cache stored in `Library/AIAssistantCache/knowledge_base.json` for fast loading
  - **Code Parsing**: Regex-based C# code parser extracts project structure
    - Extracts class names, namespaces, base classes, and interfaces
    - Parses method signatures, parameters, and field declarations
    - Builds dependency relationships between classes
    - Generates class descriptions from XML documentation comments
  - **Query Analysis**: Intelligent query analyzer determines relevant code files
    - Extracts explicit file paths from user queries
    - Identifies class names and finds matching files
    - Detects query scope (Broad, Specific, Debug) based on keywords
    - Suggests relevant files based on class relationships and dependencies
    - Event-driven architecture for UI progress updates
  - **Context Retrieval**: Detail-level-based context retrieval system
    - Four detail levels: Minimal, Summary, Standard, Full
    - Minimal: Project summary only (~100 tokens)
    - Summary: Project summary + class outlines (~500 tokens)
    - Standard: Project summary + relevant file summaries (~2000 tokens)
    - Full: Project summary + complete relevant file contents (~8000 tokens)
    - Automatic file limit enforcement (max 10 files) to prevent token overflow
  - **Iterative Refinement Handler**: Detects when LLM requests more context and automatically provides it
    - Pattern matching for context requests ("need more context", "show me the code", etc.)
    - Retrieves additional files based on LLM requests
    - Limits refinement to 5 additional files to control token usage
    - Integrates seamlessly with existing conversation flow
  - **Dependency Graph**: Tracks code dependencies across the project
    - Builds dependency relationships from namespace hierarchies
    - Tracks base classes and interface implementations
    - Provides dependency and dependent lookups for context retrieval
    - Normalized path handling for consistent lookups
  - **Thinking Panel UI**: Visual feedback system showing AI "thinking" steps
    - `ThinkingPanelUI` component displays processing steps in real-time
    - Shows steps like "Analyzing query...", "Found class: X", "Retrieving context..."
    - Status indicators: Pending, InProgress, Completed, Failed
    - Collapsible panel with progress bar and summary statistics
    - Custom USS styling with `ThinkingStepStyles.uss`
  - **Path Utilities**: Centralized path normalization utility
    - `PathUtils.NormalizePath()` ensures consistent path handling
    - Converts absolute paths to relative paths from project root
    - Handles Windows/Unix path separators
    - Used across all context system components
  - **Prompt Size Checking**: Utility for monitoring prompt token usage
    - `PromptSizeChecker` estimates token counts for prompts
    - Helps prevent token limit errors
    - Provides warnings when prompts approach limits
  - **Request Queue**: Queue system for managing API requests
    - Prevents concurrent request conflicts
    - Handles request ordering and cancellation
    - Integrates with rate limit handling

### Changed
- **AIAssistantSettings**: Extended with context system configuration options
  - `contextDetailLevel`: Default context detail level (0-3, default: 2 = Standard)
  - `autoDetectQueryScope`: Enable automatic query scope detection (default: true)
  - `enableSemanticSearch`: Enable semantic search with embeddings (default: false, future feature)
  - `knowledgeBaseAutoRefresh`: Auto-refresh knowledge base on file changes (default: true)
  - `maxProjectSummaryTokens`: Maximum tokens for project summary (default: 500)
- **PromptBuilder**: Enhanced to integrate with context-sharing system
  - `BuildMessages()` now accepts `ContextDetailLevel` parameter
  - Automatically uses `ProjectKnowledgeBase` for project context
  - Integrates `QueryAnalyzer` and `ContextRetriever` for intelligent context selection
  - Includes dependency information for context files
  - Respects detail level settings for token optimization
- **ContextCache**: Extended with knowledge base caching methods
  - `CacheClassOutline()` and `GetCachedClassOutline()` for class outline caching
  - `CacheDependencyGraph()` and `GetCachedDependencyGraph()` for dependency caching
  - Reduces redundant parsing when knowledge base is used
- **ProjectContextProvider**: Enhanced to work with knowledge base system
  - Integrates with `ProjectKnowledgeBase` for richer project summaries
  - Uses cached knowledge base data when available
  - Falls back to basic project info if knowledge base not initialized
- **AIAssistantWindow**: Integrated thinking panel and context system
  - Thinking panel displays during query analysis and context retrieval
  - Automatic knowledge base initialization on window open
  - Context detail level selector in UI
  - Progress indicators for knowledge base operations

### Fixed
- **Path Normalization**: Consistent path handling across all context system components
  - All components now use `PathUtils.NormalizePath()` for consistency
  - Prevents dependency graph lookup failures due to path mismatches
  - Handles both Windows and Unix path separators correctly

## [1.9.0] - 2025-11-16

### Added
- **Multi-Step LLM Execution Flow**: Structured "plan → approve → execute" workflow for complex tasks
  - **Plan Generation**: AI breaks down user tasks into numbered, atomic steps (2-10 steps per plan)
    - Plans generated via structured JSON output from LLM
    - Plan includes step descriptions and context file references
    - Plans validated for structure and step count before approval
  - **Plan Editor UI**: Interactive plan review and editing interface
    - View all steps in an editable list with descriptions
    - Reorder steps using up/down buttons
    - Edit step descriptions inline
    - Delete individual steps
    - Regenerate plan if unsatisfied with initial result
  - **Step Execution**: Sequential execution of plan steps with progress tracking
    - Each step executes with minimal context (only files referenced in step)
    - Step status indicators: Pending, InProgress, Completed, Failed, Skipped
    - Real-time progress updates during execution
    - Automatic retry logic (up to 2 retries) for failed steps
    - Compilation validation after code changes
  - **Execution Controls**: Pause, resume, and cancel execution at any time
    - Pause execution between steps
    - Resume from paused state
    - Cancel execution and return to idle state
  - **Context Caching**: Intelligent file content caching to reduce token usage
    - File content cached with hash-based change detection
    - Cache invalidated when files are modified
    - Reduces redundant file reads and API costs
  - **File Backup System**: Automatic backups before file modifications
    - Backups created in `Backups/` directory with timestamps
    - Backup registry tracks all backups created during execution
    - Restore functionality available for all backed up files
  - **Execution Summary**: Comprehensive summary after plan completion
    - Tracks files created, modified, and deleted
    - Step completion statistics (completed, failed, skipped)
    - Token usage tracking and cost estimation
    - Execution time measurement
  - **Execution Transcripts**: Markdown transcripts saved after execution
    - Complete execution log with step-by-step results
    - Saved to `Assets/Editor/AIAssistant/ExecutionTranscripts/` directory
    - Includes plan details, step results, and summary
  - **Token Usage Tracking**: Per-step and total token usage monitoring
    - Tracks input and output tokens for each step
    - Estimates API costs based on provider pricing
    - Token usage included in execution summary
  - **Integration with Conversation System**: Multi-step plans integrated with existing conversation history
    - Plans and execution results saved as conversation messages
    - Execution history accessible via conversation system
    - Plan context maintained across conversation sessions

### Changed
- **Mode Selection**: Added "MultiStep" mode option alongside "Chat" and "Agent" modes
  - Default mode set to "MultiStep" in `AIConfig.json`
  - Mode toggle in UI switches between Chat, Agent, and MultiStep modes
- **PromptBuilder**: Enhanced with plan-specific prompt building methods
  - `BuildPlanGenerationPrompt()` - Creates prompts for plan generation with structured output instructions
  - `BuildStepExecutionPrompt()` - Creates prompts for executing individual steps with minimal context
  - Plan prompts include JSON schema requirements for structured responses
- **AIAssistantWindow**: Extended with multi-step workflow UI
  - Plan editor panel for viewing and editing execution plans
  - Execution controls (Pause, Resume, Stop buttons)
  - Step status indicators in plan display
  - Execution progress tracking in conversation messages

## [1.8.0] - 2025-01-XX

### Added
- **External Rules Loading**: Users can now add custom rule files to automatically include in AI prompt context
  - Created `Assets/Editor/AIAssistant/Rules/` folder for user-defined rule files
  - Supports `.txt`, `.md`, and `.text` file extensions
  - Files are loaded in alphabetical order and automatically appended to system prompts
  - Rules are loaded fresh on each prompt build, allowing changes without Unity restart
  - Graceful error handling: missing folder or file read errors are logged but don't block functionality
  - Rules are appended after system prompts and project context, before user messages
  - System prompts remain hardcoded in code to prevent breaking response structure

## [1.7.1] - 2025-11-10

### Changed
- **Plugin Folder Organization**: Reorganized AIAssistant plugin folder structure for better maintainability
  - Created logical subfolders: `Core/`, `UI/`, `Styles/`, `API/`, `Agents/`, `Context/`, `Parsing/`, and `Config/`
  - Moved all C# scripts to appropriate folders based on functionality
  - Moved all USS style files to `Styles/` folder
  - Updated hardcoded paths in `AIAssistantWindow.cs` to reference new `Styles/` folder location
  - Improved code organization and navigation within the plugin

## [1.7.0] - 2025-11-10

### Added
- **Assistant Message Text Formatting**: Improved readability of assistant messages with automatic text formatting
  - **Sentence Breaks**: Automatically adds line breaks after sentences (periods) for better readability
    - Intelligently avoids breaking after decimals, URLs, file paths, version numbers, and abbreviations
    - Skips sentence breaks within list items to preserve list formatting
  - **Bullet Point Formatting**: Formats various bullet point styles (`-`, `*`, `•`) with consistent indentation and spacing
    - Normalizes different bullet styles to a consistent format
    - Handles nested bullets with proper indentation
    - Adds proper spacing before and after bullet lists
  - **Numbered List Formatting**: Formats numbered lists (`1)`, `2)`, `1.`, `2.`, etc.) with proper alignment
    - Converts inline numbered items to line-start format for better readability
    - Handles multi-line list items with proper indentation
    - Aligns numbers consistently regardless of digit count
  - **Formatting Preservation**: Original unformatted text is preserved for copy functionality
    - Users can copy the original text without formatting modifications
    - Formatting is applied only to the display, not the stored content
  - **Smart Formatting Rules**: Intelligent detection of edge cases
    - Recognizes common abbreviations (Dr., Mr., etc., i.e., e.g., etc.)
    - Detects URLs and prevents breaking within them
    - Identifies file paths and version numbers to avoid incorrect breaks
    - Handles decimal numbers and prevents breaking within them

### Changed
- **Message Display**: Assistant messages now display with improved formatting for better readability
  - Text formatting is applied automatically to all assistant messages
  - User messages remain unformatted (preserve original input)
  - Formatting works for both streaming and completed messages
- **Code Block Handling**: Text formatting is applied to text segments while preserving code blocks
  - Code blocks remain unformatted (preserve code structure)
  - Text segments between code blocks are formatted for readability
  - Formatting is integrated into the message parsing pipeline

## [1.6.0] - 2025-11-09

### Added
- **Code Block Collapse/Expand**: Code blocks in conversation messages can now be collapsed and expanded
  - Click the arrow (▼/▶) next to the language label to toggle code block visibility
  - Code blocks start expanded by default
  - Arrow indicator changes direction to reflect current state (▼ = expanded, ▶ = collapsed)
  - Improves UI organization when viewing long code snippets

### Fixed
- **JSON Parsing**: Fixed parsing errors when AI generates JSON with literal newlines in string values
  - Added `FixMalformedJson()` method to automatically escape newlines and special characters
  - Handles cases where AI generates JSON with unescaped newlines, tabs, and other control characters
  - Prevents "Invalid JSON" errors when parsing agent mode responses
- **Agent Response Formatting**: Improved display of agent mode responses
  - Comment-only actions now display formatted text instead of raw JSON
  - Agent responses are properly rebuilt after formatting to show readable content
  - Better handling of escaped content in comments and responses

## [1.5.0] - 2025-11-08

### Added
- **Conversation History System**: Continuous chat flow with persistent conversation history
  - `Conversation` and `ChatMessage` classes for managing conversation data
  - `ConversationManager` singleton for save/load/delete operations
  - Conversations automatically saved to `Assets/Editor/AIAssistant/Conversations/` directory
  - Automatic cleanup of old conversations (configurable max count, default: 50)
  - Conversation index file for fast metadata loading
- **Chat-Style UI**: Messaging app-style interface for conversations
  - `MessageBubbleUI` for displaying user and assistant messages in chat bubbles
  - `CodeBlockUI` for syntax-highlighted code blocks within messages
  - `MessageContentParser` for parsing markdown and code blocks in messages
  - Real-time streaming updates in message bubbles
  - Auto-scroll to latest message
- **Conversation History Panel**: History dropdown with advanced features
  - `ConversationUI` component for managing conversation list
  - Search functionality to find conversations by title or message content
  - Date grouping (Today, This Week, This Month, older by month/year)
  - Favorites/star functionality to mark important conversations
  - "New Conversation" button to start fresh conversations
  - Conversation selection to load and continue previous chats
- **Context Integration**: Conversation history automatically included in LLM context
  - `PromptBuilder.BuildMessages()` now accepts `Conversation` parameter
  - Previous messages from conversation included in context (configurable max, default: 20)
  - Conversation history helps AI maintain context across multiple messages
  - User message context (selection, console errors) preserved in conversation history

### Changed
- **AIAssistantWindow**: Major UI overhaul for conversation-based workflow
  - Replaced single output text field with message container showing chat bubbles
  - Added conversation header with title display and history button
  - Integrated conversation loading on window open (loads most recent conversation)
  - Auto-save conversations after each message exchange
  - Conversation title auto-generated from first user message
- **AIAssistantSettings**: Added conversation configuration options
  - `maxConversations`: Maximum number of conversations to keep (default: 50)
  - `maxHistoryMessages`: Maximum previous messages to include in context (default: 20)
  - `autoSaveConversations`: Whether to auto-save conversations (default: true)
- **PromptBuilder**: Enhanced to support conversation history
  - `BuildMessages()` method now accepts optional `Conversation` parameter
  - Automatically includes previous messages from conversation in LLM context
  - Respects `maxHistoryMessages` setting to limit context size
- **Git Ignore**: Added `Assets/Editor/AIAssistant/Conversations/` to exclude conversation files from version control

## [1.4.0] - 2025-11-08

### Added
- **Multi-Provider AI Support**: Full support for both OpenAI and Anthropic Claude AI providers
  - `APIProvider` enum and `ProviderConfig` class for provider abstraction
  - Provider-specific API handling (base URLs, endpoints, authentication headers)
  - Automatic provider detection based on selected model type
  - Support for Claude models: Claude 3 Opus, Claude 3.5 Sonnet, Claude 3 Sonnet, Claude 3 Haiku
  - Default model changed to Claude 3.5 Sonnet (ClaudeSonnet45)
- **Secure API Key Management**: Local storage system for API keys with per-provider support
  - `APIKeysConfig` class for managing API keys stored in `Assets/Editor/AIAssistant/.api_keys.json`
  - Separate API keys for OpenAI and Claude providers
  - Automatic `.gitignore` exclusion to prevent accidental commits
  - `APIKeysConfigWindow` editor window for easy API key configuration
  - Settings button (⚙) in main window to access API key configuration
- **Provider-Specific API Handling**: Intelligent handling of API differences between providers
  - Claude uses `x-api-key` header with `anthropic-version` header
  - OpenAI uses `Authorization: Bearer` header
  - Claude uses `max_tokens` parameter (not `max_completion_tokens`)
  - Automatic parameter selection based on provider and model type
  - Provider routing via `X-Provider` header for proxy compatibility

### Changed
- **Default Model**: Changed default model from GPT-5 to Claude 3.5 Sonnet (ClaudeSonnet45)
- **Model Configuration**: Added `provider` field to `ModelConfig` class
  - Models now include provider information for proper API routing
  - Model selection automatically switches to appropriate provider
- **Request Factory**: Enhanced to handle provider-specific request building
  - Provider-specific parameter handling (max_tokens vs max_completion_tokens)
  - Provider-specific temperature support (Claude supports temperature, GPT-5 doesn't)
  - Provider-specific JSON response format (OpenAI only)
- **Proxy Client**: Enhanced to handle provider-specific authentication
  - Automatic header selection based on provider type
  - Provider information included in request headers for proxy routing
  - Improved error handling for provider-specific API errors

### Fixed
- **API Key Storage**: Fixed API key persistence to use secure local storage
  - Keys stored in `.api_keys.json` (excluded from git)
  - Per-provider key management prevents key conflicts
  - Automatic key loading on window initialization

## [1.3.0] - 2025-11-06

### Added
- **GPT-5 Model Support**: Full support for GPT-5 and newer OpenAI models
  - Automatic detection of GPT-5+ models and use of `max_completion_tokens` instead of `max_tokens`
  - Special handling for GPT-5 temperature restrictions (uses default temperature of 1.0)
  - Support for GPT-4o and GPT-4oMini models
  - Default model changed to GPT-5
- **Lambda Function URL Support**: Enhanced proxy to support both API Gateway and Lambda Function URLs
  - Lambda Function URLs support up to 15 minutes timeout (vs API Gateway's 29 seconds)
  - Automatic event format normalization for seamless compatibility
  - Improved CORS configuration for Function URLs
- **Enhanced Error Handling**: Better detection and handling of Cloudflare blocking and HTML error responses
  - Detects HTML error pages and provides meaningful error messages
  - Improved timeout handling for slower models (GPT-5 requires extended timeouts)
  - Enhanced logging with masked API keys for security
- **Improved Debugging**: Comprehensive request/response logging
  - Full request logging including model, temperature, token limits, and message content
  - Response status and header logging for troubleshooting
  - Request size warnings for large file content requests

### Changed
- **System Prompt**: Simplified and optimized system prompt for better AI responses
  - More concise instructions focusing on Unity and C# best practices
  - Enhanced refactoring guidelines with incremental, safe approach
  - Better emphasis on code completeness and compilation readiness
- **Request Factory**: Enhanced token limit handling
  - Automatic detection of GPT-5+ models requiring `max_completion_tokens`
  - Conditional temperature parameter (omitted for GPT-5 models)
  - Backward compatibility with older models using `max_tokens`
- **Lambda Proxy Timeout**: Extended timeouts for GPT-5 models
  - GPT-5 non-streaming requests: 120 seconds (2 minutes)
  - File content requests: 180 seconds (3 minutes)
  - Streaming requests: 290 seconds (up to API Gateway limit)
  - Default non-streaming: 90 seconds
- **Model Configuration**: Updated default model to GPT-5
  - Added GPT5, GPT4o, GPT4oMini to ModelType enum
  - Reordered enum to prioritize newer models

### Fixed
- **Parameter Compatibility**: Fixed parameter handling for GPT-5 models
  - Correctly uses `max_completion_tokens` for GPT-5+ models instead of `max_tokens`
  - Omits temperature parameter for GPT-5 (which doesn't support custom temperature)
  - Prevents sending incompatible parameters that could cause API errors
- **Lambda Event Handling**: Fixed compatibility issues between API Gateway and Function URL event formats
  - Automatic event normalization ensures both formats work seamlessly
  - Proper header extraction for both event types
- **Error Response Parsing**: Improved handling of HTML error responses from Cloudflare or gateways
  - Detects HTML responses and extracts meaningful error messages
  - Provides specific error messages for 502, 503, and 504 status codes

## [1.2.0] - 2025-01-05

### Changed
- **Agent Mode UI Improvements**: Removed popup confirmation dialog; replaced with "Apply Changes" button positioned next to the output area for better workflow
- **Output Formatting**: Agent Mode now displays formatted, readable code suggestions instead of raw JSON responses
  - Code content is properly unescaped with correct line breaks and formatting
  - Displays action type, file path, comment, and formatted code content in a readable format
- **JSON Parser Enhancements**: Improved JSON extraction to intelligently skip non-JSON code blocks (C#, Python, JavaScript, etc.)
  - Parser now correctly identifies and extracts JSON from markdown code blocks while ignoring code examples
  - Better validation ensures only JSON matching the expected schema is parsed
  - Prevents "No JSON found" errors when responses contain code examples

### Fixed
- **Parsing Errors**: Fixed issue where parser would incorrectly extract C# code blocks as JSON, causing parse failures
- **Apply Button Visibility**: Fixed Apply button not appearing in Agent Mode after successful parsing
- **Response Display**: Fixed Agent Mode showing raw JSON with escaped sequences instead of formatted, readable code
- **Error Handling**: Improved error messages and debug logging for better troubleshooting of parsing issues

## [1.1.0] - 2024-12-28

### Added
- **Agent Mode**: New interactive mode that allows AI to automatically modify Unity project files based on structured JSON responses
  - Supports file operations: create, edit, delete, and comment-only actions
  - Automatic file path detection from user prompts
  - Full file content inclusion for better context when editing files
  - Agent mode toggle in UI with Chat/Agent selection
  - "Apply Change" button for manual application in Chat mode
  - Structured JSON response parsing from AI model
  - File operation logging to `AI_Agent_Log.txt` for audit trail
  - Configuration via `Assets/Editor/AIConfig.json` with mode, autoCommit, and contextLines settings
- **Enhanced Lambda Proxy**:
  - Automatic timeout detection for file content requests (extends to 120 seconds)
  - Improved response validation and error handling
  - Better CloudWatch logging for debugging
  - Enhanced JSON response validation
  - Header validation for API Gateway compatibility
- **Troubleshooting Documentation**:
  - `proxy/TROUBLESHOOTING_502.md` - Comprehensive guide for fixing 502 Bad Gateway errors
  - `proxy/LAMBDA_TESTING_GUIDE.md` - Guide for testing Lambda function directly
  - Test event JSON files for both agent and chat modes

### Changed
- **Prompt Builder**: Enhanced to detect file paths in prompts and automatically include full file content
- **Request Factory**: Increased max_tokens to 4000 when file content is detected in agent mode
- **Proxy Client**: Added support for non-streaming responses required for agent mode JSON parsing
- **Lambda Function**: Major improvements to error handling, timeout management, and response format validation

### Fixed
- **Lambda Timeout Issues**: Fixed 502 Bad Gateway errors caused by Lambda function timeout being too low (3 seconds) for file content requests
  - Lambda now automatically detects file content and uses extended timeout (120 seconds)
  - Added comprehensive troubleshooting guide for timeout configuration
- **Response Validation**: Enhanced validation of Lambda responses to ensure API Gateway compatibility
- **Error Handling**: Improved error messages and logging for better debugging

## [Previous Versions]

_Note: Previous versions were not tracked in this changelog._
