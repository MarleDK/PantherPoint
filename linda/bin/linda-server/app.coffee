'use strict'

path    = require 'path'
debug   = require('debug')('linda-server:app')
express = require 'express'

## config ##
config       = require path.resolve __dirname, 'config.json'
package_json = require path.resolve __dirname, '../../package.json'
process.env.PORT ||= 3000


## express modules
bodyParser   = require 'body-parser'


## server setup ##
module.exports = app = express()
app.disable 'x-powered-by'
app.set 'views', path.resolve(__dirname, 'views')
app.set 'view engine', 'jade'
app.use express.static path.resolve __dirname, 'public'
app.use bodyParser.urlencoded(extended: true)

http = require('http').Server(app)
io = require('socket.io')(http)
linda = require(path.resolve __dirname, '../../').Server.listen(io: io, server: http)
app.set 'socket.io', io
app.set 'config', config
app.set 'package', package_json
app.set 'server', http
app.set 'linda', linda

## load controllers, models, socket.io ##
components =
  models:      [ ]
  controllers: [ 'main', 'api' ]
  events:      [ 'keepalive' ]

for type, items of components
  for item in items
    debug "load #{type}/#{item}"
    require(path.resolve __dirname, type, item)(app)


if process.argv[1] isnt __filename
  return   # if load as a module, do not start HTTP server

## start server ##
http.listen process.env.PORT, ->
  debug "server start - port:#{process.env.PORT}"
