#!/usr/bin/env node
/**
 * IP Blacklist Manager
 * Extracts IPs from log files and blocks them via iptables
 */

const LogParser    = require('./src/logParser');
const Blacklist    = require('./src/blacklist');
const IptablesManager = require('./src/iptablesManager');
const config       = require('./config/config');
const logger       = require('./src/logger');

async function main() {
  logger.info('=== IP Blacklist Manager Started ===');

  // 1. Parse logs and extract IPs
  const parser = new LogParser(config);
  const suspiciousIPs = await parser.extractSuspiciousIPs(config.logFile);

  if (suspiciousIPs.length === 0) {
    logger.info('No suspicious IPs found.');
    return;
  }

  logger.info(`Found ${suspiciousIPs.length} suspicious IP(s): ${suspiciousIPs.join(', ')}`);

  // 2. Load existing blacklist
  const blacklist = new Blacklist(config.blacklistFile);
  await blacklist.load();

  // 3. Add new IPs to blacklist
  const newIPs = blacklist.addMany(suspiciousIPs);
  await blacklist.save();

  if (newIPs.length === 0) {
    logger.info('All IPs already in blacklist. Nothing new to block.');
    return;
  }

  logger.info(`New IPs added to blacklist: ${newIPs.join(', ')}`);

  // 4. Block via iptables
  const iptables = new IptablesManager();
  for (const ip of newIPs) {
    await iptables.blockIP(ip);
  }

  logger.info('=== Done ===');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
