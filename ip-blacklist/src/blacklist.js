const fs     = require('fs');
const path   = require('path');
const logger = require('./logger');

class Blacklist {
  constructor(filePath) {
    this.filePath = filePath;
    this.ips = new Set();
  }

  async load() {
    if (!fs.existsSync(this.filePath)) {
      logger.info(`Blacklist file not found at ${this.filePath}. Starting fresh.`);
      return;
    }
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const data = JSON.parse(raw);
    (data.blocked_ips || []).forEach(ip => this.ips.add(ip));
    logger.info(`Loaded ${this.ips.size} IPs from blacklist.`);
  }

  async save() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const data = {
      updated_at: new Date().toISOString(),
      count: this.ips.size,
      blocked_ips: Array.from(this.ips).sort(),
    };
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Blacklist saved (${this.ips.size} IPs) → ${this.filePath}`);
  }

  /** Add a single IP. Returns true if it was new. */
  add(ip) {
    if (this.ips.has(ip)) return false;
    this.ips.add(ip);
    return true;
  }

  /** Add multiple IPs. Returns array of newly added IPs. */
  addMany(ips) {
    return ips.filter(ip => this.add(ip));
  }

  has(ip) {
    return this.ips.has(ip);
  }

  remove(ip) {
    return this.ips.delete(ip);
  }

  list() {
    return Array.from(this.ips).sort();
  }
}

module.exports = Blacklist;
