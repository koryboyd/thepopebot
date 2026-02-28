import EventEmitter from 'events';
import fs from 'fs';

// Minimal gateway scaffold for multi-channel integration (OpenClaw-inspired).
// This file provides a local, opt-in gateway that can be extended to add
// adapters for WhatsApp, Discord, Signal, Teams, etc. It intentionally
// avoids external services by default and emits normalized messages.

class Gateway extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.adapters = new Map();
  }

  registerAdapter(name, adapter) {
    this.adapters.set(name, adapter);
    if (adapter.on) adapter.on('message', (m) => this.emit('message', { source: name, ...m }));
  }

  async start() {
    for (const [name, adapter] of this.adapters) {
      if (adapter.start) await adapter.start();
    }
    this.emit('ready');
  }

  async stop() {
    for (const [, adapter] of this.adapters) {
      if (adapter.stop) await adapter.stop();
    }
    this.emit('stopped');
  }

  // Persist configuration in repo for auditability
  saveConfig(path = 'config/OPENCLAW_GATEWAY.json') {
    fs.writeFileSync(path, JSON.stringify({ opts: this.opts, adapters: [...this.adapters.keys()] }, null, 2));
  }
}

export default Gateway;
