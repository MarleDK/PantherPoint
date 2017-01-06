debug   = require('debug')('linda-server:events:keepalive')
request = require 'request'

module.exports = (app) ->

  return unless /^https?:\/\/.+/.test process.env.HEROKU_URL

  setInterval ->
    debug 'ping'
    url = "#{process.env.HEROKU_URL}?keepalive=#{Date.now()}"
    request.head url, (err, res) ->
      if !err and res.statusCode is 200
        debug 'pong'
  , 60 * 1000 * 20  # 20 min
