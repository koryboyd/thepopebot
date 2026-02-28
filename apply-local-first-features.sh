#!/bin/bash
# apply-local-first-features.sh
# Applies all local-first feature commits in sequence
# Run this script from the repo root: bash apply-local-first-features.sh

set -e

echo "🚀 Applying Local-First Feature Commits"
echo "========================================"
echo ""

# 1. Skills Registry
echo "📦 1/4: Committing skills registry..."
git add skills/
git commit -m "feat: initialize skills registry with utilities

- Create skills/ directory structure (was missing)
- Add registry.json with a utilities entry consolidating modify-self, browser-tools, llm-secrets
- Add SKILL.md files for:
  - utilities: combined utilities skill (self-modification, browser automation, secret management)
  - brave-search: Web search via Brave Search API
  - telegram: Telegram bot integration
  - github-actions: GitHub Actions workflow helpers
  - info-retrieval: Fetch and summarize external info
- Skills loader (lib/skills/loader.js) can now load from this registry"
echo "✅ Skills committed!"
echo ""

# 2. Auto-commit Hooks
echo "⏰ 2/4: Committing auto-commit hooks for cron..."
git add lib/cron.js
git commit -m "feat(cron): add optional auto-commit for heartbeat/reflection in local mode

- Heartbeat (*/30 min): Appends status to daily memory log + auto-commits to git if RUN_LOCALLY=true
- Reflection (3 AM daily): Summarizes recent logs + updates config/MEMORY.md + auto-commits
- Both include graceful fallback for git failures (non-blocking)
- Preserves original cloud behavior when RUN_LOCALLY is not set"
echo "✅ Cron auto-commit committed!"
echo ""

# 3. Prompt Injection
echo "🧠 3/4: Committing prompt injection (memory + skills)..."
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
echo "✅ Prompt injection committed!"
echo ""

# 4. Conditional Local Job Creation
echo "🎯 4/4: Committing conditional local job creation..."
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
echo "✅ Job creation committed!"
echo ""

echo "========================================"
echo "✨ All features committed successfully!"
echo ""
echo "Summary of changes:"
echo "  ✅ Skills registry (7 skills): skills/registry.json + skills/**/SKILL.md"
echo "  ✅ Auto-commit hooks: lib/cron.js (heartbeat + reflection)"
echo "  ✅ Prompt injection: lib/ai/agent.js (memory + skills context)"
echo "  ✅ Local job creation: lib/tools/create-job.js (git-based jobs)"
echo ""
echo "You can now use the local-first features by setting:"
echo "  export RUN_LOCALLY=true"
echo ""
echo "Git log (last 4 commits):"
git log --oneline -4
echo ""
echo "Ready to push? Run: git push origin main"
