var db = require('./db.js')
var http = require('./http.js')
var slack = require('./slack.js')
var timer = require('./loop.js')

function init (config, callback) {
  db.init()

  db.importFromYml('../site_list.yml')

  slack.init(config, function () {
    // TODO: Add logging
  })

  // Create list of sites to check
  timer.init()

  // Set timer to check sites
  timer.start()
}

function sendSiteToSlack (channel, message, callback) {
  slack.sendMessageToChannel(channel, message, function (err, res) {
    if (err) {
      callback(err)
    } else {
      callback(res)
    }
  })
}

module.exports = {
  checkSite: http.checkSite,
  fetchSitesStatus: http.fetchSitesStatus,
  init: init,
  sendSiteToSlack: sendSiteToSlack
}
