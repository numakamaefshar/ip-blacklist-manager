const { format } = require('util');

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info(msg)  { console.log(`[${timestamp()}] INFO  ${msg}`); },
  warn(msg)  { console.warn(`[${timestamp()}] WARN  ${msg}`); },
  error(msg) { console.error(`[${timestamp()}] ERROR ${msg}`); },
};

module.exports = logger;
