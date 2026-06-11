#!/usr/bin/env node
/**
 * CLI tool for manual blacklist management
 * Usage:
 *   node cli.js list
 *   node cli.js add 1.2.3.4
 *   node cli.js remove 1.2.3.4
 *   node cli.js sync          ← push entire blacklist to iptables
 */

const Blacklist       = require('./src/blacklist');
const IptablesManager = require('./src/iptablesManager');
const config          = require('./config/config');
const logger          = require('./src/logger');

const [,, command, arg] = process.argv;

async function main() {
  const blacklist = new Blacklist(config.blacklistFile);
  await blacklist.load();

  switch (command) {
    case 'list': {
      const ips = blacklist.list();
      if (ips.length === 0) {
        console.log('Blacklist is empty.');
      } else {
        console.log(`Blacklisted IPs (${ips.length}):`);
        ips.forEach(ip => console.log(`  ${ip}`));
      }
      break;
    }

    case 'add': {
      if (!arg) { console.error('Usage: node cli.js add <ip>'); process.exit(1); }
      const isNew = blacklist.add(arg);
      await blacklist.save();
      if (isNew) {
        const iptables = new IptablesManager();
        iptables.blockIP(arg);
        logger.info(`Added and blocked: ${arg}`);
      } else {
        logger.info(`${arg} already in blacklist.`);
      }
      break;
    }

    case 'remove': {
      if (!arg) { console.error('Usage: node cli.js remove <ip>'); process.exit(1); }
      blacklist.remove(arg);
      await blacklist.save();
      const iptables = new IptablesManager();
      iptables.unblockIP(arg);
      logger.info(`Removed and unblocked: ${arg}`);
      break;
    }

    case 'sync': {
      const iptables = new IptablesManager();
      const ips = blacklist.list();
      logger.info(`Syncing ${ips.length} IPs to iptables...`);
      ips.forEach(ip => iptables.blockIP(ip));
      logger.info('Sync complete.');
      break;
    }

    default:
      console.log(`
IP Blacklist CLI
Usage:
  node cli.js list              Show all blacklisted IPs
  node cli.js add <ip>          Add IP to blacklist and block it
  node cli.js remove <ip>       Remove IP from blacklist and unblock it
  node cli.js sync              Push all blacklisted IPs to iptables
      `);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
