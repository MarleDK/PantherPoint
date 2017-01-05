http    = require 'http'
path    = require 'path'
url     = require 'url'
fs      = require 'fs'
request = require 'request'
events  = require 'eventemitter2'
socketio = require 'socket.io'
debug = require('debug')('linda')

TupleSpace = require path.join(__dirname, 'tuplespace')
Tuple = require path.join(__dirname, 'tuple')
Client = require path.join(__dirname, 'linda-client')

module.exports.TupleSpace = TupleSpace
module.exports.Tuple = Tuple
module.exports.Client = Client

class Linda extends events.EventEmitter2
  constructor: ->
    @spaces = {}

    fs.readFile path.join(__dirname, 'linda-client.js'),
    (err, data) =>
      throw new Error "client js load error" if err
      @client_js_code = data

    setInterval =>
      debug "TupleSpace\tcheck expire"
      for name, space of @spaces
        if space?
          space.check_expire()
      debug "TupleSpace\tcheck expire done"
    , 60*3*1000 # 3min

  tuplespace: (name) ->
    return @spaces[name] or
           @spaces[name] = new TupleSpace(name)

  listen: (opts = {io: null, server: null}) ->
    unless opts.io?
      throw new Error '"io" must be instance of Socket.IO'
    unless opts.server instanceof http.Server
      throw new Error '"server" must be instance of http.Server'
    @io = opts.io
    @server = opts.server

    @oldListeners = @server.listeners('request').splice(0)
    @server.removeAllListeners 'request'
    @server.on 'request', (req, res) =>  ## intercept requests
      _url = url.parse(decodeURI(req.url), true)
      if _url.pathname is "/linda/linda.js"
        debug "GET\t#{_url.pathname}"
        res.setHeader 'Content-Type', 'application/javascript'
        res.writeHead 200
        res.end @client_js_code
        return
      for listener in @oldListeners
        listener.call(@server, req, res)

    @io.sockets.on 'connection', (socket) =>
      cids = {}
      info = {
        from: (socket.handshake.headers['x-forwarded-for'] or
               socket.handshake.address?.address)
      }

      socket.on '__linda_write', (data) =>
        data.options?.from = info.from
        @tuplespace(data.tuplespace).write data.tuple, data.options
        debug "write\t#{JSON.stringify data} from #{info.from}"
        @emit 'write', data

      socket.on '__linda_take', (data) =>
        cid = @tuplespace(data.tuplespace).option(data.options).take data.tuple, (err, tuple) ->
          cid = null
          socket.emit "__linda_take_#{data.id}", err, tuple
        cids[data.id] = cid
        debug "take\t#{JSON.stringify data} from #{info.from}"
        @emit 'take', data
        socket.once 'disconnect', =>
          @tuplespace(data.tuplespace).cancel cid if cid

      socket.on '__linda_read', (data) =>
        cid = @tuplespace(data.tuplespace).option(data.options).read data.tuple, (err, tuple) ->
          cid = null
          socket.emit "__linda_read_#{data.id}", err, tuple
        cids[data.id] = cid
        debug "read\t#{JSON.stringify data} from #{info.from}"
        @emit 'read', data
        socket.once 'disconnect', =>
          @tuplespace(data.tuplespace).cancel cid if cid

      watch_cids = {}
      socket.on '__linda_watch', (data) =>
        debug "watch\t#{JSON.stringify data} from #{info.from}"
        @emit 'watch', data
        return if watch_cids[data.id]  # not watch if already watching
        watch_cids[data.id] = true
        cid = @tuplespace(data.tuplespace).watch data.tuple, (err, tuple) ->
          socket.emit "__linda_watch_#{data.id}", err, tuple
        cids[data.id] = cid
        socket.once 'disconnect', =>
          @tuplespace(data.tuplespace).cancel cid if cid

      socket.on '__linda_cancel', (data) =>
        debug "cancel\t#{JSON.stringify data} from #{info.from}"
        @emit 'cancel', data
        @tuplespace(data.tuplespace).cancel cids[data.id]
        watch_cids[data.id] = false

    return @


module.exports.Server = new Linda
