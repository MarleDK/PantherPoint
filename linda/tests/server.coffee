http = require 'http'
url  = require 'url'
events = require 'eventemitter2'

module.exports = class TestServer extends events.EventEmitter2

  constructor: ->
    @app = http.createServer (req, res) =>
      _url = url.parse(decodeURI(req.url), true)
      if _url.pathname is '/'
        res.writeHead 200
        res.end 'linda test server'

      @emit 'request', req

    @io = require('socket.io').listen(@app)

    @linda = require('../').Server.listen(io: @io, server: @app)

  listen: (@port) ->
    @app.listen(@port)
    return @

  close: ->
    @app.close()
    return @
