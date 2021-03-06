var request = require('request')
var db = require('./db.js')
var async = require('async')

function checkSite (site, callback) {
  request.get({
    url: prefixIfNeeded(site),
    time: true
  }, function (err, response) {
    if (err) {
      callback(err)
    } else {
      db.updateSiteStatus(site.url, getStatusFromResponseTime(response.elapsedTime, site.esponse_threshold), response.elapsedTime,
        function (err, res) {
          if (err) {
            callback(err)
          } else {
            response.url = site.url
            callback(null, response)
          }
        })
    }
  })
}

function getStatusFromResponseTime (responseTime, responseThreshold) {
  return 'up'
}

function fetchSitesStatus (callback) {
  db.getSites(function (err, res) {
    if (err) {
      callback(err)
    } else {
      fetchLatestStatus(res, callback)
    }
  })
}

function fetchLatestStatus (sites, callback) {
  async.map(sites, db.getSiteStatusLatest, function (err, results) {
    if (err) {
      throw err
    }
    callback(null, results)
  })
}

/* 1: Get all sites
* 2: For each site, get latest status
* 3: return array of statues
*/

function fetchSiteStatusLatest (site, callback) {
  db.getSiteStatusLatest(site, function (err, response) {
    if (err) {
      callback(err)
    } else {
      if (response === undefined) {
        callback({'status': 'fail',
          'error': 'No status found for site: ' + site.url})
      } else {
        callback(null, response)
      }
    }
  })
}

function prefixIfNeeded (site) {
  if (site.url.substring(0, 7) !== 'http://' && site.url.substring(0, 8) !== 'https://') {
    if (site.check_http) {
      return 'http://' + site.url
    } else if (site.check_https) {
      return 'https://' + site.url
    } else {
      return 'http://' + site.url
    }
  } else {
    return site.url
  }
}

module.exports = {
  checkSite: checkSite,
  fetchSiteStatusLatest: fetchSiteStatusLatest,
  fetchSitesStatus: fetchSitesStatus
}
