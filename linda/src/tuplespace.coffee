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

  replace: (tuple1, tuple2, options={expire: Tuple.DEFAULT.expire}) ->
    return if !Tuple.isHash(tuple2) and !(tuple2 instanceof Tuple)
    return if !Tuple.isHash(tuple1) and !(tuple1 instanceof Tuple)
    tuple2 = new Tuple(tuple2) unless tuple2 instanceof Tuple
    tuple1 = new Tuple(tuple1) unless tuple1 instanceof Tuple
    tuple2.expire =
      if typeof options.expire is 'number' and options.expire > 0
        options.expire
      else
        Tuple.DEFAULT.expire
    tuple2.from = options.from
    called = []
    taked = false
    for i in [0...@callbacks.length]
      c = @callbacks[i]
      if c.tuple.match tuple2
        called.push i if c.type is 'take' or c.type is 'read'
        do (c) ->
          setImmediate -> c.callback(null, tuple2)
        if c.type is 'take'
          taked = true
          break
    for i in called by -1
      @callbacks.splice i, 1
    for i in [0...@tuples.length]
      if tuple1.match @tuples[i]
        @tuples.splice i, 1
        break;

    @tuples.push tuple2 unless taked

  create_callback_id: ->
    return Date.now() - Math.random()

  read: (tuple, callback) ->
    return @option({}).read tuple, callback

  readp: (tuple, callback) ->
    return @option({}).readp tuple, callback

  readAll: (tuple, callback) ->
    return @option({}).readAll tuple, callback

  take: (tuple, callback) ->
    return @option({}).take tuple, callback

  takep: (tuple, callback) ->
    return @option({}).takep tuple, callback

  takeAll: (tuple, callback) ->
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

  readp: (tuple, callback) ->
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
    setImmediate -> callback("tuple does not exist", null)
    return

  readAll: (tuple, callback) ->
    return unless typeof callback is 'function'
    if !Tuple.isHash(tuple) and !(tuple instanceof Tuple)
      setImmediate -> callback('argument_error')
      return null
    tuple = new Tuple(tuple) unless tuple instanceof Tuple
    seq = switch @opts.sort
      when 'queue' then [0..@ts.size-1]
      when 'stack' then [@ts.size-1..0]
    tupList = []
    for i in seq
      t = @ts.tuples[i]
      if tuple.match t
        tupList.push t
    setImmediate -> callback(null, tupList)
    return

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

  takep: (tuple, callback) ->
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
    setImmediate -> callback("tuple does not exist", null)
    return

  takeAll: (tuple, callback) ->
    return unless typeof callback is 'function'
    if !Tuple.isHash(tuple) and !(tuple instanceof Tuple)
      setImmediate -> callback('argument_error')
      return null
    tuple = new Tuple(tuple) unless tuple instanceof Tuple
    seq = switch @opts.sort
      when 'queue' then [0..@ts.size-1]
      when 'stack' then [@ts.size-1..0]
    tupList = []
    for i in seq
      t = @ts.tuples[i]
      if tuple.match t
        tupList.push t
        @ts.tuples.splice i, 1  # delete tuple
    setImmediate -> callback(null, tupList)
    return
