(function() {
  var ReadTakeOption, Tuple, TupleSpace, path;

  path = require('path');

  Tuple = require(path.join(__dirname, 'tuple'));

  module.exports = TupleSpace = (function() {
    function TupleSpace(name) {
      this.name = name != null ? name : 'noname';
      this.tuples = [];
      this.callbacks = [];
      this.__defineGetter__('size', function() {
        return this.tuples.length;
      });
    }

    TupleSpace.prototype.option = function(opts) {
      return new ReadTakeOption(this, opts);
    };

    TupleSpace.prototype.write = function(tuple, options) {
      var c, called, i, taked, _i, _j, _ref;
      if (options == null) {
        options = {
          expire: Tuple.DEFAULT.expire
        };
      }
      if (!Tuple.isHash(tuple) && !(tuple instanceof Tuple)) {
        return;
      }
      if (!(tuple instanceof Tuple)) {
        tuple = new Tuple(tuple);
      }
      tuple.expire = typeof options.expire === 'number' && options.expire > 0 ? options.expire : Tuple.DEFAULT.expire;
      tuple.from = options.from;
      called = [];
      taked = false;
      for (i = _i = 0, _ref = this.callbacks.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        c = this.callbacks[i];
        if (c.tuple.match(tuple)) {
          if (c.type === 'take' || c.type === 'read') {
            called.push(i);
          }
          (function(c) {
            return setImmediate(function() {
              return c.callback(null, tuple);
            });
          })(c);
          if (c.type === 'take') {
            taked = true;
            break;
          }
        }
      }
      for (_j = called.length - 1; _j >= 0; _j += -1) {
        i = called[_j];
        this.callbacks.splice(i, 1);
      }
      if (!taked) {
        return this.tuples.push(tuple);
      }
    };

    TupleSpace.prototype.create_callback_id = function() {
      return Date.now() - Math.random();
    };

    TupleSpace.prototype.read = function(tuple, callback) {
      return this.option({}).read(tuple, callback);
    };

    TupleSpace.prototype.take = function(tuple, callback) {
      return this.option({}).take(tuple, callback);
    };

    TupleSpace.prototype.watch = function(tuple, callback) {
      var id;
      if (typeof callback !== 'function') {
        return;
      }
      if (!Tuple.isHash(tuple) && !(tuple(instance(Tuple)))) {
        setImmediate(function() {
          return callback('argument_error');
        });
        return;
      }
      if (!(tuple instanceof Tuple)) {
        tuple = new Tuple(tuple);
      }
      id = this.create_callback_id();
      this.callbacks.unshift({
        id: id,
        type: 'watch',
        tuple: tuple,
        callback: callback
      });
      return id;
    };

    TupleSpace.prototype.cancel = function(id) {
      var c, i, _i, _ref;
      if (id == null) {
        return;
      }
      for (i = _i = 0, _ref = this.callbacks.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        c = this.callbacks[i];
        if (id === c.id) {
          setImmediate(function() {
            return c.callback('cancel', null);
          });
          this.callbacks.splice(i, 1);
          return;
        }
      }
    };

    TupleSpace.prototype.check_expire = function() {
      var expires, i, _i, _j, _ref;
      expires = [];
      for (i = _i = 0, _ref = this.tuples.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (this.tuples[i].expire_at < Date.now() / 1000) {
          expires.push(i);
        }
      }
      for (_j = expires.length - 1; _j >= 0; _j += -1) {
        i = expires[_j];
        this.tuples.splice(i, 1);
      }
      return expires.length;
    };

    return TupleSpace;

  })();

  ReadTakeOption = (function() {
    var DEFAULT;

    DEFAULT = {
      sort: 'stack'
    };

    function ReadTakeOption(ts, opts) {
      var k, v;
      this.ts = ts;
      this.opts = opts != null ? opts : {};
      for (k in DEFAULT) {
        v = DEFAULT[k];
        if (!this.opts.hasOwnProperty(k)) {
          this.opts[k] = v;
        }
      }
    }

    ReadTakeOption.prototype.read = function(tuple, callback) {
      var i, id, seq, t, _i, _len;
      if (typeof callback !== 'function') {
        return;
      }
      if (!Tuple.isHash(tuple) && !(tuple instanceof Tuple)) {
        setImmediate(function() {
          return callback('argument_error');
        });
        return null;
      }
      if (!(tuple instanceof Tuple)) {
        tuple = new Tuple(tuple);
      }
      seq = (function() {
        var _i, _j, _ref, _ref1, _results, _results1;
        switch (this.opts.sort) {
          case 'queue':
            return (function() {
              _results = [];
              for (var _i = 0, _ref = this.ts.size - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
              return _results;
            }).apply(this);
          case 'stack':
            return (function() {
              _results1 = [];
              for (var _j = _ref1 = this.ts.size - 1; _ref1 <= 0 ? _j <= 0 : _j >= 0; _ref1 <= 0 ? _j++ : _j--){ _results1.push(_j); }
              return _results1;
            }).apply(this);
        }
      }).call(this);
      for (_i = 0, _len = seq.length; _i < _len; _i++) {
        i = seq[_i];
        t = this.ts.tuples[i];
        if (tuple.match(t)) {
          setImmediate(function() {
            return callback(null, t);
          });
          return;
        }
      }
      id = this.ts.create_callback_id();
      this.ts.callbacks.push({
        type: 'read',
        callback: callback,
        tuple: tuple,
        id: id
      });
      return id;
    };

    ReadTakeOption.prototype.take = function(tuple, callback) {
      var i, id, seq, t, _i, _len;
      if (typeof callback !== 'function') {
        return;
      }
      if (!Tuple.isHash(tuple) && !(tuple instanceof Tuple)) {
        setImmediate(function() {
          return callback('argument_error');
        });
        return null;
      }
      if (!(tuple instanceof Tuple)) {
        tuple = new Tuple(tuple);
      }
      seq = (function() {
        var _i, _j, _ref, _ref1, _results, _results1;
        switch (this.opts.sort) {
          case 'queue':
            return (function() {
              _results = [];
              for (var _i = 0, _ref = this.ts.size - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
              return _results;
            }).apply(this);
          case 'stack':
            return (function() {
              _results1 = [];
              for (var _j = _ref1 = this.ts.size - 1; _ref1 <= 0 ? _j <= 0 : _j >= 0; _ref1 <= 0 ? _j++ : _j--){ _results1.push(_j); }
              return _results1;
            }).apply(this);
        }
      }).call(this);
      for (_i = 0, _len = seq.length; _i < _len; _i++) {
        i = seq[_i];
        t = this.ts.tuples[i];
        if (tuple.match(t)) {
          setImmediate(function() {
            return callback(null, t);
          });
          this.ts.tuples.splice(i, 1);
          return;
        }
      }
      id = this.ts.create_callback_id();
      this.ts.callbacks.push({
        type: 'take',
        callback: callback,
        tuple: tuple,
        id: id
      });
      return id;
    };

    return ReadTakeOption;

  })();

}).call(this);
