## linda client for webbrowser

class LindaClient
  connect: (@io) ->
    return @

  tuplespace: (name) ->
    return new TupleSpace @, name

class TupleSpace

  constructor: (@linda, @name) ->
    @watch_callback_ids = {}
    @io_callbacks = []
    @linda.io.on 'disconnect', =>
      @remove_io_callbacks()

  create_callback_id: ->
    return Date.now() - Math.random()

  option: (opt) ->
    return new ReadTakeOption(@, opt)

  create_watch_callback_id: (tuple) ->
    key = JSON.stringify tuple
    return @watch_callback_ids[key] or
      @watch_callback_ids[key] = @create_callback_id()

  remove_io_callbacks: ->
    for c in @io_callbacks
      @linda.io.removeListener c.name, c.listener
    @io_callbacks = []

  write: (tuple, options={expire: null}) ->
    data = { tuplespace: @name, tuple: tuple, options: options }
    @linda.io.emit '__linda_write', data

  take: (tuple, callback) ->
    return @option({}).take tuple, callback

  read: (tuple, callback) ->
    return @option({}).read tuple, callback

  watch: (tuple, callback) ->
    return if typeof callback isnt 'function'
    id = @create_watch_callback_id tuple
    name = "__linda_watch_#{id}"
    listener = (err, tuple) ->
      callback err, tuple
    @io_callbacks.push {name: name, listener: listener}
    @linda.io.on name, listener
    @linda.io.emit '__linda_watch', {tuplespace: @name, tuple: tuple, id: id}
    return id

  cancel: (id) ->
    if @linda.io.connected
      @linda.io.emit '__linda_cancel', {tuplespace: @name, id: id}
    setTimeout =>
      for i in [(@io_callbacks.length-1)..0]
        c = @io_callbacks[i]
        if c.name.match(new RegExp "_#{id}$")
          @linda.io.removeListener c.name, c.listener
          @io_callbacks.splice i, 1
    , 100

class ReadTakeOption
  DEFAULT =
    sort: 'stack'

  constructor: (@ts, @opts={}) ->
    for k,v of DEFAULT
      unless @opts.hasOwnProperty k
        @opts[k] = v

  read: (tuple, callback) ->
    return if typeof callback isnt 'function'
    id = @ts.create_callback_id()
    name = "__linda_read_#{id}"
    listener = (err, tuple) ->
      callback err, tuple
    @ts.io_callbacks.push {name: name, listener: listener}
    @ts.linda.io.once name, listener
    @ts.linda.io.emit '__linda_read', {tuplespace: @ts.name, tuple: tuple, id: id, options: @opts}
    return id

  take: (tuple, callback) ->
    return if typeof callback isnt 'function'
    id = @ts.create_callback_id()
    name = "__linda_take_#{id}"
    listener = (err, tuple) ->
      callback err, tuple
    @ts.io_callbacks.push {name: name, listener: listener}
    @ts.linda.io.once name, listener
    @ts.linda.io.emit '__linda_take', {tuplespace: @ts.name, tuple: tuple, id: id, options: @opts}
    return id

if window?
  window.Linda = LindaClient
else if module?.exports?
  module.exports = LindaClient
