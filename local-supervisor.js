const cron = require("node-cron");
const { getNextJob, completeJob } = require("./jobs");
const { runAgentCycle } = require("./agent");
const { log } = require("./logger");

let running = false;

async function processJobs() {
  if (running) return;
  running = true;

  try {
    let job;
    while ((job = await getNextJob())) {
      log("JOB_START", job.id);

      try {
        const result = await runAgentCycle(job);
        await completeJob(job.id, result);
        log("JOB_COMPLETE", job.id);
      } catch (err) {
        log("JOB_FAIL", err.message);
      }
    }
  } finally {
    running = false;
  }
}

function startSupervisor() {
  log("SUPERVISOR", "Local supervisor online");

  cron.schedule("*/1 * * * *", processJobs); // heartbeat
  processJobs();
}

module.exports = { startSupervisor };