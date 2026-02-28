import { execSync } from 'child_process';

// Lightweight sandbox helper that runs a command inside a Docker container.
// This is a conservative wrapper: it requires Docker to be available and
// constructs a docker run command. The allow/deny lists are advisory and
// should be enforced by the container image used.

export function runInSandbox(command, { image = 'node:20-bullseye', mounts = [], env = {}, cpu = '0.5', memory = '512m' } = {}) {
  try {
    // Validate docker availability
    execSync('docker --version', { stdio: 'ignore' });
  } catch (e) {
    throw new Error('Docker is required for sandboxed execution but was not found.');
  }

  const mountArgs = mounts.map(m => `-v ${m.host}:${m.container}`).join(' ');
  const envArgs = Object.entries(env).map(([k,v]) => `-e ${k}=${v}`).join(' ');
  const cmd = `docker run --rm --network none --cpus=${cpu} --memory=${memory} ${mountArgs} ${envArgs} ${image} /bin/sh -c "${command.replace(/"/g, '\\"')}"`;
  return execSync(cmd, { encoding: 'utf8' });
}
