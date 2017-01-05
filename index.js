var express = require('express')
var app = express()
var path    = require("path")

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/examble.html'))
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
