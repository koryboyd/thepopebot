#!/bin/bash
# QUICK REFERENCE: Git Commands to Apply All Changes

# Option 1: Automatic (One Command)
# ═══════════════════════════════════════════════════════════════
bash apply-local-first-features.sh
# Done! All 4 commits applied with proper messages.


# Option 2: Manual (Step by Step)
# ═══════════════════════════════════════════════════════════════

# Commit 1: Skills Registry
git add skills/
git commit -m "feat: initialize skills registry with 7 core skills

- Create skills/ directory structure (was missing)
- Add registry.json with 7 core skill definitions
- Add SKILL.md files for each skill:
  - modify-self: Allows the agent to update its own code
  - browser-tools: Web browsing and automation
  - llm-secrets: Secure API key management
  - brave-search: Web search via Brave Search API
  - telegram: Telegram bot integration
  - github-actions: GitHub Actions workflow helpers
  - info-retrieval: Fetch and summarize external info
- Skills loader (lib/skills/loader.js) now loads from this registry"


# Commit 2: Cron Auto-Commit Hooks
git add lib/cron.js
git commit -m "feat(cron): add optional auto-commit for heartbeat/reflection in local mode

- Heartbeat (*/30 min): Appends status to daily memory log + auto-commits to git if RUN_LOCALLY=true
- Reflection (0 3 * * *): Summarizes recent logs + updates config/MEMORY.md + auto-commits
- Both include graceful fallback for git failures (non-blocking)
- Preserves original cloud behavior when RUN_LOCALLY is not set"


# Commit 3: Prompt Injection
git add lib/ai/agent.js
git commit -m "feat(ai): inject memory and skills into agent system prompt

- New async buildSystemPrompt() function loads:
  - Recent memory from lib/memory.js (recent logs + long-term MEMORY.md)
  - Available skills from lib/skills/loader.js (via registry.json)
- getAgent() now uses async prompt builder (compatible with LangGraph)
- Memory injected as <agent-memory> block in system prompt
- Skills injected as <available-skills> block in system prompt
- Only activates if RUN_LOCALLY=true (preserves cloud-only mode)
- Graceful degradation: missing memory/skills files don't break agent"


# Commit 4: Conditional Local Job Creation
git add lib/tools/create-job.js
git commit -m "feat(tools): add conditional local job creation

- New createJobLocal() function creates job branches via git instead of GitHub API
  - Writes job.config.json to logs/{jobId}/ directory
  - Runs git checkout + commit locally
  - Logs job details for local-supervisor.js to pick up
- createJob() dispatcher checks RUN_LOCALLY environment variable
  - If true: uses createJobLocal() (no GitHub API calls)
  - If false: uses original GitHub API flow (unchanged)
- Imports: fs, path, execSync (dynamic import for git commands)
- Fully backward compatible with existing GitHub Actions setup"


# Verify
# ═══════════════════════════════════════════════════════════════
echo "Verifying all commits..."
git log --oneline -4

echo ""
echo "Verifying files exist..."
ls -la skills/registry.json
grep -q "buildSystemPrompt" lib/ai/agent.js && echo "✅ Prompt injection function found"
grep -q "createJobLocal" lib/tools/create-job.js && echo "✅ Job creation function found"

echo ""
echo "✨ All changes applied successfully!"
echo ""
echo "Next steps:"
echo "  1. export RUN_LOCALLY=true"
echo "  2. git push origin main"
echo "  3. Test with: node -e \"import { createJob } from './lib/tools/create-job.js'; const j = await createJob('test'); console.log(j.branch);\""

