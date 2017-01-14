var request = require('request')
var Botkit = require('botkit')
var http = require('./http.js')
var controller = Botkit.slackbot()

var bot
var config
var channelList

function init (app_config, callback) {
  config = app_config
  bot = controller.spawn({
    token: config.bot_token
  })

  bot.startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error('Could not connect to Slack')
    }
  })

  controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function (bot, message) {

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
  })

  controller.hears(['checkSite'], 'direct_message,direct_mention,mention,ambient', function (bot, message) {
    console.log(message.text)
    if (!message.text.indexOf('|')) {
    var site_to_check = message.text.split(' ')[1].split('|')[1].split('>')[0]  
  } else {
    var site_to_check = message.text.split('<')[1].split('>')[0]
  }
    
    console.log(site_to_check)
    http.checkSite(site_to_check, function(err, res) {
      if (err) {
        sendMessageToChannel(config.slack_channel, 'I had an error: ' + err.toString())
        console.dir(err)
      } else {
        var msg = 'Site: ' + res.site_url + ', ' +
          'Status code: ' + res.statusCode + ', ' +
          'Request time in ms: ' + res.elapsedTime
        sendMessageToChannel(config.slack_channel, msg)
      }
    })
  })

  callback()
}

function sendMessageToChannel(channel, message, callback) {
  bot.say(
  {
    "text": message,
    "channel": channel,
    "unfurl_links": false
  }, callback)
}

module.exports = {
  init: init,
  sendMessageToChannel: sendMessageToChannel,
}