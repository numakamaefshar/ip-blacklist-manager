/**
 * Configuration
 * Edit this file to match your environment
 */

module.exports = {
  // Path to your log file
  logFile: '/var/log/apache2/access.log',

  // Path to persistent blacklist (JSON)
  blacklistFile: './blacklist.json',

  // Log format: 'apache', 'nginx', 'json', or 'custom'
  logFormat: 'apache',

  // For 'json' format: which field contains the IP
  jsonIpField: 'remote_addr',

  // For 'custom' format: regex with a capture group named 'ip'
  // Example: /(?<ip>\d{1,3}(?:\.\d{1,3}){3})/
  customRegex: null,

  // Threshold: block IP after this many requests (per log scan)
  requestThreshold: 100,

  // Optional: only flag IPs with these HTTP status codes (empty = all)
  // Example: [400, 401, 403, 404, 429, 500]
  suspiciousStatusCodes: [400, 401, 403, 404, 429],

  // iptables chain to add rules to ('INPUT' is standard)
  iptablesChain: 'INPUT',

  // Dry run: if true, print iptables commands without executing them
  dryRun: false,
};
