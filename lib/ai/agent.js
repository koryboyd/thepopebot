const { generate } = require("./llm");
const { loadSkills, executeSkill } = require("./skills");
const memory = require("./memory");
const MAX_ITERATIONS = 5;
async function runAgentCycle(job, iteration = 0) {
  const context = memory.getContext()
  const reflectionPrompt = `
Evaluate this result:

Task: ${job.task}
Result: ${skillResult}

Is it complete? If not, suggest next action.

Respond JSON:
{
  "complete": true/false,
  "next_skill": "...",
  "next_input": "..."
}
`;

  const planPrompt = `
You are PopeBot.
You have access to skills.

Available Skills:
${loadSkills().map(s => `- ${s.name}: ${s.description}`).join("\n")}

Memory:
${context}

User Task:
${job.task}

Respond in JSON:
{
  "thought": "...",
  "skill": "skill_name or null",
  "input": "input for skill or null",
  "final": "final answer if no skill needed"
}
`;

  const raw = await generate(planPrompt);
  const decision = safeJSON(raw);

if (iteration >= MAX_ITERATIONS) {
  memory.add("Max iterations reached");
  return "Stopped after max iterations.";
}

let result;

if (decision.skill) {
  result = await executeSkill(decision.skill, decision.input);
  memory.add(`Skill used: ${decision.skill}`);
} else {
  result = decision.final;
}

memory.add(`Result: ${result}`);


// ------------------ REFLECTION STEP ------------------

const reflectionPrompt = `
You are PopeBot reviewing your own work.

Task:
${job.task}

Result:
${result}

Respond in JSON:
{
  "complete": true or false,
  "next_skill": "skill name or null",
  "next_input": "input for skill or null"
}
`;

const reflectionRaw = await generate(reflectionPrompt);
const reflection = safeJSON(reflectionRaw);

if (reflection.complete === true) {
  memory.add("Task marked complete");
  return result;
}

if (reflection.next_skill) {
  memory.add(`Reflection triggered new skill: ${reflection.next_skill}`);

  const newResult = await executeSkill(reflection.next_skill, reflection.next_input);

  return await runAgentCycle(
    { task: job.task },
    iteration + 1
  );
}

return result;