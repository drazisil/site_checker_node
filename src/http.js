var request = require('request')

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
  checkSite: checkSite
}
