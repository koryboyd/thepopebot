const fs = require('fs').promises;
const path = require('path');

async function loadRecentMemory(days = 7) {
  const memoryDir = path.join(process.cwd(), 'memory');
  let content = '';

  try {
    const longTerm = await fs.readFile(path.join(process.cwd(), 'config/MEMORY.md'), 'utf-8')
      .catch(() => '# Long-term memory file not found yet\n');

    content += `<long-term-memory>\n${longTerm.trim()}\n</long-term-memory>\n\n`;

    const files = (await fs.readdir(memoryDir))
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a))     // newest first
      .slice(0, days);

    if (files.length > 0) {
      content += '<recent-daily-logs>\n';
      for (const file of files) {
        const data = await fs.readFile(path.join(memoryDir, file), 'utf-8');
        content += `--- ${file} ---\n${data.trim()}\n\n`;
      }
      content += '</recent-daily-logs>';
    }
  } catch (err) {
    content += `<memory-error>${err.message}</memory-error>`;
  }

  return content || '<memory-empty>No memory files found yet</memory-empty>';
}

module.exports = { loadRecentMemory };