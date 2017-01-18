var request = require('request')
var db = require('./db.js')

function checkSite (site, callback) {
  site.url = prefixIfNeeded(site)
  request.get({
    url: site.url,
    time: true
  }, function (err, response) {
    if (err) {
      callback({'status': 'fail',
        'error': err.message})
    } else {
      db.updateSiteStatus(site.url, getStatusFromResponseTime(response.elapsedTime, site.esponse_threshold), response.elapsedTime,
        function (err, res) {
        if (err) {
          callback({'status': 'fail',
            'error': err.message})
        } else {
          response.url = site.url
          callback(null, {'status': 'success',
            'data': response})
        }
      })
    }
  })
}

function getStatusFromResponseTime(response_time, response_threshold) {
  return 'up'
}

function fetchSitesStatus (callback) {
  db.getSitesStatus(function (err, response) {
    if (err) {
      callback(err)
      callback({'status': 'fail',
        'error': err.message})
    } else {
      callback(null, {'status': 'success',
        'data': response})
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
  fetchSitesStatus: fetchSitesStatus
}
