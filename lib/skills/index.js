const fs = require("fs");
const path = require("path");

let skillsCache = null;

function loadSkills() {
  if (skillsCache) return skillsCache;

  const files = fs.readdirSync(__dirname)
    .filter(f => f !== "index.js");

  skillsCache = files.map(file => {
    return require(path.join(__dirname, file));
  });

  return skillsCache;
}

async function executeSkill(name, input) {
  const skills = loadSkills();
  const skill = skills.find(s => s.name === name);

  if (!skill) throw new Error("Skill not found");

  return await skill.run(input);
}

module.exports = { loadSkills, executeSkill };