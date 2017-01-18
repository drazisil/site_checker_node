var request = require('request')
var db = require('./db.js')

function checkSite (siteUrl, callback) {
  request.get({
    url: prefixIfNeeded(siteUrl),
    time: true
  }, function (err, response) {
    if (err) {
      callback({'status': 'fail',
        'error': err.message})
    } else {
      response.site_url = siteUrl
      db.updateSiteStatus(siteUrl, 'up', response.elapsedTime, function (err, res) {
        if (err) {
          callback({'status': 'fail',
            'error': err.message})
        } else {
          callback(null, {'status': 'success',
            'data': response})
        }
      })
    }
  })
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

function prefixIfNeeded (siteUrl) {
  if (siteUrl.substring(0, 7) !== 'http://' && siteUrl.substring(0, 8) !== 'https://') {
    return 'http://' + siteUrl
  } else {
    return siteUrl
  }
}

module.exports = {
  checkSite: checkSite,
  fetchSitesStatus: fetchSitesStatus
}
