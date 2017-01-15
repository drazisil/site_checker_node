var config = require('./config.json')
var express = require('express')
var http = require('http')
var bodyParser = require('body-parser')

var siteChecker = require('./src/index.js')

var app = express()

app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

// Server port is set by PORT env or web_port from config file with fallback to 3000
app.set('port', process.env.PORT || config.web_port || 3000)

app.get('/check/:site', function (req, response) {
  // console.dir(req.body)
  siteChecker.checkSite(req.params.site, function cbCheckSite (err, res) {
    if (err) {
      response.status(500).send(err)
    } else {
      response.status(200).send(res)
    }
  })
})

app.use(express.static('public'))

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

siteChecker.init(config, function (err, res) {
  if (err) {
    throw err
  } else {
    console.log(res)
  }
})
