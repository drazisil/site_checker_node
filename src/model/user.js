function User(profile, accessToken) {
  this.githubId = profile.id
  this.picture = profile.avatar_url
  this.displayName = profile.name
  this.email = profile.email
  this.login = profile.login
  this.accessToken = accessToken
  this.jwt = ''
  return this
}

module.exports = User
