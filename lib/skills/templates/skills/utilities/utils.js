// Example utility functions shipped with the `utilities` skill.
// This file is intended to demonstrate how agents can bundle
// small helper libraries inside a skill directory.  
// In a real deployment you may wish to sandbox these or remove
// any functionality that could modify the host system.

import fs from 'fs';
import path from 'path';

// Self-modification helper (warning: commits changes to git)
export function modifySelf(note) {
  const repo = process.cwd();
  const msg = note || 'self update';
  try {
    // create a trivial timestamp file to simulate a change
    const stamp = path.join(repo, '.self-modify');
    fs.writeFileSync(stamp, new Date().toISOString());
    // commit the change
    require('child_process').execSync(`git add ${stamp} && git commit -m "${msg}"`);
    return true;
  } catch (e) {
    console.error('modifySelf failed', e);
    return false;
  }
}

// Simple browser helper that uses node-fetch as a placeholder
export async function browse(url) {
  const res = await import('node-fetch');
  const r = await res.default(url);
  return r.text();
}

// Secret retrieval stub (reads from process.env)
export function getSecret(name) {
  return process.env[name] || null;
}
