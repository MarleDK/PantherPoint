var path = require('path')

var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var linda = require(path.resolve(__dirname, 'linda')).Server.listen({ io: io, server: http})
var jQuery = require('jquery')

//Usersites
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/chat.html'))
})

app.get('/host', function (req, res) {
  res.sendFile(path.join(__dirname + '/host/host.html'))
})

app.get('/client', function (req, res) {
  res.sendFile(path.join(__dirname + '/client/client.html'))
})

//Dev
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname + '/tests.html'))
})

app.get('/tests', function (req, res) {
  res.sendFile(path.join(__dirname + '/tests.html'))
})

//Resources
app.get('/index.css', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.css'))
})

app.get('/jquery/jquery.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});

http.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
