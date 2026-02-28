const fs = require('fs').promises;
const path = require('path');

async function getCompactSkillList() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'skills/registry.json'), 'utf-8');
    const registry = JSON.parse(data);
    return registry
      .map(s => `- **${s.name}** (${s.id}): ${s.description}`)
      .join('\n');
  } catch {
    return 'No skills registry found.';
  }
}

async function loadFullSkill(id) {
  try {
    const registry = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'skills/registry.json'), 'utf-8')
    );
    const skill = registry.find(s => s.id === id);
    if (!skill) return null;
    return await fs.readFile(
      path.join(process.cwd(), 'skills', skill.path),
      'utf-8'
    );
  } catch {
    return null;
  }
}

module.exports = {
  getCompactSkillList,
  loadFullSkill
};