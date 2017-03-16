const db = require('./db.js')
const http = require('./http.js')
const slack = require('./slack.js')
const loop = require('./loop.js')

function init(config) {
  db.init()

  slack.init(config, () => {
    // TODO: Add logging
  })

  // Create list of sites to check
  loop.init((err, siteList) => {
    if (err) { throw err }

    // Set timer to check sites
    loop.start(siteList)
  })
}

module.exports = {
  checkSite: http.checkSite,
  fetchSitesStatus: http.fetchSitesStatus,
  init,
  sendSiteToSlack: slack.sendMessageToChannel,
  fetchUser: db.fetchUser,
  updateUser: db.updateUser,
}
