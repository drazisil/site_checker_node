const request = require('request')
const db = require('./db.js')
const async = require('async')

function prefixIfNeeded(site) {
  if (site.url.substring(0, 7) !== 'http://' && site.url.substring(0, 8) !== 'https://') {
    if (site.check_http) {
      return `http://${site.url}`
    } else if (site.check_https) {
      return `https://${site.url}`
    }
    return `http://${site.url}`
  }
  return site.url
}

/* eslint no-unused-vars: 0 */
function getStatusFromResponseTime(responseTime, responseThreshold) {
  return 'up'
}

function checkSite(site, callback) {
  request.get({
    url: prefixIfNeeded(site),
    time: true,
  }, (err, response) => {
    if (err) {
      callback(err)
    } else {
      db.updateSiteStatus(site.url, getStatusFromResponseTime(response.elapsedTime,
        site.response_threshold), response.elapsedTime,
        (errUpdateSiteStatus) => {
          if (errUpdateSiteStatus) {
            callback(err)
          } else {
            const res = response
            res.url = site.url
            callback(null, res)
          }
        })
    }
  })
}

function fetchLatestStatus(sites, callback) {
  async.map(sites, db.getSiteStatusLatest, (err, results) => {
    if (err) {
      throw err
    }
    callback(null, results)
  })
}

function fetchSitesStatus(callback) {
  db.getSites((err, res) => {
    if (err) {
      callback(err)
    } else {
      fetchLatestStatus(res, callback)
    }
  })
}

/* 1: Get all sites
* 2: For each site, get latest status
* 3: return array of statues
*/

function fetchSiteStatusLatest(site, callback) {
  db.getSiteStatusLatest(site, (err, response) => {
    if (err) {
      callback(err)
    }

    if (response === undefined) {
      callback({
        status: 'fail',
        error: `No status found for site: ${site.url}`,
      })
    } else {
      callback(null, response)
    }
  })
}

module.exports = {
  checkSite,
  fetchSiteStatusLatest,
  fetchSitesStatus,
}
