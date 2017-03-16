const Botkit = require('botkit')
const http = require('./http.js')
const db = require('./db.js')
const async = require('async')
const logger = require('./logger.js')

const controller = Botkit.slackbot({
  retry: true,
  logger,
})

function cmdShutdown(config, bot, message) {
  bot.startConversation(message, (err, convo) => {
    if (err) {
      throw err
    }
    convo.ask('Are you sure you want me to shutdown?', [
      {
        pattern: bot.utterances.yes,
        callback: () => {
          convo.say('Bye!')
          convo.next()
          setTimeout(() => {
            process.exit()
          }, 3000)
        },
      },
      {
        pattern: bot.utterances.no,
        default: true,
        callback: () => {
          convo.say('*Phew!*')
          convo.next()
        },
      },
    ])
  })
}

function sendMessageToChannel(bot, channel, message, callback) {
  bot.say(
    {
      text: message,
      channel,
      unfurl_links: false,
    }, callback)
}

function cmdHelp(config, bot, message) {
  const msg = 'checkSite <site url>\n' +
  'siteStatus <site url>\n' +
  'fetchStatusAll\n' +
  'updateAll\n' +
  'shutdown'
  bot.reply(message, msg)
}

function cmdCheckSite(config, bot, message) {
  if (message.text.split(' ')[1] !== undefined) {
    return cmdHelp(config, bot, message)
  }
  const siteUrl = message.text.split(' ')[1]
  const site = {}
  // First check if this is a slack link
  if (siteUrl.substring(0, 1) === '<') {
    site.url = siteUrl.substring(1, siteUrl.length - 1)
  }
  if (site.url.indexOf('|') >= 0) {
    site.url = site.url.split('|')[1]
  }
  http.checkSite(site, (err, res) => {
    if (err) {
      sendMessageToChannel(bot, config.slack_channel, `I had an error: ${err.error}`)
    } else {
      const msg = `Site: ${res.url}
        Status code: ${res.statusCode}
        Request time in ms: ${res.elapsedTime}`
      sendMessageToChannel(bot, config.slack_channel, msg)
    }
  })
  return null
}

function cmdSiteStatus(config, bot, message) {
  const site = message.text.split(' ')[1]
  // First check if this is a slack link
  if (site.substring(0, 1) === '<') {
    site.url = site.substring(1, site.length - 1)
  }
  if (message.text.indexOf('|') >= 0) {
    site.url = site.split('|')[1]
  }
  http.fetchSiteStatusLatest(site, (err, res) => {
    if (err) {
      sendMessageToChannel(bot, config.slack_channel, `I had an error: ${err.error}`)
    } else {
      const msg = `Site: ${res.data.url}
        Status: ${res.data.status}
        Request time in ms: ${res.data.response_time}`
      sendMessageToChannel(bot, config.slack_channel, msg)
    }
  })
}

function cmdUpdateAll(config, bot) {
  db.getSites((err, res) => {
    if (err) {
      throw err
    } else {
      res.forEach((site) => {
        http.checkSite(site, (errCheckSite) => {
          if (errCheckSite) {
            sendMessageToChannel(bot, config.slack_channel, `I had an error: ${err.error}`)
          } else {
            const msg = `Site: ${res.data.url}
              Status code: ${res.data.statusCode}
              Request time in ms: ${res.data.elapsedTime}`
            sendMessageToChannel(bot, config.slack_channel, msg)
          }
        })
      })
    }
  })
}

function sendSiteToSlack(config, bot, site) {
  const msg = `Site: ${site.url}
    Status code: ${site.status}
    Request time in ms: ${site.response_time}
    Last Updated: ${Date(site.last_updated)}`
  sendMessageToChannel(bot, config.slack_channel, msg)
}

function cmdFetchStatusAll(config, bot) {
  db.getSites((errGetSites, resGetSites) => {
    if (errGetSites) {
      sendMessageToChannel(bot, config.slack_channel, `I had an error: ${errGetSites.error}`)
    } else {
      async.map(resGetSites, db.getSiteStatusLatest, (err2, res) => {
        if (err2) {
          throw err2
        } else {
          res.forEach((site) => {
            sendSiteToSlack(config, bot, site, (err) => {
              if (err) {
                throw err
              }
            })
          })
        }
      })
    }
  })
}

function init(configuration, callback) {
  const config = configuration

  // Tell bot to reconnect on disconnect in case of error
  config.retry = true

  // Launch bot
  const bot = controller.spawn({
    token: config.bot_token,
  })

  bot.startRTM((err) => {
    if (err) {
      throw new Error('Could not connect to Slack')
    }
  })


  controller.hears(['shutdown'], 'direct_message,direct_mention,mention', (botShutdown, message) => {
    cmdShutdown(config, botShutdown, message)
  })

  controller.hears(['checkSite'], 'direct_message,direct_mention,mention,ambient', (botCheckSite, message) => {
    cmdCheckSite(config, botCheckSite, message)
  })

  controller.hears(['siteStatus'], 'direct_message,direct_mention,mention,ambient', (botSiteStatus, message) => {
    cmdSiteStatus(config, botSiteStatus, message)
  })

  controller.hears(['updateAll'], 'direct_message,direct_mention', (botUpdateAll, message) => {
    cmdUpdateAll(config, botUpdateAll, message)
  })

  controller.hears(['fetchStatusAll'], 'direct_message,direct_mention', (botFetchStatusAll, message) => {
    cmdFetchStatusAll(config, botFetchStatusAll, message)
  })

  controller.hears(['help'], 'direct_message,direct_mention', (botHelp, message) => {
    cmdHelp(config, botHelp, message)
  })

  callback()
}

module.exports = {
  init,
  sendMessageToChannel,
}
