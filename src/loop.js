var async = require('async')
var db = require('./db.js')
var http = require('./http.js')
var logger = require('./logger.js')

var timerInterval = 100000
var timerIsRunning = false
var timerPID

var siteList

function init () {
  db.getSites(function (err, res) {
    if (err) {
      logger.error('Timer: Error, can not init timer: ' + err)
    } else {
      siteList = res
    }
  })
}

function start () {
  checkSites()
  logger.info('Timer: starting timer...')
  timerPID = setInterval(checkSites, timerInterval)
  timerIsRunning = true
}

function stop () {
  logger.info('Timer: stopping timer...')
  clearInterval(timerPID)
  timerIsRunning = false
}

function checkSites () {
  async.map(siteList, http.checkSite, function (err, result) {
    if (err) {
      stop()
      logger.error('Timer: Error, stopping timer: ' + err)
      logger.error(err.message)
    } else {
      logger.info('Timer: Updated all sites')
    }
  })
}

function isTimerRunning () {
  return timerIsRunning
}

module.exports = {
  init: init,
  start: start,
  stop: stop,
  isTimerRunning: isTimerRunning
}
