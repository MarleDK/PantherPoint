path = require 'path'
Tuple = require path.join(__dirname, 'tuple')

module.exports = class TupleSpace
  constructor: (@name='noname') ->
    @tuples = []
    @callbacks = []
    @__defineGetter__ 'size', ->
      return @tuples.length

  option: (opts) ->
    return new ReadTakeOption @, opts

  write: (tuple, options={expire: Tuple.DEFAULT.expire}) ->
    return if !Tuple.isHash(tuple) and !(tuple instanceof Tuple)
    tuple = new Tuple(tuple) unless tuple instanceof Tuple
    tuple.expire =
      if typeof options.expire is 'number' and options.expire > 0
        options.expire
      else
        Tuple.DEFAULT.expire
    tuple.from = options.from
    called = []
    taked = false
    for i in [0...@callbacks.length]
      c = @callbacks[i]
      if c.tuple.match tuple
        called.push i if c.type is 'take' or c.type is 'read'
        do (c) ->
          setImmediate -> c.callback(null, tuple)
        if c.type is 'take'
          taked = true
          break
    for i in called by -1
      @callbacks.splice i, 1
    @tuples.push tuple unless taked

  create_callback_id: ->
    return Date.now() - Math.random()

  read: (tuple, callback) ->
    return @option({}).read tuple, callback

  take: (tuple, callback) ->
    return @option({}).take tuple, callback

  watch: (tuple, callback) ->
    return unless typeof callback is 'function'
    if !Tuple.isHash(tuple) and !(tuple instance Tuple)
      setImmediate -> callback('argument_error')
      return
    tuple = new Tuple(tuple) unless tuple instanceof Tuple
    id = @create_callback_id()
    @callbacks.unshift
      id: id
      type: 'watch'
      tuple: tuple
      callback: callback
    return id

  cancel: (id) ->
    return unless id?
    for i in [0...@callbacks.length]
      c = @callbacks[i]
      if id is c.id
        setImmediate -> c.callback('cancel', null)
        @callbacks.splice i, 1
        return

  check_expire: ->
    expires = []
    for i in [0...@tuples.length]
      if @tuples[i].expire_at < Date.now() / 1000
        expires.push i
    for i in expires by -1
      @tuples.splice i, 1
    return expires.length


class ReadTakeOption
  DEFAULT =
    sort: 'stack'

  constructor: (@ts, @opts={}) ->
    for k,v of DEFAULT
      unless @opts.hasOwnProperty k
        @opts[k] = v

  read: (tuple, callback) ->
    return unless typeof callback is 'function'
    if !Tuple.isHash(tuple) and !(tuple instanceof Tuple)
      setImmediate -> callback('argument_error')
      return null
    tuple = new Tuple(tuple) unless tuple instanceof Tuple
    seq = switch @opts.sort
      when 'queue' then [0..@ts.size-1]
      when 'stack' then [@ts.size-1..0]
    for i in seq
      t = @ts.tuples[i]
      if tuple.match t
        setImmediate -> callback(null, t)
        return
    id = @ts.create_callback_id()
    @ts.callbacks.push {type: 'read', callback: callback, tuple: tuple, id: id}
    return id

  take: (tuple, callback) ->
    return unless typeof callback is 'function'
    if !Tuple.isHash(tuple) and !(tuple instanceof Tuple)
      setImmediate -> callback('argument_error')
      return null
    tuple = new Tuple(tuple) unless tuple instanceof Tuple
    seq = switch @opts.sort
      when 'queue' then [0..@ts.size-1]
      when 'stack' then [@ts.size-1..0]
    for i in seq
      t = @ts.tuples[i]
      if tuple.match t
        setImmediate -> callback(null, t)
        @ts.tuples.splice i, 1  # delete tuple
        return
    id = @ts.create_callback_id()
    @ts.callbacks.push {type: 'take', callback: callback, tuple: tuple, id: id}
    return id
