#!/usr/bin/env node
// local-supervisor.js (deprecated)
// The full supervisor implementation has moved to
// bin/local-supervisor-standalone.js. Run that script
// instead of this one.

console.log('This file is deprecated. Please run: node bin/local-supervisor-standalone.js');
process.exit(0);

const POLL_INTERVAL_MS = 12000;               // check every 12 seconds
const WORKFLOW_PATH = '.github/workflows/run-job.yml';  // adjust if your workflow file has a different name
const BRANCH_PREFIXES = ['job/', 'sub-'];

console.log('[local-supervisor] Started — polling for new job/sub- branches');

let knownBranches = new Set();

function getCurrentJobBranches() {
  try {
    const output = execSync('git branch --list "job/*" "sub-*"', { encoding: 'utf8' });
    return new Set(
      output
        .split('\n')
        .map(line => line.trim().replace(/^\*?\s*/, ''))
        .filter(Boolean)
        .filter(branch => BRANCH_PREFIXES.some(prefix => branch.startsWith(prefix)))
    );
  } catch (err) {
    console.error('[supervisor] git branch command failed:', err.message);
    return new Set();
  }
}

function runJob(branchName) {
  console.log(`\n[supervisor] Starting local job → ${branchName}`);
  const startTime = Date.now();

  try {
    // 1. Switch to the branch
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });

    // 2. Run the workflow locally with act
    // --input branch=... passes the branch name to the workflow if needed
    const actCommand = `act -W "${WORKFLOW_PATH}" --input branch=${branchName} --artifact-server-path ./.artifacts`;
    execSync(actCommand, { stdio: 'inherit' });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[supervisor] Completed ${branchName} in ${duration}s`);
  } catch (err) {
    console.error(`[supervisor] Job ${branchName} failed:`, err.message);
  }
}

setInterval(() => {
  const currentBranches = getCurrentJobBranches();

  for (const branch of currentBranches) {
    if (!knownBranches.has(branch)) {
      runJob(branch);
    }
  }

  knownBranches = currentBranches;
}, POLL_INTERVAL_MS);