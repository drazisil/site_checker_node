var Botkit = require('botkit')
var http = require('./http.js')
var db = require('./db.js')
var controller = Botkit.slackbot()

var bot
var config

function init (appConfig, callback) {
  config = appConfig
  bot = controller.spawn({
    token: config.bot_token
  })

  bot.startRTM(function cbStartRTM (err, bot, payload) {
    if (err) {
      throw new Error('Could not connect to Slack')
    }
  })

  controller.hears(['shutdown'], 'direct_message,direct_mention,mention', cmdShutdown)

  controller.hears(['checkSite'], 'direct_message,direct_mention,mention,ambient', cmdCheckSite)

  controller.hears(['updateAll'], 'direct_message,direct_mention', cmdUpdateAll)

  callback()
}

function cmdShutdown (bot, message) {
  bot.startConversation(message, function (err, convo) {
    if (err) {
      throw err
    }
    convo.ask('Are you sure you want me to shutdown?', [
      {
        pattern: bot.utterances.yes,
        callback: function (response, convo) {
          convo.say('Bye!')
          convo.next()
          setTimeout(function () {
            process.exit()
          }, 3000)
        }
      },
      {
        pattern: bot.utterances.no,
        default: true,
        callback: function (response, convo) {
          convo.say('*Phew!*')
          convo.next()
        }
      }
    ])
  })
}

function cmdCheckSite (bot, message) {
  var siteToCheck = message.text.split(' ')[1]
  // First check if this is a slack link
  if (siteToCheck.substring(0, 1) === '<') {
    siteToCheck = siteToCheck.substring(1, siteToCheck.length - 1)
  }
  if (message.text.indexOf('|') >= 0) {
    siteToCheck = siteToCheck.split('|')[1]
  }

  http.checkSite(siteToCheck, cbCheckSite)
}

function cbCheckSite (err, res) {
  if (err) {
    sendMessageToChannel(config.slack_channel, 'I had an error: ' + err.error)
  } else {
    var msg = 'Site: ' + res.data.site_url + ', ' +
          'Status code: ' + res.data.statusCode + ', ' +
          'Request time in ms: ' + res.data.elapsedTime
    sendMessageToChannel(config.slack_channel, msg)
  }
}

function cmdUpdateAll (bot, message) {
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
        http.checkSite(siteUrl, cbUpdateAll)
      })
    }
  })
}

function cbUpdateAll (err, res) {
  if (err) {
    sendMessageToChannel(config.slack_channel, 'I had an error: ' + err.error)
  } else {
    var msg = 'Site: ' + res.data.site_url + ', ' +
          'Status code: ' + res.data.statusCode + ', ' +
          'Request time in ms: ' + res.data.elapsedTime
    sendMessageToChannel(config.slack_channel, msg)
    db.updateSiteStatus(res.data.site_url, res.data.statusCode, res.data.elapsedTime, function(err, response) {
      if (err) {
        console.error(err)
      }
    })
  }
}

function sendMessageToChannel (channel, message, callback) {
  bot.say(
    {
      'text': message,
      'channel': channel,
      'unfurl_links': false
    }, callback)
}

module.exports = {
  init: init,
  sendMessageToChannel: sendMessageToChannel
}
