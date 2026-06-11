const fs      = require('fs');
const readline = require('readline');
const logger  = require('./logger');

// Regex patterns for standard log formats
const PATTERNS = {
  apache: /^(?<ip>\d{1,3}(?:\.\d{1,3}){3}) \S+ \S+ \[.*?\] "(?<method>\S+) \S+ \S+" (?<status>\d{3})/,
  nginx:  /^(?<ip>\d{1,3}(?:\.\d{1,3}){3}) - \S+ \[.*?\] "(?<method>\S+) \S+ \S+" (?<status>\d{3})/,
};

class LogParser {
  constructor(config) {
    this.config = config;
  }

  /**
   * Read a log file line by line and return suspicious IPs
   * based on threshold and status code filters.
   */
  async extractSuspiciousIPs(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file not found: ${filePath}`);
    }

    logger.info(`Parsing log file: ${filePath} (format: ${this.config.logFormat})`);

    const ipCounts = {}; // { ip: count }

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const parsed = this._parseLine(line.trim());
      if (!parsed) continue;

      const { ip, status } = parsed;

      // Filter by status codes if configured
      if (this.config.suspiciousStatusCodes.length > 0) {
        if (!this.config.suspiciousStatusCodes.includes(Number(status))) continue;
      }

      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }

    // Apply threshold filter
    const threshold = this.config.requestThreshold || 1;
    const suspicious = Object.entries(ipCounts)
      .filter(([, count]) => count >= threshold)
      .map(([ip]) => ip);

    logger.info(`IP request counts (above threshold ${threshold}):`);
    Object.entries(ipCounts)
      .filter(([, count]) => count >= threshold)
      .forEach(([ip, count]) => logger.info(`  ${ip} → ${count} hits`));

    return suspicious;
  }

  _parseLine(line) {
    if (!line) return null;

    const format = this.config.logFormat;

    try {
      if (format === 'json') {
        return this._parseJSON(line);
      }

      if (format === 'custom') {
        return this._parseCustom(line);
      }

      // apache or nginx
      const pattern = PATTERNS[format];
      if (!pattern) {
        logger.warn(`Unknown log format: ${format}. Falling back to generic IP extraction.`);
        return this._parseGeneric(line);
      }

      const match = line.match(pattern);
      if (!match) return null;
      return { ip: match.groups.ip, status: match.groups.status || null };

    } catch {
      return null;
    }
  }

  _parseJSON(line) {
    const obj = JSON.parse(line);
    const ip = obj[this.config.jsonIpField];
    const status = obj.status || obj.status_code || null;
    if (!ip) return null;
    return { ip, status };
  }

  _parseCustom(line) {
    const regex = this.config.customRegex;
    if (!regex) throw new Error('customRegex is not defined in config');
    const match = line.match(regex);
    if (!match || !match.groups?.ip) return null;
    return { ip: match.groups.ip, status: match.groups?.status || null };
  }

  // Fallback: extract any IPv4 from the line
  _parseGeneric(line) {
    const match = line.match(/(?<ip>\d{1,3}(?:\.\d{1,3}){3})/);
    if (!match) return null;
    return { ip: match.groups.ip, status: null };
  }
}

module.exports = LogParser;
