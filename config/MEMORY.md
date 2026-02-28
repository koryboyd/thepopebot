# PopeBot Long-Term Memory

Last updated: 2026-02-28

## Overview

This file serves as the long-term memory for PopeBot. It's automatically appended to by the daily reflection cron job and persisted to git for auditability.

## Key Insights

- Initial local-first implementation underway
- Focus areas: offline operation, git-based auditing, extensible skill system
- Memory system: daily logs + long-term MEMORY.md

## Recent Reflections

### Session 2026-02-28

- Established local-first architecture
- Implemented job queue (jobs.js)
- Created logging system (logger.js)
- Fixed agent cycle (agent.js) with proper async/await
- Created directories: data/, memory/, logs/
- Updated .env.example with comprehensive configuration options

## Learned Patterns

1. **Job Queue**: Jobs are created as `logs/{jobId}/job.config.json`. Supervisor polls `logs/` every minute.
2. **Memory**: Daily logs in `memory/YYYY-MM-DD.md`. Hourly heartbeat appends status. Nightly reflection commits to MEMORY.md.
3. **Skills**: Registry in `lib/skills/registry.json`. Loader provides compact list for prompts.
4. **Safety**: All local operations guarded by `RUN_LOCALLY` env check.

## TODO

- [ ] Implement actual skill execution (currently stubs)
- [ ] Add real LLM integration tests
- [ ] Create web UI endpoints for job management
- [ ] Add Telegram adapter full implementation
- [ ] Add proper error recovery mechanisms
