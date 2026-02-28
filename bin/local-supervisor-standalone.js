#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// local-supervisor-standalone.js
// Lightweight, self-contained local supervisor that:
// - Polls for local branches matching job/*
// - Creates logs/<jobId>/session.jsonl and output artifacts
// - Commits logs to the repository for an auditable trail
// - Attempts to run `act` if available; otherwise produces a safe stub

const POLL_INTERVAL_MS = 30_000;

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function listJobBranches() {
  try {
    const out = run('git for-each-ref --format="%(refname:short)" refs/heads/job/* 2>/dev/null || true');
    if (!out) return [];
    return out.split('\n').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    return [];
  }
}

function ensureDir(d) {
  try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
}

function branchProcessed(jobId) {
  return fs.existsSync(path.join(process.cwd(), 'logs', jobId, 'done'));
}

function writeLine(jobId, data) {
  ensureDir(path.join(process.cwd(), 'logs', jobId));
  const p = path.join(process.cwd(), 'logs', jobId, 'session.jsonl');
  fs.appendFileSync(p, JSON.stringify({ timestamp: new Date().toISOString(), ...data }) + '\n');
}

function commitJobLogs(jobId, message) {
  try {
    run(`git add -A logs/${jobId}`);
    run(`git commit -m "chore(local-supervisor): ${message}" --no-verify`);
  } catch (e) {
    // No-op
  }
}

function markDone(jobId) {
  ensureDir(path.join(process.cwd(), 'logs', jobId));
  fs.writeFileSync(path.join(process.cwd(), 'logs', jobId, 'done'), new Date().toISOString());
}

function processJob(branch) {
  const jobId = branch.replace(/^job\//, '');
  if (!jobId) return;
  if (branchProcessed(jobId)) return;

  console.log(`[supervisor] processing ${branch}`);
  writeLine(jobId, { event: 'started', branch });

  let acted = false;
  try {
    run('which act');
    console.log('[supervisor] act detected; attempting run (best-effort)');
    try {
      // Best-effort: run job via act; user must have a compatible workflow
      run('act -W .github/workflows -P ubuntu:latest -j run-job --env RUN_LOCALLY=true');
      writeLine(jobId, { event: 'act', status: 'success' });
      acted = true;
    } catch (e) {
      writeLine(jobId, { event: 'act', status: 'error', error: String(e) });
    }
  } catch (e) {
    // act not present
  }

  if (!acted) {
    // Create safe stub output
    writeLine(jobId, { event: 'processed', status: 'stub', note: 'act unavailable or run failed' });
    ensureDir(path.join(process.cwd(), 'logs', jobId));
    fs.writeFileSync(path.join(process.cwd(), 'logs', jobId, 'output.txt'), `Stub output for job ${jobId} at ${new Date().toISOString()}\n`);
  }

  markDone(jobId);
  commitJobLogs(jobId, `processed job/${jobId}`);
  console.log(`[supervisor] finished ${branch}`);
}

async function poll() {
  try {
    const branches = listJobBranches();
    for (const b of branches) processJob(b);
  } catch (e) {
    console.error('[supervisor] poll error', String(e));
  }
}

if (process.argv.includes('--once')) {
  await poll();
  process.exit(0);
}

console.log('[supervisor] starting (standalone). Polling for job/* every', POLL_INTERVAL_MS / 1000, 's');
await poll();
setInterval(poll, POLL_INTERVAL_MS);
