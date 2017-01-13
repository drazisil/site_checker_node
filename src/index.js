var db = require('./db.js')

db.init()

db.importFromYml('../site_list.yml')

db.getSites(function(err, res) {
  if (err) {
    throw err
  } else {
    console.log(res)
  }
})

// def pingTest(url):
//    "Ping a domain. If it returns a 0, the site is good."
//    response = subprocess.call(['ping', '-c', '1', url], stdout=subprocess.PIPE)
//    return response