/**
 * jobs.js - Simple in-memory job queue system
 * For local development mode. Persists minimal state to allow supervisor to track jobs.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const LOGS_DIR = path.join(process.cwd(), 'logs');

/**
 * Get the next unprocessed job from logs/*/
 * A job is considered "unprocessed" if logs/{jobId}/done does not exist.
 */
export async function getNextJob() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      return null;
    }

    const entries = fs.readdirSync(LOGS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const jobId = entry.name;
      const donePath = path.join(LOGS_DIR, jobId, 'done');
      const configPath = path.join(LOGS_DIR, jobId, 'job.config.json');

      // If done exists, skip this job
      if (fs.existsSync(donePath)) continue;

      // If config exists, return as pending job
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
          id: jobId,
          task: config.job || config.description || 'Unknown task',
          title: config.title || 'Untitled Job',
          llm_provider: config.llm_provider || null,
          llm_model: config.llm_model || null,
          agentBackend: config.agent_backend || null,
        };
      }
    }

    return null;
  } catch (err) {
    console.error('[jobs] getNextJob error:', err.message);
    return null;
  }
}

/**
 * Mark a job as complete by creating logs/{jobId}/done file
 */
export async function completeJob(jobId, result) {
  try {
    const doneDir = path.join(LOGS_DIR, jobId);
    if (!fs.existsSync(doneDir)) {
      fs.mkdirSync(doneDir, { recursive: true });
    }

    const donePath = path.join(doneDir, 'done');
    fs.writeFileSync(donePath, new Date().toISOString(), 'utf8');

    // Optionally save result
    const resultPath = path.join(doneDir, 'result.json');
    fs.writeFileSync(resultPath, JSON.stringify({ result, completedAt: new Date().toISOString() }, null, 2), 'utf8');

    console.log(`[jobs] Marked job ${jobId} as complete`);
  } catch (err) {
    console.error('[jobs] completeJob error:', err.message);
  }
}

/**
 * Add a new job to the queue (for testing/API)
 */
export async function addJob(task) {
  const jobId = uuidv4();
  const logsDir = path.join(process.cwd(), 'logs', jobId);

  try {
    fs.mkdirSync(logsDir, { recursive: true });

    const config = {
      job: task,
      title: task.split('\n')[0].substring(0, 50),
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(logsDir, 'job.config.json'), JSON.stringify(config, null, 2), 'utf8');

    console.log(`[jobs] Added job ${jobId}`);
    return { id: jobId, config };
  } catch (err) {
    console.error('[jobs] addJob error:', err.message);
    return null;
  }
}

/**
 * List all jobs (completed and pending)
 */
export async function listJobs() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      return [];
    }

    const entries = fs.readdirSync(LOGS_DIR, { withFileTypes: true });
    const jobs = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const jobId = entry.name;
      const configPath = path.join(LOGS_DIR, jobId, 'job.config.json');
      const donePath = path.join(LOGS_DIR, jobId, 'done');

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        jobs.push({
          id: jobId,
          ...config,
          status: fs.existsSync(donePath) ? 'completed' : 'pending',
        });
      }
    }

    return jobs;
  } catch (err) {
    console.error('[jobs] listJobs error:', err.message);
    return [];
  }
}
