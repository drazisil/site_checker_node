var yaml = require('js-yaml')
var fs   = require('fs')
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('db/sites.db')

function init() {
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY AUTOINCREMENT, \
      url TEXT, status TEXT, response_time REAL)")
  
    db.run("CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY AUTOINCREMENT, \
      url TEXT, status TEXT, response_time REAL)")
  
    db.run("CREATE TABLE IF NOT EXISTS history (info TEXT)")
  
    db.run("CREATE TABLE IF NOT EXISTS sites (site_id TEXT UNIQUE PRIMARY KEY, base_url TEXT, path TEXT, \
      check_time INTEGER DEFAULT 1, check_http INTEGER DEFAULT 0, check_https DEFAULT 1)")
  })
}

function importFromYml(yamlFile) {
  // Get document, or throw exception on error
  try {
    var doc = yaml.safeLoad(fs.readFileSync('site_list.yml', 'utf8'))
    var sites = []
    for (var prop in doc) {
      sites.push(doc[prop])
    }
    // console.dir(sites)
    // console.log(sites.length)
    // console.log(doc)
  } catch (e) {
    console.log(e)
  }

  db.serialize(function() {
    // var stmt = db.prepare("INSERT INTO status VALUES (?, ?, ?, ?)")
    // for (var i = 0; i < 10; i++) {
    //     stmt.run(null, null, null, i)
    // }
    // stmt.finalize()

    var stmt = db.prepare("INSERT OR IGNORE INTO sites VALUES (?, ?, ?, ?, ?, ?)")
    sites.forEach(function(site) {
      //console.dir(site)
      var site_id = site.base_url + site.path
      stmt.run(site_id, site.base_url, site.path, site.checkTime, site.checkHTTP, site.checkHTTPS)
    })
    stmt.finalize()
  })
}

function getSites(callback) {
  db.all("SELECT site_id, base_url FROM sites", function(err, rows) {
    if (err) {
      callback(err)
    } else {
      callback(null, rows)
    }
  })
}

module.exports = {
  getSites: getSites,
  importFromYml: importFromYml,
  init: init 
}