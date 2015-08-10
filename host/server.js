// server.js is the starting point of the host process:
//
// `node server.js` 
var express = require('express')
  , http = require('http')
  , colors = require('colors')
  , socket = require('socket.io')
  , msgbus = require('servicebus').bus();

// create an configure:
//
// - express webserver
// - socket.io socket communication from/to browser
var app = express()
  , server = http.createServer(app)
  , io = socket.listen(server);

console.log('1. -> Configure message bus connection'.cyan);
msgbus.subscribe("viewmodels", function (evt) {
    console.log(colors.magenta('\nsocket.io -- publish event ' + evt.event + ' to browser'));
    io.sockets.emit('events', evt);
});

// SETUP COMMUNICATION CHANNELS

// on receiving __commands__ from browser via socket.io emit them on the ĥub module (which will 
// forward it to message bus (redis pubsub))
console.log('2. -> Configure WebSockets connection'.cyan);
io.sockets.on('connection', function (socket) {
    console.log(colors.magenta(' -- connects to socket.io'));

    socket.on('commands', function (data) {
        console.log(colors.magenta('\n -- sends command ' + data.command + ':'));
        console.log(data);

        msgbus.publish("commands", data);
    });
});

// START LISTENING
var port = 3001;
console.log(colors.cyan('\nStarting server on port ' + port));
server.listen(port);