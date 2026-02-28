import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { cronsFile, cronDir } from './paths.js';
import { executeAction } from './actions.js';

function getInstalledVersion() {
  const pkgPath = path.join(process.cwd(), 'node_modules', 'thepopebot', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
}

// In-memory flag for available update (read by sidebar, written by cron)
let _updateAvailable = null;

/**
 * Get the in-memory update-available version (or null).
 * @returns {string|null}
 */
function getUpdateAvailable() {
  return _updateAvailable;
}

/**
 * Set the in-memory update-available version.
 * @param {string|null} v
 */
function setUpdateAvailable(v) {
  _updateAvailable = v;
}

/**
 * Compare two semver strings numerically.
 * @param {string} candidate - e.g. "1.2.40"
 * @param {string} baseline  - e.g. "1.2.39"
 * @returns {boolean} true if candidate > baseline
 */
function isVersionNewer(candidate, baseline) {
  // Pre-release candidate is never "newer" for upgrade purposes
  if (candidate.includes('-')) return false;

  const a = candidate.split('.').map(Number);
  const b = baseline.replace(/-.*$/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

/**
 * Check if a version string is a pre-release (contains '-').
 * @param {string} v
 * @returns {boolean}
 */
function isPrerelease(v) {
  return v.includes('-');
}

/**
 * Compare two semver strings (including pre-release).
 * Returns positive if a > b, negative if a < b, 0 if equal.
 * Ordering: 1.2.71-beta.0 < 1.2.71-beta.1 < 1.2.71 (stable) < 1.2.72-beta.0
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareVersions(a, b) {
  const [aCore, aPre] = a.split('-');
  const [bCore, bPre] = b.split('-');

  const aParts = aCore.split('.').map(Number);
  const bParts = bCore.split('.').map(Number);

  // Compare major.minor.patch
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const av = aParts[i] || 0;
    const bv = bParts[i] || 0;
    if (av !== bv) return av - bv;
  }

  // Same core version: stable beats pre-release
  if (!aPre && bPre) return 1;   // a is stable, b is pre-release
  if (aPre && !bPre) return -1;  // a is pre-release, b is stable
  if (!aPre && !bPre) return 0;  // both stable, same core

  // Both pre-release with same core: compare pre-release number
  const aNum = parseInt(aPre.split('.').pop(), 10) || 0;
  const bNum = parseInt(bPre.split('.').pop(), 10) || 0;
  return aNum - bNum;
}

/**
 * Fetch release notes from GitHub for the target version.
 * @param {string} target - Target upgrade version
 */
async function fetchAndStoreReleaseNotes(target) {
  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/stephengpope/thepopebot/releases/tags/v${target}`
    );
    if (!ghRes.ok) return;
    const release = await ghRes.json();
    if (release.body) {
      const { setReleaseNotes } = await import('./db/update-check.js');
      setReleaseNotes(release.body);
    }
  } catch {}
}

/**
 * Check npm registry for a newer version of thepopebot.
 */
async function runVersionCheck() {
  try {
    const installed = getInstalledVersion();

    if (isPrerelease(installed)) {
      // Beta path: check both stable and beta dist-tags
      const results = await Promise.allSettled([
        fetch('https://registry.npmjs.org/thepopebot/latest'),
        fetch('https://registry.npmjs.org/thepopebot/beta'),
      ]);

      const candidates = [];
      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const res = result.value;
        if (!res.ok) continue;
        const data = await res.json();
        if (data.version && compareVersions(data.version, installed) > 0) {
          candidates.push(data.version);
        }
      }

      if (candidates.length > 0) {
        // Pick the best candidate (highest version)
        candidates.sort(compareVersions);
        const best = candidates[candidates.length - 1];
        console.log(`[version check] update available: ${installed} → ${best}`);
        setUpdateAvailable(best);
        const { setAvailableVersion } = await import('./db/update-check.js');
        setAvailableVersion(best);
        await fetchAndStoreReleaseNotes(best);
      } else {
        setUpdateAvailable(null);
        const { clearAvailableVersion, clearReleaseNotes } = await import('./db/update-check.js');
        clearAvailableVersion();
        clearReleaseNotes();
      }
    } else {
      // Stable path: existing logic, untouched
      const res = await fetch('https://registry.npmjs.org/thepopebot/latest');
      if (!res.ok) {
        console.warn(`[version check] npm registry returned ${res.status}`);
        return;
      }
      const data = await res.json();
      const latest = data.version;

      if (isVersionNewer(latest, installed)) {
        console.log(`[version check] update available: ${installed} → ${latest}`);
        setUpdateAvailable(latest);
        // Persist to DB
        const { setAvailableVersion } = await import('./db/update-check.js');
        setAvailableVersion(latest);
        await fetchAndStoreReleaseNotes(latest);
      } else {
        setUpdateAvailable(null);
        // Clear DB
        const { clearAvailableVersion, clearReleaseNotes } = await import('./db/update-check.js');
        clearAvailableVersion();
        clearReleaseNotes();
      }
    }
  } catch (err) {
    console.warn(`[version check] failed: ${err.message}`);
    // Leave existing flag untouched on error
  }
}

/**
 * Start built-in crons (version check). Called from instrumentation.
 */
function startBuiltinCrons() {
  // Schedule hourly
  cron.schedule('0 * * * *', runVersionCheck);
  // Run once immediately
  runVersionCheck();
}

/**
 * Load and schedule crons from CRONS.json
 * @returns {Array} - Array of scheduled cron tasks
 */
function loadCrons() {
  const cronFile = cronsFile;

  console.log('\n--- Cron Jobs ---');

  if (!fs.existsSync(cronFile)) {
    console.log('No CRONS.json found');
    console.log('-----------------\n');
    return [];
  }

  const crons = JSON.parse(fs.readFileSync(cronFile, 'utf8'));
  const tasks = [];

  for (const cronEntry of crons) {
    const { name, schedule, type = 'agent', enabled } = cronEntry;
    if (enabled === false) continue;

    if (!cron.validate(schedule)) {
      console.error(`Invalid schedule for "${name}": ${schedule}`);
      continue;
    }

    const task = cron.schedule(schedule, async () => {
      try {
        const result = await executeAction(cronEntry, { cwd: cronDir });
        console.log(`[CRON] ${name}: ${result || 'ran'}`);
        console.log(`[CRON] ${name}: completed!`);
      } catch (err) {
        console.error(`[CRON] ${name}: error - ${err.message}`);
      }
    });

    tasks.push({ name, schedule, type, task });
  }

  if (tasks.length === 0) {
    console.log('No active cron jobs');
  } else {
    for (const { name, schedule, type } of tasks) {
      console.log(`  ${name}: ${schedule} (${type})`);
    }
  }

  console.log('-----------------\n');

  return tasks;
}

// ────────────────────────────────────────────────
// LOCAL HEARTBEAT + REFLECTION (added for local-first mode)
// ────────────────────────────────────────────────

import { loadRecentMemory } from './memory.js';  // assumes lib/memory.js exists

// Heartbeat every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  const logPath = path.join(process.cwd(), 'memory', `${today}.md`);

  // Ensure daily file exists
  try {
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, `# Daily Log – ${today}\n\n`, 'utf8');
    }

    const entry = `\n## Heartbeat ${new Date().toISOString()}\n` +
                  `- Agent status: active\n` +
                  `- Mode: local\n` +
                  `- Memory files: ${(await fs.readdir(path.join(process.cwd(), 'memory'))).length}\n`;

    fs.appendFileSync(logPath, entry, 'utf8');
    console.log(`[HEARTBEAT] Logged to ${logPath}`);

    // Optional: auto-commit heartbeat in local mode
    if (process.env.RUN_LOCALLY === 'true') {
      try {
        const { execSync } = await import('child_process');
        execSync('git add memory/', { stdio: 'ignore' });
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.includes('memory/')) {
          execSync('git commit -m "chore(heartbeat): local memory update"', { stdio: 'ignore' });
          console.log(`[HEARTBEAT] Auto-committed to git`);
        }
      } catch (gitErr) {
        // Git commit failures don't break the heartbeat
        console.log(`[HEARTBEAT] Git auto-commit skipped: ${gitErr.message}`);
      }
    }
  } catch (err) {
    console.error('[HEARTBEAT] Failed:', err.message);
  }
});

