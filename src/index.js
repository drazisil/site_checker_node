var db = require('./db.js')
var http = require('./http.js')
var slack = require('./slack.js')
var config = require('../config.json')

db.init()

db.importFromYml('../site_list.yml')

slack.init(config, function() {
  console.log('Slack connected')
})

db.getSites(function(err, res) {
  if (err) {
    throw err
  } else {
    res.forEach(function(site) {
      if (site.checkHTTPS) {
        site_url = 'https://' + site.site_id
      } else {
        site_url = 'http://' + site.site_id
      }
      http.checkSite(site_url, function(err, res) {
        if (err) {
          throw err
        } else {
          var msg = 'Site: ' + res.site_url + '\n' +
          'Status code: ' + res.statusCode + "\n" +
          'Request time in ms: ' + res.elapsedTime
/*          sendSiteToSlack(config.slack_channel, msg, function(err, res) {
            if (err) {
              if (err.ok !== true) {
                console.log(err.ok + '== true' )
                console.dir(err)
                throw err
              }
            } else {
              // Don't care :)
            }
          })
*/        }
      })
    })
  }
})

function sendSiteToSlack(channel, message, callback) {
  slack.sendMessageToChannel(channel, message, function(err, res) {
  if (err) {
    callback(err)
  } else {
    callback(res)
  }
})
}

//def webServerTest_80(baseurl, path):
//    "Connect to site via HTTP.  If it returns a 200, the site is up."
//    response = requests.get('http://' + "{0}{1}".format(baseurl, path))
//    return response.status_code
//    