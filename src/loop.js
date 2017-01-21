var async = require('async')
var db = require('./db.js')
var http = require('./http.js')

var timerInterval = 100000
var timerIsRunning = false
var timerPID

var siteList

function init () {
  db.getSites(function (err, res) {
    if (err) {
      console.error('Timer: Error, can not init timer: ' + err)
    } else {
      siteList = res
    }
  })
}

function start () {
  checkSites()
  console.log('Timer: starting timer...')
  timerPID = setInterval(checkSites, timerInterval)
  timerIsRunning = true
}

function stop () {
  console.log('Timer: stopping timer...')
  clearInterval(timerPID)
  timerIsRunning = false
}

function checkSites () {
  async.map(siteList, http.checkSite, function (err, result) {
    if (err) {
      stop()
      console.error('Timer: Error, stopping timer: ' + err)
      console.error(err.message)
    } else {
      console.log('Timer: Updated all sites')
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

