var config = require('./config.json')
var express = require('express')
var http = require('http')
var request = require('request')
var qs = require('querystring')
var jwt = require('jwt-simple')
var moment = require('moment')
var cors = require('cors')
var bodyParser = require('body-parser')

var siteChecker = require('./src/index.js')
var logger = require('./src/logger.js')

var app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Server port is set by PORT env or web_port from config file with fallback to 3000
app.set('port', process.env.PORT || config.web_port || 3000)

app.get('/check/:site', function (req, response) {
  // console.dir(req.body)
  siteChecker.checkSite(req.params.site, function cbCheckSite (err, res) {
    if (err) {
      response.status(500).send({'status': 'fail',
        'error': err.message})
    } else {
      response.status(200).send({'status': 'success',
        'data': res})
    }
  })
})

app.get('/api/sites', function (req, response) {
  // console.dir(req.body)
  siteChecker.fetchSitesStatus(function cbGetSites (err, res) {
    if (err) {
      response.status(500).send({'status': 'fail',
        'error': err.message})
    } else {
      response.status(200).send({'status': 'success',
        'data': res})
    }
  })
})

var user = {}

/*
 |--------------------------------------------------------------------------
 | Login with GitHub
 |--------------------------------------------------------------------------
 */
app.post('/auth/github', function (req, res) {
  var accessTokenUrl = 'https://github.com/login/oauth/access_token'
  var userApiUrl = 'https://api.github.com/user'
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.GITHUB_SECRET,
    redirect_uri: req.body.redirectUri
  }

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params }, function (err, response, accessToken) {
    accessToken = qs.parse(accessToken)
    var headers = { 'User-Agent': 'Satellizer' }

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function (err, response, profile) {
      // Step 3a. Link user accounts.
      if (req.header('Authorization')) {
        /* if (user) {
          return res.status(409).send({ message: 'There is already a GitHub account that belongs to you' })
        }
        */var token = req.header('Authorization').split(' ')[1]
        var payload = jwt.decode(token, config.TOKEN_SECRET)

        if (!profile.id) {
          return res.status(400).send({ message: 'User not found' })
        }
        user.github = profile.id
        user.picture = user.picture || profile.avatar_url
        user.displayName = user.displayName || profile.name
        var token = createJWT(user)
        res.send({ token: token })
      } else {
        // Step 3b. Create a new user account or return an existing one.
        if (user) {
          var token = createJWT(user)
          return res.send({ token: token })
        }
        user.github = profile.id
        user.picture = profile.avatar_url
        user.displayName = profile.name
        user.email = profile.email

        var token = createJWT(user)
        res.send({ token: token })
      }
    })
  })
})

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated (req, res, next) {
  if (!req.header('Authorization')) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' })
  }
  var token = req.header('Authorization').split(' ')[1]

  var payload = null
  try {
    payload = jwt.decode(token, config.TOKEN_SECRET)
  } catch (err) {
    return res.status(401).send({ message: err.message })
  }

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' })
  }
  req.user = payload.sub
  next()
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT (user) {
  var payload = {
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  }
  return jwt.encode(payload, config.TOKEN_SECRET)
}

/*
 |--------------------------------------------------------------------------
 | GET /api/me
 |--------------------------------------------------------------------------
 */
app.get('/api/me', ensureAuthenticated, function (req, res) {
  res.send(user)
})

app.get('/api/profile', function (req, res) {
  res.send(user)
})

app.use(express.static('public'))

http.createServer(app).listen(app.get('port'), function () {
  logger.info('Express server listening on port ' + app.get('port'))
})

siteChecker.init(config, function (err, res) {
  if (err) {
    throw err
  }
})
