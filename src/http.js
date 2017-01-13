var request = require('request')

function checkSite(site_url, callback) {
  request.get({
    url : site_url,
    time : true
  },function(err, response){
    if (err) {
      callback(err)
    } else {
      response.site_url = site_url
      callback(null, response)
    }
  })
}

module.exports = {
  checkSite: checkSite
}