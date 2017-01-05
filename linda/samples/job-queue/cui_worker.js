// var LindaClient = require('linda').Client
var LindaClient = require('../../').Client;
var socket = require('socket.io-client').connect('http://localhost:8931');

var linda = new LindaClient().connect(socket);
var ts = linda.tuplespace('jobqueue');

socket.on('connect', function(){
  console.log('connect!!!');
  work();
});

var work = function(){
  ts.take({type: 'request'}, function(err, tuple){
    var result = eval(tuple.data.query);
    console.log(tuple.data.query + " = " + result);
    ts.write({
      type: 'result',
      result: result
    });

    work()
  });
};
