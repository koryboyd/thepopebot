# Vision: Local-First, Free, Unlimited, Auditable Popebot

Goal of this fork/branch/experiment:

Run the entire system on your own computer (Windows 11 / Linux / macOS)
→ zero ongoing monetary cost (beyond electricity)
→ no GitHub Actions minute limits
→ no cloud LLM API bills
→ full git commit history audit trail preserved

Key changes planned / partially implemented:

• LLM inference via Ollama (OpenAI-compatible endpoint)
• Local job execution (act + simple supervisor or direct docker run instead of GitHub Actions)
• Persistent memory via daily .md logs + MEMORY.md
• Lazy-loaded skills registry
• Proactive heartbeat + reflection loops (local cron)
• Sub-agent coordination via git branches + orchestrator skill
• Windows 11 friendly instructions (Docker Desktop WSL 2, native Ollama, Tailscale)

Current status: planning + skeleton files
Not yet a complete runnable local version — incremental patches being collected.

Help welcome: PRs that move toward fully local execution while keeping git-as-state auditability.