var path = require('path')

var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var linda = require('linda').Server.listen({ io: io, server: http})
var jQuery = require('jquery')

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/chat.html'))
})

app.get('/jquery/jquery.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});

http.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
