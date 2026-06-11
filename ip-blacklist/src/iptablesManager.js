const { execSync } = require('child_process');
const logger = require('./logger');
const config = require('../config/config');

class IptablesManager {
  /**
   * Block an IP using iptables DROP rule.
   * Skips if rule already exists.
   */
  blockIP(ip) {
    const chain = config.iptablesChain || 'INPUT';

    // Check if rule already exists
    const checkCmd = `iptables -C ${chain} -s ${ip} -j DROP 2>/dev/null`;
    const addCmd   = `iptables -A ${chain} -s ${ip} -j DROP`;

    if (config.dryRun) {
      logger.info(`[DRY RUN] Would run: ${addCmd}`);
      return;
    }

    try {
      execSync(checkCmd);
      logger.info(`iptables rule already exists for ${ip} — skipping.`);
    } catch {
      // Rule does not exist → add it
      try {
        execSync(addCmd);
        logger.info(`Blocked IP: ${ip} (iptables DROP added)`);
      } catch (err) {
        logger.error(`Failed to block ${ip}: ${err.message}`);
        logger.error('Make sure the script runs as root (sudo).');
      }
    }
  }

  /**
   * Unblock an IP (remove the DROP rule).
   */
  unblockIP(ip) {
    const chain  = config.iptablesChain || 'INPUT';
    const delCmd = `iptables -D ${chain} -s ${ip} -j DROP`;

    if (config.dryRun) {
      logger.info(`[DRY RUN] Would run: ${delCmd}`);
      return;
    }

    try {
      execSync(delCmd);
      logger.info(`Unblocked IP: ${ip}`);
    } catch (err) {
      logger.error(`Failed to unblock ${ip}: ${err.message}`);
    }
  }

  /**
   * List all currently blocked IPs from iptables.
   */
  listBlocked() {
    try {
      const output = execSync(`iptables -L ${config.iptablesChain} -n --line-numbers`).toString();
      const lines  = output.split('\n').filter(l => l.includes('DROP'));
      return lines;
    } catch (err) {
      logger.error(`Failed to list iptables rules: ${err.message}`);
      return [];
    }
  }
}

module.exports = IptablesManager;
