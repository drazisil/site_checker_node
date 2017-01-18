function Site (config, site) {
  this.url = site.base_url + site.path
  this.checkTime = site.checkTime
  this.checkHTTP = site.checkHTTP
  this.checkHTTPS = site.checkHTTPS
  this.responseThreshold = config.responseThreshold
  return this
}

module.exports = Site
