
# Before & After: Local‑First Implementation

Date: 2026-02-28

Summary
-------
This document summarizes the state of the codebase before and after a set of local-first modifications. The changes enable a local mode in which the event handler and job execution can run without external network dependencies and with a full git-based audit trail.

Before (high level)
--------------------
- Several components were present as scaffolding but not integrated: skills registry, memory loader, cron entries, and a local supervisor script.
- Critical gaps included prompt injection, persistent commits for memory, and local job creation.

After (high level)
-------------------
- Skills registry and initial skill documents were added and wired into the prompt pipeline.
- Memory persistence was made auditable: heartbeat and daily reflection functions append to disk and commit changes to git when `RUN_LOCALLY=true`.
- Job creation supports a local path that creates a `job/*` branch and writes job configuration and logs locally; the `local-supervisor` (now `bin/local-supervisor-standalone.js`) picks up these branches and executes them.

Key changes (concise)
---------------------
- Skills: `skills/registry.json` and supporting `SKILL.md` files added as canonical metadata for available capabilities. The agent uses a compact list when building prompts.
- Memory: `lib/memory.js` is used to load recent memory and long-term memory. Cron jobs persist memory and commit it to the repository for auditability.
- Prompt builder: The agent prompt builder now reads recent memory and the compact skill list and injects them into the system message.
- Job creation: `lib/tools/create-job.js` includes a local branch-based creation path (`createJobLocal`) when `RUN_LOCALLY=true`.
- Local supervisor: A supervisor script watches `job/*` branches, runs the job inside a local runner, and commits results.

Operational notes
-----------------
- Set `RUN_LOCALLY=true` in `.env` to exercise the local code paths. This is a safety mechanism to prevent accidental remote calls.
- Verify the supervisor and the event handler are running in separate terminals; create a test job and confirm a `job/*` branch and log files appear under `logs/`.

Limitations and remaining work
--------------------------------
- Skill implementations are initial stubs and should be expanded and hardened before production use.
- Sandboxing currently uses a conservative Docker wrapper; for untrusted code execution, use hardened images and runtime policies.
- Additional validation, tests, and Windows-specific documentation remain to be completed.

Files changed (high level)
-------------------------
- New/modified: `skills/registry.json`, various `SKILL.md` files, `lib/cron.js`, `lib/ai/agent.js`, `lib/tools/create-job.js`, `local-supervisor.js`, and supporting documentation files under `docs/`.

How to validate locally
------------------------
1. Ensure `RUN_LOCALLY=true` in `.env`.
2. Start the event handler: `npm run dev`.
3. Start the supervisor: `node bin/local-supervisor-standalone.js`.
4. Create a test job via the web UI or an API call. Confirm that a `job/*` branch is created and results are committed.

Next steps
----------
- Expand and secure skill implementations.
- Harden sandbox images and enforce allow/deny lists for untrusted skill runs.
- Add automated tests and CI checks for local-mode flows.


