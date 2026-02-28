#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

const cmd = process.argv[2] || 'help';

function checkCommand(name) {
  try {
    execSync(`${name} --version`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function doctor() {
  console.log('thepopebot OC-CLI Doctor');
  console.log('- Node:', process.version);
  console.log('- RUN_LOCALLY:', process.env.RUN_LOCALLY || 'not set');
  console.log('- Git:', checkCommand('git') ? 'available' : 'missing');
  console.log('- Docker:', checkCommand('docker') ? 'available' : 'missing');
  console.log('- act (optional):', checkCommand('act') ? 'available' : 'missing');
  console.log('- Ollama (optional):', checkCommand('ollama') ? 'available' : 'missing');
  const hasDocker = checkCommand('docker');
  if (hasDocker) {
    try {
      const out = execSync('docker info --format "{{.ServerVersion}}"', { encoding: 'utf8' }).trim();
      console.log('- Docker Server Version:', out);
    } catch (e) {}
  }

  // quick config checks
  const pj = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  console.log('- package name:', pj.name || 'unknown');
  console.log('Doctor complete.');
}

if (cmd === 'doctor') {
  doctor();
} else {
  console.log('Usage: oc-cli.js <doctor>');
}
