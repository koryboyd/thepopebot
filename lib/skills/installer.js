import fs from 'fs';
import path from 'path';

// Minimal skill installer scaffold. Real installers should verify signatures,
// run static analysis inside a sandbox, and require approval before enabling.

export async function stageSkillFromTarball(tarballPath) {
  // For now, just copy tarball into skills/incoming and return a staged id
  const incomingDir = path.join(process.cwd(), 'skills', 'incoming');
  try { fs.mkdirSync(incomingDir, { recursive: true }); } catch (e) {}
  const dest = path.join(incomingDir, path.basename(tarballPath));
  fs.copyFileSync(tarballPath, dest);
  return { staged: dest };
}

export function approveStagedSkill(stagedPath, opts = {}) {
  // Unpack and install (placeholder)
  // Real implementation: verify signature, run sandboxed tests, then move
  const skillsDir = path.join(process.cwd(), 'skills', 'active');
  try { fs.mkdirSync(skillsDir, { recursive: true }); } catch (e) {}
  // For now, record approval by touching a file
  const marker = stagedPath + '.approved';
  fs.writeFileSync(marker, JSON.stringify({ approvedAt: new Date().toISOString(), opts }));
  return { approved: true, marker };
}
