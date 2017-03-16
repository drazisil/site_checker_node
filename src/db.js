const sqlite3 = require('sqlite3').verbose()
const User = require('./model/user.js')

const db = new sqlite3.Database('db/sites.db')

function init() {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, status TEXT, response_time REAL, last_updated INTEGER)')

    db.run('CREATE TABLE IF NOT EXISTS sites (url TEXT UNIQUE PRIMARY KEY, check_time INTEGER DEFAULT 1, check_http INTEGER DEFAULT 0, check_https DEFAULT 1)')

    db.run('CREATE TABLE IF NOT EXISTS users (id TEXT UNIQUE PRIMARY KEY, avatar_url TEXT, name TEXT, email TEXT, login TEXT, access_token TEXT, jwt TEXT)')
  })
}

function getSites(callback) {
  db.all('SELECT url, check_time, check_http, check_https FROM sites', (err, rows) => {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

function getSitesStatus(callback) {
  db.all('SELECT url, status, response_time, last_updated FROM status', (err, rows) => {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

function getSiteStatusLatest(site, callback) {
  db.get(`SELECT url, status, response_time, last_updated FROM status WHERE url = "${site.url}" ORDER BY last_updated DESC`, (err, row) => {
    if (err) {
      callback(err)
    } else {
      callback(null, row)
    }
  })
}

function updateSiteStatus(url, status, responseTime, callback) {
  const stmt = db.prepare('INSERT OR REPLACE INTO status VALUES (?, ?, ?, ?, ?)')
  stmt.run(null, url, status, responseTime, Date.now())
  stmt.finalize((err, rows) => {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

function updateUser(user, callback) {
  const stmt = db.prepare('INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?, ?)')
  stmt.run(user.githubId, user.picture, user.displayName, user.email, user.displayName,
    JSON.stringify(user.accessToken), user.jwt)
  stmt.finalize((err, rows) => {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

function fetchUser(userId, callback) {
  db.get(`SELECT * FROM users WHERE id = "${userId}"`, (err, row) => {
    if (err) {
      callback(err)
    } else {
      const user = new User(row, JSON.parse(row.access_token))
      user.jwt = row.jwt
      callback(null, user)
    }
  })
}

module.exports = {
  getSites,
  getSitesStatus,
  getSiteStatusLatest,
  init,
  updateSiteStatus,
  fetchUser,
  updateUser,
}
