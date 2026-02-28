const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const STATUS_FILE = path.join(process.cwd(), 'agents/status.json');

async function updateAgentStatus(updates) {
  let status = { active: [], lastUpdated: new Date().toISOString() };
  try {
    const content = await fs.readFile(STATUS_FILE, 'utf-8');
    status = JSON.parse(content);
  } catch {}
  
  // Apply simple updates (expand later)
  Object.assign(status, updates);
  status.lastUpdated = new Date().toISOString();
  
  await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2));
  // git add & commit can be called from caller
}

async function spawnSubAgent(agentId) {
  const branchName = `sub-${agentId}-${Date.now()}`;
  try {
    execSync(`git checkout -b ${branchName}`, { stdio: 'ignore' });
    console.log(`[orchestrator] Created branch ${branchName}`);
    await updateAgentStatus({ active: [...(await getActiveAgents()), agentId] });
    return branchName;
  } catch (err) {
    console.error('[orchestrator] spawn failed', err);
    return null;
  }
}

async function getActiveAgents() {
  try {
    const data = await fs.readFile(STATUS_FILE, 'utf-8');
    return JSON.parse(data).active || [];
  } catch {
    return [];
  }
}

module.exports = {
  spawnSubAgent,
  getActiveAgents,
  updateAgentStatus
};