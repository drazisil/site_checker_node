var logger = require('winston')

logger.cli()
// logger.add(logger.transports.File, { filename: 'logs/mco_server.log' })
logger.add(require('winston-daily-rotate-file'), {
  filename: 'logs/site_checker_log.json',
  json: true,
  prepend: true,
  datePattern: 'yyyy-MM-dd_'
})
logger.level = 'info'
logger.levels = logger.config.syslog.levels

module.exports = logger
