const async = require('async')
const db = require('./db.js')
const http = require('./http.js')
const logger = require('./logger.js')

const timerInterval = 100000
let timerIsRunning = false
let timerPID

function init(callback) {
  db.getSites((err, res) => {
    if (err) {
      callback(`Timer: Error, can not init timer: ${err}`)
    } else {
      callback(null, res)
    }
  })
}

function stop() {
  logger.info('Timer: stopping timer...')
  clearInterval(timerPID)
  timerIsRunning = false
}

function checkSites(siteList) {
  async.map(siteList, http.checkSite, (err) => {
    if (err) {
      stop()
      logger.error(`Timer: Error, stopping timer: ${err}`)
      logger.error(err.message)
    } else {
      logger.info('Timer: Updated all sites')
    }
  })
}

function start(siteList) {
  checkSites(siteList)
  logger.info('Timer: starting timer...')
  timerPID = setInterval(checkSites, timerInterval, siteList)
  timerIsRunning = true
}

function isTimerRunning() {
  return timerIsRunning
}

module.exports = {
  init,
  start,
  stop,
  isTimerRunning,
}
