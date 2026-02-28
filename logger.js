/**
 * logger.js - Structured logging for jobs and agent tasks
 */

import fs from 'fs';
import path from 'path';

let LOG_ENABLED = true;

export function disableLog() {
  LOG_ENABLED = false;
}

export function enableLog() {
  LOG_ENABLED = true;
}

/**
 * Format a log message with timestamp
 */
function formatMessage(level, source, message, data = {}) {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      ...data,
    },
    null,
    2
  );
}

/**
 * Log to console and optionally to file
 */
function writeLog(level, source, message, data = {}) {
  if (!LOG_ENABLED) return;

  const formatted = formatMessage(level, source, message, data);
  console.log(formatted);

  // Optionally write to logs/{source}/session.jsonl
  if (source && source.match(/^[a-f0-9-]+$/)) {
    try {
      const logDir = path.join(process.cwd(), 'logs', source);
      const sessionPath = path.join(logDir, 'session.jsonl');

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.appendFileSync(
        sessionPath,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level,
          message,
          ...data,
        }) + '\n',
        'utf8'
      );
    } catch (err) {
      // Silently fail if we can't write to disk
    }
  }
}

export function log(source, message, data = {}) {
  writeLog('INFO', source, message, data);
}

export function error(source, message, err) {
  writeLog('ERROR', source, message, { error: err?.message || String(err) });
}

export function debug(source, message, data = {}) {
  if (process.env.DEBUG || process.env.DEBUG_LOGS === 'true') {
    writeLog('DEBUG', source, message, data);
  }
}

export function warn(source, message, data = {}) {
  writeLog('WARN', source, message, data);
}
