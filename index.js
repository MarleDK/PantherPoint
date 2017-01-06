var path = require('path')

var express = require('express')
var exphbs  = require('express-handlebars');
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var linda = require(path.resolve(__dirname, 'linda')).Server.listen({ io: io, server: http})
var jQuery = require('jquery')


app.engine('html', exphbs());
app.set('view engine', 'handlebars')

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'))
})

// Client
app.get('/client', function (req, res) {
  res.sendFile(path.join(__dirname + '/client/index.html'))
})

// Host
app.get('/host', function (req, res) {
  res.sendFile(path.join(__dirname + '/host/host.html'))
})

// Chat
app.get('/chat', function (req, res) {
  res.sendFile(path.join(__dirname + '/chat/index.html'))
})
app.get('/chat/:name', function (req, res) {
  res.render(path.join(__dirname + '/chat/chat.html'), {
    name: req.params.name
  });
})

//Dev
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname + '/tests.html'))
})

app.get('/tests', function (req, res) {
  res.sendFile(path.join(__dirname + '/tests.html'))
})

// Static
app.get('/index.css', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.css'))
})

app.get('/jquery/jquery.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/node_modules/jquery/dist/jquery.min.js'));
});

http.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
