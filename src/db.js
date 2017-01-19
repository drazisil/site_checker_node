var yaml = require('js-yaml')
var fs = require('fs')
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('db/sites.db')
var Site = require('./model/site.js')
var config = require('../config.json')

function init () {
  db.serialize(function () {
    db.run('CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, status TEXT, response_time REAL, last_updated INTEGER)')

    db.run('CREATE TABLE IF NOT EXISTS sites (url TEXT UNIQUE PRIMARY KEY, check_time INTEGER DEFAULT 1, check_http INTEGER DEFAULT 0, check_https DEFAULT 1)')
  })
}

function importFromYml (yamlFile) {
  // Get document, or throw exception on error
  try {
    var doc = yaml.safeLoad(fs.readFileSync('site_list.yml', 'utf8'))
    var sites = []
    for (var prop in doc) {
      var thisSite = new Site(config, doc[prop])
      sites.push(thisSite)
    }
  } catch (e) {
    console.log(e)
  }

  db.serialize(function () {
    var stmt = db.prepare('INSERT OR IGNORE INTO sites VALUES (?, ?, ?, ?)')
    sites.forEach(function (site) {
      // console.dir(site)
      var siteId = site.url
      stmt.run(site.url, site.checkTime, site.checkHTTP, site.checkHTTPS)
    })
    stmt.finalize()
  })
}

function getSites (callback) {
  db.all('SELECT url, check_time, check_http, check_https FROM sites', function cbAll (err, rows) {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

function getSitesStatus (callback) {
  db.all('SELECT url, status, response_time, last_updated FROM status', function (err, rows) {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

function getSiteStatusLatest (site, callback) {
  db.get('SELECT url, status, response_time, last_updated FROM status WHERE url = "' + site.url + '" ORDER BY last_updated DESC', function cbGet (err, row) {
    if (err) {
      callback(err)
    } else {
      callback(null, row)
    }
  })
}

function updateSiteStatus (url, status, responseTime, callback) {
  var stmt = db.prepare('INSERT OR REPLACE INTO status VALUES (?, ?, ?, ?, ?)')
  stmt.run(null, url, status, responseTime, Date.now())
  stmt.finalize(function (err, rows) {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

module.exports = {
  getSites: getSites,
  getSitesStatus: getSitesStatus,
  getSiteStatusLatest: getSiteStatusLatest,
  importFromYml: importFromYml,
  init: init,
  updateSiteStatus: updateSiteStatus
}
