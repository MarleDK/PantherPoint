var path = require('path')

var express = require('express')
var exphbs  = require('express-handlebars');
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var linda = require(path.resolve(__dirname, 'linda')).Server.listen({ io: io, server: http})
var jQuery = require('jquery')
const timeToKeepAlive = 60*1000*3;
/*
  This file is the server running.
  It is responsible for exposing the files needed by other applications
  And it is hosting the tuplespaces
*/

/*
  This first block of code is making a tuplespace for all hosts,
  which hosts will connect to, recieve their screen code and
  use to show whether they are ready for new clients or not
*/
var hosts = linda.tuplespace('hosts');
hosts.write({type: 'nextRoom', room: 'a1k4'});

//This code block is responsible for keeping the 'nextRoom' tuple alive,
//since it would expire if no new host connected for around 5 min
var NextRoomeKeepAlive = function(){
  hosts.take({type: 'nextRoom'}, function(err, tuple){
    hosts.write({type: 'nextRoom', room: tuple.data.room})
  })
}
setInterval(NextRoomeKeepAlive, timeToKeepAlive)

//The rest of the code in this file is routing of specific files

app.engine('html', exphbs());
app.set('view engine', 'handlebars')

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'))
})

// Client
app.get('/client', function (req, res) {
  res.sendFile(path.join(__dirname + '/client/client.html'))
})


app.get('/client.js', function (req, res) {
  res.sendFile(path.join(__dirname + '/client/client.js'))
})

app.use('/apps',express.static('apps'))

// Host
app.get('/host', function (req, res) {
  res.sendFile(path.join(__dirname + '/host/host.html'))
})
app.get('/host.js', function (req, res) {
  res.sendFile(path.join(__dirname + '/host/host.js'))
})

//Apps
app.use('/apps',express.static('apps'))

/*
// Chat
app.get('/chat', function (req, res) {
  res.sendFile(path.join(__dirname + '/chat/index.html'))
})
app.get('/chat/messenger', function (req, res) {
  res.sendFile(path.join(__dirname + '/chat/message.html'))
})
app.get('/chat/:name', function (req, res) {
  res.render(path.join(__dirname + '/chat/chat.html'), {
    name: req.params.name
  });
})
*/
//Dev
app.get('/chat2', function (req, res) {
  res.sendFile(path.join(__dirname + '/chat.html'))
})

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
app.get('/bootstrap/bootstrap.js', function(req, res) {
  res.sendFile(path.join(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.min.js'));
});

http.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
