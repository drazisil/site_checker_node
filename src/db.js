var yaml = require('js-yaml')
var fs = require('fs')
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('db/sites.db')
var Site = require('./model/site.js')
var User = require('./model/user.js')
var config = require('../config.json')

function init () {
  db.serialize(function () {
    db.run('CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, status TEXT, response_time REAL, last_updated INTEGER)')

    db.run('CREATE TABLE IF NOT EXISTS sites (url TEXT UNIQUE PRIMARY KEY, check_time INTEGER DEFAULT 1, check_http INTEGER DEFAULT 0, check_https DEFAULT 1)')

    db.run('CREATE TABLE IF NOT EXISTS users (id TEXT UNIQUE PRIMARY KEY, avatar_url TEXT, name TEXT, email TEXT, login TEXT, access_token TEXT, jwt TEXT)')
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
    throw e
  }

  db.serialize(function () {
    var stmt = db.prepare('INSERT OR IGNORE INTO sites VALUES (?, ?, ?, ?)')
    sites.forEach(function (site) {
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

function updateUser (user, callback) {
  var stmt = db.prepare('INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?, ?)')
  stmt.run(user.githubId, user.picture, user.displayName, user.email, user.displayName, JSON.stringify(user.accessToken), user.jwt)
  stmt.finalize(function (err, rows) {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

function fetchUser (userId, callback) {
  db.get('SELECT * FROM users WHERE id = "' + userId + '"', function cbGet (err, row) {
    if (err) {
      callback(err)
    } else {
      var user = new User(row, JSON.parse(row.access_token))
      user.jwt = row.jwt
      callback(null, user)
    }
  })
}

module.exports = {
  getSites: getSites,
  getSitesStatus: getSitesStatus,
  getSiteStatusLatest: getSiteStatusLatest,
  importFromYml: importFromYml,
  init: init,
  updateSiteStatus: updateSiteStatus,
  fetchUser: fetchUser,
  updateUser: updateUser
}
