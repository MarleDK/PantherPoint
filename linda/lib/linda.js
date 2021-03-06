// Generated by CoffeeScript 1.12.2
(function() {
  var Client, Linda, Tuple, TupleSpace, debug, events, fs, http, path, request, socketio, url,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  http = require('http');

  path = require('path');

  url = require('url');

  fs = require('fs');

  request = require('request');

  events = require('eventemitter2');

  socketio = require('socket.io');

  debug = require('debug')('linda');

  TupleSpace = require(path.join(__dirname, 'tuplespace'));

  Tuple = require(path.join(__dirname, 'tuple'));

  Client = require(path.join(__dirname, 'linda-client'));

  module.exports.TupleSpace = TupleSpace;

  module.exports.Tuple = Tuple;

  module.exports.Client = Client;

  Linda = (function(superClass) {
    extend(Linda, superClass);

    function Linda() {
      this.spaces = {};
      fs.readFile(path.join(__dirname, 'linda-client.js'), (function(_this) {
        return function(err, data) {
          if (err) {
            throw new Error("client js load error");
          }
          return _this.client_js_code = data;
        };
      })(this));
      setInterval((function(_this) {
        return function() {
          var name, ref, space;
          debug("TupleSpace\tcheck expire");
          ref = _this.spaces;
          for (name in ref) {
            space = ref[name];
            if (space != null) {
              space.check_expire();
            }
          }
          return debug("TupleSpace\tcheck expire done");
        };
      })(this), 60 * 3 * 1000);
    }

    Linda.prototype.tuplespace = function(name) {
      return this.spaces[name] || (this.spaces[name] = new TupleSpace(name));
    };

    Linda.prototype.listen = function(opts) {
      if (opts == null) {
        opts = {
          io: null,
          server: null
        };
      }
      if (opts.io == null) {
        throw new Error('"io" must be instance of Socket.IO');
      }
      if (!(opts.server instanceof http.Server)) {
        throw new Error('"server" must be instance of http.Server');
      }
      this.io = opts.io;
      this.server = opts.server;
      this.oldListeners = this.server.listeners('request').splice(0);
      this.server.removeAllListeners('request');
      this.server.on('request', (function(_this) {
        return function(req, res) {
          var _url, i, len, listener, ref, results;
          _url = url.parse(decodeURI(req.url), true);
          if (_url.pathname === "/linda/linda.js") {
            debug("GET\t" + _url.pathname);
            res.setHeader('Content-Type', 'application/javascript');
            res.writeHead(200);
            res.end(_this.client_js_code);
            return;
          }
          ref = _this.oldListeners;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            listener = ref[i];
            results.push(listener.call(_this.server, req, res));
          }
          return results;
        };
      })(this));
      this.io.sockets.on('connection', (function(_this) {
        return function(socket) {
          var cids, info, ref, watch_cids;
          cids = {};
          info = {
            from: socket.handshake.headers['x-forwarded-for'] || ((ref = socket.handshake.address) != null ? ref.address : void 0)
          };
          socket.on('__linda_write', function(data) {
            var ref1;
            if ((ref1 = data.options) != null) {
              ref1.from = info.from;
            }
            _this.tuplespace(data.tuplespace).write(data.tuple, data.options);
            debug("write\t" + (JSON.stringify(data)) + " from " + info.from);
            return _this.emit('write', data);
          });
          socket.on('__linda_replace', function(data) {
            var ref1;
            if ((ref1 = data.options) != null) {
              ref1.from = info.from;
            }
            _this.tuplespace(data.tuplespace).replace(data.tuple1, data.tuple2, data.options);
            debug("replace\t" + (JSON.stringify(data)) + " from " + info.from);
            return _this.emit('replace', data);
          });
          socket.on('__linda_take', function(data) {
            var cid;
            cid = _this.tuplespace(data.tuplespace).option(data.options).take(data.tuple, function(err, tuple) {
              cid = null;
              return socket.emit("__linda_take_" + data.id, err, tuple);
            });
            cids[data.id] = cid;
            debug("take\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('take', data);
            return socket.once('disconnect', function() {
              if (cid) {
                return _this.tuplespace(data.tuplespace).cancel(cid);
              }
            });
          });
          socket.on('__linda_takeAll', function(data) {
            var cid;
            cid = _this.tuplespace(data.tuplespace).option(data.options).takeAll(data.tuple, function(err, tuple) {
              cid = null;
              return socket.emit("__linda_takeAll_" + data.id, err, tuple);
            });
            cids[data.id] = cid;
            debug("takeAll\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('takeAll', data);
            return socket.once('disconnect', function() {
              if (cid) {
                return _this.tuplespace(data.tuplespace).cancel(cid);
              }
            });
          });
          socket.on('__linda_takep', function(data) {
            var cid;
            cid = _this.tuplespace(data.tuplespace).option(data.options).takep(data.tuple, function(err, tuple) {
              cid = null;
              return socket.emit("__linda_takep_" + data.id, err, tuple);
            });
            cids[data.id] = cid;
            debug("takep\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('takep', data);
            return socket.once('disconnect', function() {
              if (cid) {
                return _this.tuplespace(data.tuplespace).cancel(cid);
              }
            });
          });
          socket.on('__linda_read', function(data) {
            var cid;
            cid = _this.tuplespace(data.tuplespace).option(data.options).read(data.tuple, function(err, tuple) {
              cid = null;
              return socket.emit("__linda_read_" + data.id, err, tuple);
            });
            cids[data.id] = cid;
            debug("read\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('read', data);
            return socket.once('disconnect', function() {
              if (cid) {
                return _this.tuplespace(data.tuplespace).cancel(cid);
              }
            });
          });
          socket.on('__linda_readAll', function(data) {
            var cid;
            cid = _this.tuplespace(data.tuplespace).option(data.options).readAll(data.tuple, function(err, tuple) {
              cid = null;
              return socket.emit("__linda_readAll_" + data.id, err, tuple);
            });
            cids[data.id] = cid;
            debug("readAll\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('readAll', data);
            return socket.once('disconnect', function() {
              if (cid) {
                return _this.tuplespace(data.tuplespace).cancel(cid);
              }
            });
          });
          socket.on('__linda_readp', function(data) {
            var cid;
            cid = _this.tuplespace(data.tuplespace).option(data.options).readp(data.tuple, function(err, tuple) {
              cid = null;
              return socket.emit("__linda_readp_" + data.id, err, tuple);
            });
            cids[data.id] = cid;
            debug("readp\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('readp', data);
            return socket.once('disconnect', function() {
              if (cid) {
                return _this.tuplespace(data.tuplespace).cancel(cid);
              }
            });
          });
          watch_cids = {};
          socket.on('__linda_watch', function(data) {
            var cid;
            debug("watch\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('watch', data);
            if (watch_cids[data.id]) {
              return;
            }
            watch_cids[data.id] = true;
            cid = _this.tuplespace(data.tuplespace).watch(data.tuple, function(err, tuple) {
              return socket.emit("__linda_watch_" + data.id, err, tuple);
            });
            cids[data.id] = cid;
            return socket.once('disconnect', function() {
              if (cid) {
                return _this.tuplespace(data.tuplespace).cancel(cid);
              }
            });
          });
          return socket.on('__linda_cancel', function(data) {
            debug("cancel\t" + (JSON.stringify(data)) + " from " + info.from);
            _this.emit('cancel', data);
            _this.tuplespace(data.tuplespace).cancel(cids[data.id]);
            return watch_cids[data.id] = false;
          });
        };
      })(this));
      return this;
    };

    return Linda;

  })(events.EventEmitter2);

  module.exports.Server = new Linda;

}).call(this);
