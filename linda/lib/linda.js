(function() {
  var Client, Linda, Tuple, TupleSpace, debug, events, fs, http, path, request, socketio, url,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

  Linda = (function(_super) {
    __extends(Linda, _super);

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
          var name, space, _ref;
          debug("TupleSpace\tcheck expire");
          _ref = _this.spaces;
          for (name in _ref) {
            space = _ref[name];
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
          var listener, _i, _len, _ref, _results, _url;
          _url = url.parse(decodeURI(req.url), true);
          if (_url.pathname === "/linda/linda.js") {
            debug("GET\t" + _url.pathname);
            res.setHeader('Content-Type', 'application/javascript');
            res.writeHead(200);
            res.end(_this.client_js_code);
            return;
          }
          _ref = _this.oldListeners;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            listener = _ref[_i];
            _results.push(listener.call(_this.server, req, res));
          }
          return _results;
        };
      })(this));
      this.io.sockets.on('connection', (function(_this) {
        return function(socket) {
          var cids, info, watch_cids, _ref;
          cids = {};
          info = {
            from: socket.handshake.headers['x-forwarded-for'] || ((_ref = socket.handshake.address) != null ? _ref.address : void 0)
          };
          socket.on('__linda_write', function(data) {
            var _ref1;
            if ((_ref1 = data.options) != null) {
              _ref1.from = info.from;
            }
            _this.tuplespace(data.tuplespace).write(data.tuple, data.options);
            debug("write\t" + (JSON.stringify(data)) + " from " + info.from);
            return _this.emit('write', data);
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
