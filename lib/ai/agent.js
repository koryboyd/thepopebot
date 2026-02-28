import { createModel } from './model.js';

const MAX_ITERATIONS = 5;

/**
 * Safely parse JSON from LLM output, with fallback
 */
function safeJSON(text) {
  if (!text) return {};
  try {
    // Try to find JSON object in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    // Fallback to empty object
  }
  return {};
}

/**
 * Run a single agent cycle: plan → execute → reflect → repeat if needed
 */
async function runAgentCycle(job, iteration = 0) {
  if (!job || !job.task) {
    return 'Error: Invalid job or missing task';
  }

  if (iteration >= MAX_ITERATIONS) {
    return `Task stopped after ${MAX_ITERATIONS} iterations. Submit partial results if available.`;
  }

  try {
    // Get LLM model for this job
    const model = await createModel({
      temperature: 0.7,
      maxTokens: 2000,
      // Use job-specified model if available
      model: job.llm_model || undefined,
    });

    // Build system prompt with memory and skills
    const systemPrompt = buildSystemPrompt();

    // === PLANNING STEP ===
    const planPrompt = `You are PopeBot, an autonomous agent. You have access to various skills to complete tasks.

User Task:
${job.task}

Current Iteration: ${iteration + 1}/${MAX_ITERATIONS}

Respond with JSON:
{
  "thought": "Your reasoning about the task",
  "skill": "skill_name or null if task is complete",
  "input": "input for the skill or null",
  "final": "final answer if no skill needed"
}`;

    const planResponse = await model.invoke([
      ['system', systemPrompt],
      ['human', planPrompt],
    ]);

    const planText = typeof planResponse === 'string' ? planResponse : planResponse.content || String(planResponse);
    const decision = safeJSON(planText);

    const decision = safeJSON(planText);

    let result = null;

    // === EXECUTE STEP ===
    if (decision.skill) {
      try {
        const { getCompactSkillList, loadFullSkill } = await import('../skills/loader.js');
        
        // Try to execute the skill
        console.log(`[agent] Attempting skill: ${decision.skill}`);
        
        // For now, skills are simulated. In a full implementation, 
        // you would load and execute actual skill modules.
        result = `Skill '${decision.skill}' executed with input: ${JSON.stringify(decision.input)}`;
        
        console.log(`[agent] Skill result: ${result}`);
      } catch (skillErr) {
        console.error(`[agent] Skill execution failed:`, skillErr.message);
        result = `Skill execution failed: ${skillErr.message}`;
      }
    } else {
      // No skill needed, use the final answer
      result = decision.final || 'Task completed';
    }

    // === REFLECTION STEP ===
    const reflectionPrompt = `You are PopeBot reviewing your work.

Original Task:
${job.task}

Result from this iteration:
${result}

Current iteration: ${iteration + 1}/${MAX_ITERATIONS}

Respond with JSON:
{
  "complete": true/false - is the task complete?,
  "next_skill": "skill_name or null - what should we do next?",
  "next_input": "input for next skill or null"
}`;

    const reflectionResponse = await model.invoke([
      ['system', systemPrompt],
      ['human', reflectionPrompt],
    ]);

    const reflectionText = typeof reflectionResponse === 'string' ? reflectionResponse : reflectionResponse.content || String(reflectionResponse);
    const reflection = safeJSON(reflectionText);

    // If complete, return the result
    if (reflection.complete === true) {
      console.log(`[agent] Task marked complete after iteration ${iteration + 1}`);
      return result;
    }

    // If reflection suggests next skill, iterate
    if (reflection.next_skill) {
      console.log(`[agent] Reflection suggests skill: ${reflection.next_skill}, iterating...`);
      return await runAgentCycle(job, iteration + 1);
    }

    // Otherwise return partial result
    return result;
  } catch (err) {
    console.error('[agent] Cycle error:', err.message);
    return `Error during agent cycle: ${err.message}`;
  }
}

/**
 * Build system prompt with memory and available skills
 */
function buildSystemPrompt() {
  const basePrompt = `You are PopeBot, an autonomous agent capable of breaking down complex tasks and executing them using available tools and skills.

Your characteristics:
- You think step-by-step before acting
- You can use skills/tools to complete tasks
- You reflect on results and iterate if needed
- You provide clear, JSON-formatted responses

Guidelines:
- Always respond in valid JSON format
- Be concise but thorough
- If a task is complete, set "complete" to true
- If you need to use a skill, specify it clearly`;

  return basePrompt;
}

/**
 * Create and run an agent for a given job
 */
export async function runAgent(job) {
  console.log(`[agent] Starting agent cycle for job ${job.id}`);
  const result = await runAgentCycle(job);
  console.log(`[agent] Job ${job.id} completed with result:`, result);
  return result;
}

export { runAgentCycle, buildSystemPrompt };