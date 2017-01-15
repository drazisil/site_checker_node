var db = require('./db.js')
var http = require('./http.js')
var slack = require('./slack.js')

function init (config, callback) {
  db.init()

  db.importFromYml('../site_list.yml')

  slack.init(config, function () {
    console.log('Slack connected')
  })
}

function updateAllSites (callback) {
  db.getSites(function (err, res) {
    if (err) {
      callback(err)
    } else {
      var siteUrl
      res.forEach(function (site) {
        if (site.checkHTTPS) {
          siteUrl = 'https://' + site.site_id
        } else {
          siteUrl = 'http://' + site.site_id
        }
        http.checkSite(siteUrl, function (err, res) {
          if (err) {
            callback(err)
          } else {
            callback(null, {'status': 'success',
              'msg': 'Site: ' + res.site_url + '\n' +
          'Status code: ' + res.statusCode + '\n' +
          'Request time in ms: ' + res.elapsedTime})
          }
        })
      })
    }
  })
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
  init: init,
  sendSiteToSlack: sendSiteToSlack
}
