# koryboyd/thepopebot

Fork of [stephengpope/thepopebot](https://github.com/stephengpope/thepopebot) – **Local-First, Free & Auditable Variant** (Work in Progress)

**Current status (28 Feb 2026)**  
Early development – many foundational pieces are committed, but **not yet a complete runnable local version**.  
Core upstream cloud/GitHub Actions dependencies are still present. Patches are being collected to enable 100% local operation.

**Vision**  
Run Popebot completely **offline/local** using Ollama (free, unlimited inference) while keeping the original's killer feature: **the repository itself is the agent** — every action produces git commits, full audit trail, reversible changes via git history.

### Comparison: This Fork vs Upstream (main branch)

| Feature / Aspect              | Upstream (stephengpope/thepopebot)                          | This fork (local-first)                                      | Status in fork |
|-------------------------------|-------------------------------------------------------------|--------------------------------------------------------------|----------------|
| LLM backend                   | Cloud APIs (Claude, OpenAI, Google GenAI)                   | Local Ollama (OpenAI-compatible endpoint)                    | Planned – `.env` ready |
| Job/Agent execution           | GitHub Actions workflows (minutes limited)                  | Local Docker + `act` or simple supervisor script             | Planned – no runner yet |
| Compute cost                  | Free GitHub Actions (but finite)                            | Zero ongoing cost (hardware/electricity only)                | Achieved when complete |
| Offline / local capability    | Requires internet (Actions, webhooks, ngrok)                | Full offline possible after patches                          | Partial (helpers added) |
| Audit trail                   | Git commits/PRs via GitHub                                  | Same git-based + local visibility (potentially stronger)     | Preserved |
| Memory persistence            | Not built-in (relies on LLM context)                        | Daily `.md` logs + long-term `MEMORY.md` + loader            | Implemented (lib/memory.js) |
| Skills system                 | Basic shared skills dir                                     | Lazy-loaded registry + metadata injection                    | Implemented (registry.json + loader) |
| Proactive loops               | Configurable via CRONS.json + Actions                       | Local heartbeat (30 min) + daily reflection (cron)           | Implemented (cron append) |
| Sub-agents / orchestration    | Not native                                                  | Branch-based spawning + orchestrator stub                    | Skeleton added (orchestrator.js) |
| Windows 11 support            | Possible but GitHub/ngrok heavy                             | Explicit focus (Docker Desktop WSL 2 + native Ollama)        | Guide added below |

### What's Already Added (committed)

- `config/PERSONALITY.md` + `LONG_TERM_RULES.md` → inject personality & hard rules
- `skills/registry.json` + example `SKILL.md` files → foundation for lazy loading
- `lib/memory.js` → `loadRecentMemory()` helper (recent logs + long-term)
- `lib/skills/loader.js` → compact skill list for prompts
## thepopebot — Local‑First Event Handler and Agent Framework

This repository is a fork of the upstream thepopebot project, adapted for a local-first, auditable, and self-hosted deployment model. The core design principle is that the repository serves as the source of truth and audit trail: actions that change state are recorded as git commits so changes are traceable and reversible.

Status
------
This fork provides scaffolding and safe-guards to run the event handler and agent infrastructure locally (offline) with an Ollama-compatible LLM and a local job runner. Some upstream features (GitHub Actions automation, hosted webhooks) remain available but are gated behind `RUN_LOCALLY` to avoid accidental network calls in local deployments.

Key Design Points
-----------------
- Local-first: Operations can run entirely on a single machine when `RUN_LOCALLY=true`.
- Auditable: All important state changes are persisted and committed to the local git repository.
- Sandboxed execution: The repository includes a sandbox helper for running untrusted work inside a Docker container.
- Extensible: A lightweight gateway scaffold is provided for adding multi-channel adapters (Telegram, Discord, Signal, etc.) in a controlled, optional manner.

Quick links
-----------
- Configuration: [config/index.js](config/index.js)
- Local mode guard: `RUN_LOCALLY` (see `.env.example`)
- Memory utilities: [lib/memory.js](lib/memory.js)
- Skills loader: [lib/skills/loader.js](lib/skills/loader.js)
- OpenClaw-inspired gateway scaffold: [lib/openclaw/gateway.js](lib/openclaw/gateway.js)

Prerequisites
-------------
- Node.js 18 or later
- Git (command line)
- Docker (for sandboxed execution and local job runner)
- Optional: Ollama (local LLM server) or compatible inference provider

Installation (local-first)
--------------------------
1. Clone the repository and install dependencies:

```bash
git clone https://github.com/stephengpope/thepopebot.git
cd thepopebot
npm install
```

2. Copy the example environment file and edit values as required:

```bash
cp .env.example .env
# Edit .env to set RUN_LOCALLY=true and any LLM endpoints or keys
```

3. If you plan to run the agent fully offline, install and run a local LLM server (for example, Ollama) and ensure the `OPENAI_BASE_URL` / provider settings point to the local endpoint.

Running the event handler (development)
-------------------------------------
Start the Next.js event handler (development mode):

```bash
npm run dev
```

Run the local job supervisor in a separate terminal (this watches for local `job/*` branches and executes them):

```bash
node local-supervisor.js
```

Configuration highlights
------------------------
- `RUN_LOCALLY` (environment): When `true`, the code paths that would call remote GitHub APIs are replaced with local git operations and file-based logging. This is a safety measure to prevent network interactions during local testing.
- `config/CRONS.json`: Cron definitions for scheduled jobs. Local heartbeat and reflection cron entries are implemented to persist memory and commit it to git.
- `skills/registry.json`: Canonical registry of available skills. The agent loads this list to include available capabilities in prompts.

Security and auditability
-------------------------
- Secrets: Do not commit secret values. Use `.env` and repository secret management for any remote deployments.
- Pre-commit: A `.pre-commit-config.yaml` is provided to integrate `detect-secrets` and formatting hooks. Enable it locally to prevent accidental secret leaks.
- Sandboxing: Use `lib/sandbox.js` to execute untrusted or third-party skill code inside isolated Docker containers with restricted network access.

Recommended workflow
--------------------
1. Enable `RUN_LOCALLY=true` in your `.env` during initial setup and testing.  
2. Start the event handler and the local supervisor.  
3. Create a test job via the web UI or API and confirm the supervisor picks it up and commits results to a `job/*` branch.  
4. Review commits and logs in the `logs/` directory to verify audit trail.

Developer notes
---------------
- New components and scaffolding were added to enable local-first operation. See [docs/OPENCLAW_ADOPTION.md](docs/OPENCLAW_ADOPTION.md) for the rationale and integration plan.
- When adding new adapters or installers, ensure they record configuration changes by committing to git for traceability.

Contributing
------------
Contributions are welcome. Please open a pull request with focused changes and include unit or integration tests where applicable. Follow the repository's contribution guidelines and code style.

License
-------
MIT

Contact and upstream
--------------------
Upstream project: https://github.com/stephengpope/thepopebot
For questions or to report issues, open an issue in this repository.


---

## Docs

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | Two-layer design, file structure, API endpoints, GitHub Actions, Docker agent |
| [Configuration](docs/CONFIGURATION.md) | Environment variables, GitHub secrets, repo variables, ngrok, Telegram setup |
| [Customization](docs/CUSTOMIZATION.md) | Personality, skills, operating system files, using your bot, security details |
| [Chat Integrations](docs/CHAT_INTEGRATIONS.md) | Web chat, Telegram, adding new channels |
| [Running Different Models](docs/RUNNING_DIFFERENT_MODELS.md) | Event Handler vs job model config, per-job overrides, providers, custom provider |
| [Auto-Merge](docs/AUTO_MERGE.md) | Auto-merge controls, ALLOWED_PATHS configuration |
| [Deployment](docs/DEPLOYMENT.md) | VPS setup, Docker Compose, HTTPS with Let's Encrypt |
| [Claude Code vs Pi](docs/CLAUDE_CODE_VS_PI.md) | Comparing the two agent backends (subscription vs API credits) |
| [How to Build Skills](docs/HOW_TO_BUILD_SKILLS.md) | Guide to building and activating agent skills |
| [Pre-Release](docs/PRE_RELEASE.md) | Installing beta/alpha builds |
| [Security](docs/SECURITY.md) | Security disclaimer, local development risks |
| [Upgrading](docs/UPGRADE.md) | Automated upgrades, recovering from failed upgrades |

### Maintainer

| Document | Description |
|----------|-------------|
| [NPM](docs/NPM.md) | Updating skills, versioning, and publishing releases |
