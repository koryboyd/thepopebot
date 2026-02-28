This document sketches how to adopt OpenClaw-inspired features into thepopebot.

Goals
- Multi-channel gateway (local, opt-in)
- Sandboxed agent sessions (Docker)
- CLI enhancements and doctor checks
- Skills install gating and approvals
- Model failover configuration
- Secure remote access via Tailscale (optional)

Notes
- All new components are scaffolded under `lib/openclaw`, `lib/sandbox.js`, and `lib/skills/installer.js`.
- Configuration and approval artifacts should be committed to git for auditability.
- Implement features incrementally: sandboxing + CLI first, then gateway adapters, then skill installer integration.

Next steps
1. Implement adapter for a single channel (e.g., Telegram) that reuses existing channel adapter.
2. Add Docker images used by `runInSandbox` that include static analysis tools.
3. Wire pre-commit to CI and document developer onboarding.