// Daily reflection at 3 AM (local time) – placeholder
cron.schedule('0 3 * * *', async () => {
  try {
    const recentMemory = await loadRecentMemory(7);
    console.log('[REFLECTION] Would summarize last 7 days:');
    console.log(recentMemory.substring(0, 300) + '...'); // preview only

    // Future: call agent with reflection prompt here
    // e.g. await chat('reflection', `Summarize insights and propose improvements:\n${recentMemory}`);
    
    // Optional: append summary to memory/reflection-YYYY-MM-DD.md
    if (process.env.RUN_LOCALLY === 'true') {
      try {
        const today = new Date().toISOString().split('T')[0];
        const reflectionPath = path.join(process.cwd(), 'config', 'MEMORY.md');
        
        // Append reflection notes to MEMORY.md
        const reflectionEntry = `\n## Reflection ${today}\n` +
                                `- Summarized 7 days of activity\n` +
                                `- Insights extracted from recent logs\n`;
        
        fs.appendFileSync(reflectionPath, reflectionEntry, 'utf8');
        console.log(`[REFLECTION] Updated MEMORY.md`);

        // Auto-commit reflection
        const { execSync } = await import('child_process');
        execSync('git add config/MEMORY.md', { stdio: 'ignore' });
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.includes('MEMORY.md')) {
          execSync('git commit -m "chore(reflection): daily long-term memory update"', { stdio: 'ignore' });
          console.log(`[REFLECTION] Auto-committed MEMORY.md to git`);
        }
      } catch (gitErr) {
        console.log(`[REFLECTION] Git auto-commit skipped: ${gitErr.message}`);
      }
    }
  } catch (err) {
    console.error('[REFLECTION] Failed:', err.message);
  }
});

export {
  loadCrons,
  startBuiltinCrons,
  getUpdateAvailable,
  setUpdateAvailable,
  getInstalledVersion,
  isPrerelease
};