const config = require('./config.json')
const express = require('express')
const http = require('http')
const request = require('request')
const qs = require('querystring')
const jwt = require('jwt-simple')
const moment = require('moment')
const cors = require('cors')
const bodyParser = require('body-parser')

const siteChecker = require('./src/index.js')
const logger = require('./src/logger.js')

const User = require('./src/model/user.js')

const app = express()

let userSession = {}

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Server port is set by PORT env or web_port from config file with fallback to 3000
app.set('port', process.env.PORT || config.web_port || 3000)

app.get('/check/:site', (req, response) => {
  // console.dir(req.body)
  siteChecker.checkSite(req.params.site, (err, res) => {
    if (err) {
      response.status(500).send({
        status: 'fail',
        error: err.message,
      })
    } else {
      response.status(200).send({
        status: 'success',
        data: res,
      })
    }
  })
})

app.get('/api/sites', (req, response) => {
  // console.dir(req.body)
  siteChecker.fetchSitesStatus((err, res) => {
    if (err) {
      response.status(500).send({
        status: 'fail',
        error: err.message,
      })
    } else {
      response.status(200).send({
        status: 'success',
        data: res,
      })
    }
  })
})

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user) {
  const payload = {
    sub: user.githubId,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix(),
  }
  return jwt.encode(payload, config.TOKEN_SECRET)
}

/*
 |--------------------------------------------------------------------------
 | Login with GitHub
 |--------------------------------------------------------------------------
 */
app.post('/auth/github', (req, res) => {
  const accessTokenUrl = 'https://github.com/login/oauth/access_token'
  const userApiUrl = 'https://api.github.com/user'
  const params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.GITHUB_SECRET,
    redirect_uri: req.body.redirectUri,
  }

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params }, (err, response, accessToken) => {
    if (err) {
      throw err
    }
    // const headers = { 'User-Agent': 'Satellizer' }

    // Step 2. Retrieve profile information about the current user.
    request.get({
      url: userApiUrl,
      qs: qs.parse(accessToken),
      headers: { 'User-Agent': 'Satellizer' },
      json: true,
    }, (errApiGetUser, resApiGetUser, profile) => {
      if (errApiGetUser) {
        throw err
      }
      // Step 3a. Link user accounts.
      if (req.header('Authorization')) {
        /* if (user) {
          return res.status(409).send({ message: 'There is already a G
          itHub account that belongs to you' })
        }
        */
        // const token = req.header('Authorization').split(' ')[1]
        // const payload = jwt.decode(token, config.TOKEN_SECRET)

        if (!profile.id) {
          return res.status(400).send({ message: 'User not found' })
        }

        userSession = new User(profile, accessToken)

        userSession.jwt = createJWT(userSession)

        return res.send({ token: userSession.jwt })
      }
      // Step 3b. Create a new user account or return an existing one.
      if (userSession === {}) {
        return res.send({ token: userSession.jwt })
      }
      userSession = new User(profile, accessToken)

      userSession.jwt = createJWT(userSession)

      siteChecker.updateUser(userSession, (errUpdateUser) => {
        if (errUpdateUser) {
          logger.error(errUpdateUser)
        }
      })

      siteChecker.fetchUser(userSession.githubId, (errFetchUser) => {
        if (errFetchUser) {
          logger.error(errFetchUser)
        }
      })
      return res.send({ token: userSession.jwt })
    })
  })
})

// /*
//  |--------------------------------------------------------------------------
//  | Login Required Middleware
//  |--------------------------------------------------------------------------
//  */
// function ensureAuthenticated(req, res, next) {
//   if (!req.header('Authorization')) {
//     return res.status(401).send({
//       message: 'Please make sure your request has an Authorization header' })
//   }
//   const token = req.header('Authorization').split(' ')[1]
//
//   let payload = null
//   try {
//     payload = jwt.decode(token, config.TOKEN_SECRET)
//   } catch (err) {
//     return res.status(401).send({ message: err.message })
//   }
//
//   if (payload.exp <= moment().unix()) {
//     return res.status(401).send({ message: 'Token has expired' })
//   }
//   req.user = payload.sub
//   next()
//   return null
// }


// /*
//  |--------------------------------------------------------------------------
//  | GET /api/me
//  |--------------------------------------------------------------------------
//  */
app.get('/api/me', (req, res) => {
  res.send(userSession)
})

app.get('/api/profile', (req, res) => {
  logger.info('Requesting profile')
  res.send(userSession)
})

app.get('/auth/logout', (req, res) => {
  userSession = null
  if (!userSession) {
    userSession = {}
    res.status(200).send()
  } else {
    logger.info(userSession)
    res.status(500).send()
  }
})

app.use(express.static('public'))

http.createServer(app).listen(app.get('port'), () => {
  logger.info(`Express server listening on port ${app.get('port')}`)
})

siteChecker.init(config, (err) => {
  if (err) {
    throw err
  }
})
