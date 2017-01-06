process.env.NODE_ENV = 'test'

path = require 'path'
assert = require 'assert'
async = require 'async'

Linda = require(path.resolve())
TupleSpace = Linda.TupleSpace
Tuple = Linda.Tuple


describe 'instance of "TupleSpace"', ->

  it 'should have property "name"', ->
    assert.equal new TupleSpace("foo").name, 'foo'

  it 'should have property "callbacks"', ->
    ts = new TupleSpace()
    assert.ok ts.hasOwnProperty('callbacks')
    assert.ok ts.callbacks instanceof Array

  it 'should have method "create_callback_id"', ->
    assert.equal typeof new TupleSpace()['create_callback_id'], 'function'

  it 'should have property "size"', ->
    assert.ok new TupleSpace().hasOwnProperty('size')

  describe 'property "size"', ->

    it 'should return number of Tuples', ->
      assert.equal new TupleSpace().size, 0

  it 'should have method "write"', ->
    assert.equal typeof new TupleSpace()['write'], 'function'

  it 'should have method "cancel"', ->
    assert.equal typeof new TupleSpace()['cancel'], 'function'

  it 'should have method "check_expire"', ->
    assert.equal typeof new TupleSpace()['check_expire'], 'function'


  describe 'method "write"', ->

    it 'should store HashTuples', ->
      ts = new TupleSpace("foo")
      assert.equal ts.size, 0
      ts.write {a:1, b:2}
      ts.write {a:1, b:3}
      assert.equal ts.size, 2

    it 'should not store if not valid Tuple', ->
      ts = new TupleSpace("foo")
      assert.equal ts.size, 0
      ts.write "foobar"
      ts.write [1,2]
      ts.write null
      assert.equal ts.size, 0


  it 'should have method "read"', ->
    assert.equal typeof new TupleSpace()['read'], 'function'

  it 'should have method "take"', ->
    assert.equal typeof new TupleSpace()['take'], 'function'

  describe 'method "read" with callback', ->

    it 'should return cancel_id', ->
      ts = new TupleSpace
      cid = ts.read {}, ->
      assert.ok cid > 0

    it 'should return matched Tuple', (done) ->
      ts = new TupleSpace
      ts.write {a:1, b:2, c:3}
      ts.read {a:1, c:3}, (err, tuple) ->
        assert.deepEqual tuple.data, {a:1, b:2, c:3}
        done()

    it 'should wait if Tuple not found', (done) ->
      ts = new TupleSpace
      async.parallel [
        (async_done) ->
          ts.read {a:1, d:4}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2, c:3, d:4}
            async_done(null, tuple)
        (async_done) ->
          ts.read {sensor: "light"}, (err, tuple) ->
            assert.deepEqual tuple.data, {sensor: "light", value: 80}
            async_done(null, tuple)
        (async_done) ->
          ts.read {}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2, c:3}
            async_done(null, tuple)
      ], (err, results) ->
        done()

      assert.equal ts.callbacks.length, 3
      assert.equal ts.size, 0
      ts.write {a:1, b:2, c:3}
      ts.write {a:1, b:2, c:3, d:4}
      ts.write {sensor: "light", value: 80}
      assert.equal ts.callbacks.length, 0
      assert.equal ts.size, 3

    it 'should return matched Tuple if using queue mode', (done) ->
      ts = new TupleSpace()
      ts.write {foo: 'bar', n: 1}
      ts.write {foo: 'bar', n: 2}
      ts.write {foo: 'bar', n: 3}
      ts.option({sort: 'queue'}).read {foo: 'bar'}, (err, tuple) ->
        assert.deepEqual tuple.data, {foo: 'bar', n: 1}
        assert.equal ts.size, 3
        ts.read {foo: 'bar'}, (err, tuple) ->
          assert.deepEqual tuple.data, {foo: 'bar', n: 3}
          assert.equal ts.size, 3
          done()

    it 'should not return Tuple if canceled', (done) ->
      ts = new TupleSpace
      cid = null
      async.parallel [
        (async_done) ->
          cid_ = ts.read {a:1}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2}
            async_done(null, cid_)
        (async_done) ->
          cid = ts.read {}, (err, tuple) ->
            assert.equal err, "cancel"
            async_done(null, cid)
      ], (err, callback_ids) ->
        assert.notEqual callback_ids[0], callback_ids[1]
        done()

      assert.equal ts.callbacks.length, 2
      ts.cancel cid
      assert.equal ts.callbacks.length, 1
      ts.write {a:1, b:2}
      assert.equal ts.callbacks.length, 0

  describe 'method "take" with callback', ->

    it 'should return cancel_id', ->
      ts = new TupleSpace
      cid = ts.take {}, ->
      assert.ok cid > 0

    it 'should return matched Tuple and delete', (done) ->
      ts = new TupleSpace
      ts.write {a:1, b:2, c:3}
      ts.take {a:1, c:3}, (err, tuple) ->
        assert.deepEqual tuple.data, {a:1, b:2, c:3}
        assert.equal ts.size, 0
        done()

    it 'should return matched Tuple and delete if using queue mode', (done) ->
      ts = new TupleSpace()
      ts.write {n: 1, foo: 'bar'}
      ts.write {n: 2, foo: 'bar'}
      ts.write {n: 3, foo: 'bar'}
      ts.option({sort: 'queue'}).take {foo: 'bar'}, (err, tuple) ->
        assert.deepEqual tuple.data, {n: 1, foo: 'bar'}
        ts.take {foo: 'bar'}, (err, tuple) ->
          assert.deepEqual tuple.data, {n: 3, foo: 'bar'}
          assert.equal ts.size, 1
          done()

    it 'should wait if Tuple not found', (done) ->
      ts = new TupleSpace
      async.parallel [
        (async_done) ->
          ts.take {a:1, b:2}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2, c:3}
            async_done(null, tuple)
        (async_done) ->
          ts.take {foo: "bar"}, (err, tuple) ->
            assert.deepEqual tuple.data, {foo: "bar"}
            async_done(null, tuple)
        (async_done) ->
          ts.take {a:1, b:2}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2, c:300}
            async_done(null, tuple)
      ], (err, results) ->
        assert.equal ts.callbacks.length, 0
        done()

      assert.equal ts.callbacks.length, 3
      assert.equal ts.size, 0
      ts.write {a:1, b:2, c:3}
      ts.write {foo: "bar"}
      ts.write {a:1, b:2, c:300}
      assert.equal ts.callbacks.length, 0
      assert.equal ts.size, 0

    it 'should not return Tuple if cacneled', (done) ->
      ts = new TupleSpace
      cid = null
      async.parallel [
        (async_done) ->
          cid_ = ts.take {a:1}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2}
            async_done(null, cid_)
        (async_done) ->
          cid = ts.take {}, (err, tuple) ->
            assert.equal err, "cancel"
            async_done(null, cid)
      ], (err, callback_ids) ->
        assert.notEqual callback_ids[0], callback_ids[1]
        done()

      assert.equal ts.callbacks.length, 2
      ts.cancel cid
      assert.equal ts.callbacks.length, 1
      ts.write {a:1, b:2}
      assert.equal ts.callbacks.length, 0

  describe 'method "watch"', ->

    it 'should return cancel_id', ->
      ts = new TupleSpace
      cid = ts.watch {}, ->
      assert.ok cid > 0

    it 'should return Tuple when write(tuple)', (done) ->
      ts = new TupleSpace

      results = []
      ts.watch {a:1, b:2}, (err, tuple) ->
        results.push tuple.data
        if results.length is 2
          assert.deepEqual results,
                              [{a:1, b:2, c:3}, {a:1, b:2, name: "shokai"}]
          done()

      ts.write {a:1, b:2, c:3}
      ts.write {foo: "bar"}
      ts.write {a:1}
      ts.write {a:1, b:2, name: "shokai"}

    it 'should not return Tuple if canceled', (done) ->
      ts = new TupleSpace
      cid = null
      async.parallel [
        (async_done) ->
          cid_ = ts.watch {a:1}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2}
            async_done(null, cid_)
        (async_done) ->
          cid = ts.watch {}, (err, tuple) ->
            assert.equal err, "cancel"
            async_done(null, cid)
      ], (err, callback_ids) ->
        assert.notEqual callback_ids[0], callback_ids[1]
        done()

      assert.equal ts.callbacks.length, 2
      ts.cancel cid
      assert.equal ts.callbacks.length, 1
      ts.write {a:1, b:2}

  describe 'method "check_expire"', ->

    it 'should delete expired tuples', (done) ->
      @timeout(5000)
      ts = new TupleSpace
      ts.write {a:1, b:2}, {expire: 3}
      ts.write {a:1, b:2, c:3}, {expire: 1}
      ts.write new Tuple({name: "shokai"}), {expire: 3}
      ts.write {foo: "bar"}

      assert.equal ts.size, 4

      async.parallel [
        (async_done) ->
          ts.read {a:1, b:2, c:3}, (err, tuple) ->
            assert.deepEqual tuple.data, {a:1, b:2, c:3}
            async_done(null, tuple)
        (async_done) ->
          setTimeout ->
            ts.check_expire()
            assert.equal ts.size, 3
            ts.read {a:1, b:2}, (err, tuple) ->
              assert.deepEqual tuple.data, {a:1, b:2}
              async_done(null, tuple)
          , 2000
        (async_done) ->
          setTimeout ->
            ts.check_expire()
            assert.equal ts.size, 1
            ts.read {}, (err, tuple) ->
              assert.deepEqual tuple.data, {foo: "bar"}
              async_done(null, tuple)
          , 4000
      ], (err, results) ->
        done()
