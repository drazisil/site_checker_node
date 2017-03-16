const config = require('../config/auth.json')
const passport = require('koa-passport')
const GithubStrategy = require('passport-github').Strategy

passport.use(new GithubStrategy({
  clientID: config.GITHUB_ID,
  clientSecret: config.GITHUB_SECRET,
  callbackURL: 'http://localhost:3000/auth/github/callback',
},
(accessToken, refreshToken, profile, done) => {
  // Based on profile return from Github, find existing user
  const user = profile

  // Return user model
  return done(null, user)
}),
)

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

module.exports = passport
