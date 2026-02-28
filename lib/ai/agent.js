import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage } from '@langchain/core/messages';
import { createModel } from './model.js';
import { createJobTool, getJobStatusTool, getSystemTechnicalSpecsTool, getSkillBuildingGuideTool } from './tools.js';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { eventHandlerMd, thepopebotDb } from '../paths.js';
import { render_md } from '../utils/render-md.js';
import { loadRecentMemory } from '../memory.js';
import { getCompactSkillList } from '../skills/loader.js';

let _agent = null;

/**
 * Build the system prompt with injected memory and skills context.
 */
async function buildSystemPrompt() {
  const basePrompt = render_md(eventHandlerMd);
  
  let enhancedPrompt = basePrompt;

  // Inject recent memory if available
  if (process.env.RUN_LOCALLY === 'true') {
    try {
      const recentMemory = await loadRecentMemory(7);
      enhancedPrompt += '\n\n<agent-memory>\n' + recentMemory + '\n</agent-memory>';
    } catch (err) {
      console.warn('[agent] Failed to load memory:', err.message);
    }

    // Inject available skills
    try {
      const skillsList = await getCompactSkillList();
      enhancedPrompt += '\n\n<available-skills>\n' + skillsList + '\n</available-skills>';
    } catch (err) {
      console.warn('[agent] Failed to load skills:', err.message);
    }
  }

  return enhancedPrompt;
}

/**
 * Get or create the LangGraph agent singleton.
 * Uses createReactAgent which handles the tool loop automatically.
 * Prompt is a function so {{datetime}} resolves fresh each invocation.
 */
export async function getAgent() {
  if (!_agent) {
    const model = await createModel();
    const tools = [createJobTool, getJobStatusTool, getSystemTechnicalSpecsTool, getSkillBuildingGuideTool];
    const checkpointer = SqliteSaver.fromConnString(thepopebotDb);

    _agent = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: checkpointer,
      prompt: async (state) => {
        const systemPrompt = await buildSystemPrompt();
        return [new SystemMessage(systemPrompt), ...state.messages];
      },
    });
  }
  return _agent;
}

/**
 * Reset the agent singleton (e.g., when config changes).
 */
export function resetAgent() {
  _agent = null;
}
