#!/usr/bin/env coffee

path     = require 'path'
optparse = require 'optparse'

unless process.env.DEBUG
  process.env.DEBUG = "linda*"

parser = new optparse.OptionParser [
  ['-h', '--help', 'show help']
  ['-p', '--port [NUMBER]', 'TCP Port']
]

config =
  port: process.env.PORT or 8931

parser.on 'help', ->
  package_json = require "#{__dirname}/../package.json"
  parser.banner = """
  linda-server v#{package_json.version} - #{package_json.homepage}

  Usage:
    % linda-server
    % linda-server --port 8931
    % DEBUG=* linda-server
  """
  console.log parser.toString()
  process.exit 0

parser.on 'port', (opt, port) ->
  config.port = port

parser.parse process.argv

app = require path.resolve __dirname, 'linda-server/app.coffee'
app.get('server').listen config.port

console.log """
server start => http://localhost:#{config.port}
"""
