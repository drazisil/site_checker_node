var consumer

function init (config) {
  consumer = new oauth.OAuth(
    'http://www.github.com/oauth/request_token',
    'http://www.github.com/oauth/access_token',
    config.github_oauth_client_id,
    config.github_oauth_client_secret,
    '1.0A',
    'http://localhost:3000/auth/callback',
    'HMAC-SHA1'
  )
}

module.exports = {
  init: init,
  consumer: consumer
}
