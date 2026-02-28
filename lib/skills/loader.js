import fs from 'fs';
import path from 'path';

/**
 * Get a compact list of available skills for prompts
 */
async function getCompactSkillList() {
  try {
    const registryPath = path.join(process.cwd(), 'lib', 'skills', 'registry.json');
    const data = await fs.promises.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(data);
    return registry
      .map(s => `- **${s.name}** (${s.id}): ${s.description}`)
      .join('\n');
  } catch (err) {
    console.warn('[loader] Could not load skills registry:', err.message);
    return 'No skills registry found.';
  }
}

/**
 * Load full skill content by ID
 */
async function loadFullSkill(id) {
  try {
    const registryPath = path.join(process.cwd(), 'lib', 'skills', 'registry.json');
    const data = await fs.promises.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(data);
    const skill = registry.find(s => s.id === id);
    
    if (!skill) {
      console.warn(`[loader] Skill ${id} not found in registry`);
      return null;
    }
    
    const skillPath = path.join(process.cwd(), 'lib', 'skills', skill.path);
    const content = await fs.promises.readFile(skillPath, 'utf-8');
    return content;
  } catch (err) {
    console.warn('[loader] Could not load skill:', err.message);
    return null;
  }
}

/**
 * Execute a skill (stub - would be expanded for real skill execution)
 */
async function executeSkill(skillId, input) {
  try {
    const content = await loadFullSkill(skillId);
    if (!content) {
      return `Skill ${skillId} not found`;
    }
    
    // For now, just return a stub result
    // In a real implementation, you'd parse and execute the skill code
    return `Executed skill: ${skillId} with input: ${JSON.stringify(input)}`;
  } catch (err) {
    return `Skill execution failed: ${err.message}`;
  }
}

export {
  getCompactSkillList,
  loadFullSkill,
  executeSkill
};