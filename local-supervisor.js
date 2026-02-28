import cron from 'node-cron';
import { getNextJob, completeJob } from './jobs.js';
import { runAgent } from './lib/ai/agent.js';
import { log, error } from './logger.js';

let running = false;

async function processJobs() {
  if (running) return;
  running = true;

  try {
    let job;
    while ((job = await getNextJob())) {
      log('SUPERVISOR', `Processing job ${job.id}: ${job.title}`, { jobId: job.id });

      try {
        const result = await runAgent(job);
        await completeJob(job.id, result);
        log('SUPERVISOR', `Job ${job.id} completed successfully`, { jobId: job.id, result });
      } catch (err) {
        error('SUPERVISOR', `Job ${job.id} failed`, err);
        await completeJob(job.id, { error: err.message });
      }
    }
  } catch (processErr) {
    error('SUPERVISOR', 'Job processing error', processErr);
  } finally {
    running = false;
  }
}

export function startSupervisor() {
  log('SUPERVISOR', 'Local supervisor online');

  // Check for jobs every 1 minute
  cron.schedule('*/1 * * * *', processJobs);
  
  // Run immediately on startup
  processJobs();
}

export { processJobs };