// server.js is the starting point of the host process:
//
// `node server.js` 
var express = require('express')
  , http = require('http')
  , colors = require('colors')
  , socket = require('socket.io');

// create an configure:
//
// - express webserver
// - socket.io socket communication from/to browser
var app = express()
  , server = http.createServer(app)
  , io = socket.listen(server);

app.use(require('body-parser').json());
app.use(express['static'](__dirname + '/'));

app.set('view engine', 'jade');
app.set('views', __dirname + '/app/views');

console.log('1. -> Configure routes'.cyan);
require('./app/routes').actions(app);

// START LISTENING
var port = 3000;
console.log(colors.cyan('\nStarting server on port ' + port));
server.listen(port);