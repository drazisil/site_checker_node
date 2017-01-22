var config = require('./config.json')
var express = require('express')
var http = require('http')
var path = require('path')
var passport = require('passport')
// var util = require('util')
var session = require('express-session')
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var GitHubStrategy = require('passport-github2').Strategy
var partials = require('express-partials')

var siteChecker = require('./src/index.js')
var logger = require('./src/logger.js')

var GITHUB_CLIENT_ID = config.github_oauth_client_id
var GITHUB_CLIENT_SECRET = config.github_oauth_client_secret

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (obj, done) {
  done(null, obj)
})

// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://127.0.0.1:3000/auth/callback'
},
  function (accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
      return done(null, profile)
    })
  }
))

var app = express()

// configure Express
app.use(partials())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(methodOverride())
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }))
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize())
app.use(passport.session())
app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs')

/* app.get('/', function (req, res) {
  res.render('index', { user: req.user })
})
*/
app.get('/profile', ensureAuthenticated, function (req, res) {
  // res.render('account', { user: req.user })
  res.redirect('/')
})

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function (req, res) {
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  })

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    var redirectUrl = '/?code=' + req.query.code
    res.redirect(redirectUrl)
  })

app.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

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

app.use(express.static('public'))

http.createServer(app).listen(app.get('port'), function () {
  logger.info('Express server listening on port ' + app.get('port'))
})

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) { return next() }
  res.redirect('/auth/github')
}

siteChecker.init(config, function (err, res) {
  if (err) {
    throw err
  }
})
