// server.js is the starting point of the host process:
//
// `node server.js` 
var express = require('express')
  , http = require('http')
  , colors = require('colors')
  , socket = require('socket.io')
  , viewmodel = require('viewmodel')
  , msgbus = require('servicebus').bus();

// BOOTSTRAPPING
console.log('\nBOOTSTRAPPING:'.cyan);

var options = {
    denormalizerPath: __dirname + '/viewBuilders',
    repository: {
        type: 'inMemory', //'mongodb',
        dbName: 'cqrssample'
    },
    revisionGuardStore: {
        type: 'inMemory', //'mongodb',
        dbName: 'cqrssample'
    }
};

var app = express()
  , server = http.createServer(app)
  , io = socket.listen(server);

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(require('body-parser').json());
app.use(express['static'](__dirname + '/'));
app.use(allowCrossDomain);

console.log('1. -> Configure viewmodel'.cyan);
viewmodel.read(options.repository, function (err, repository) {

    var eventDenormalizer = require('cqrs-eventdenormalizer')(options);

    eventDenormalizer.defineEvent({
        correlationId: 'commandId',
        id: 'id',
        name: 'event',
        aggregateId: 'payload.id',
        payload: 'payload',
        revision: 'head.revision'
    });

    console.log('2. -> Configure eventdenormalizer'.cyan);
    eventDenormalizer.init(function (err) {
        if (err) {
            console.log(err);
        }

        console.log('3. -> message bus'.cyan);
        
        msgbus.subscribe("events", function (data) {
            console.log(colors.cyan('eventDenormalizer -- denormalize event ' + data.event));
            eventDenormalizer.handle(data);
        });

        msgbus.subscribe("viewmodels", function (evt) {
            console.log(colors.magenta('\nsocket.io -- publish event ' + evt.event + ' to browser'));
            io.sockets.emit(evt.collection, evt);
        });

        console.log('2. -> Configure routes'.cyan);
        require('./routes').actions(app, repository);

        console.log('3. -> Configure WebSockets connection'.cyan);
        io.sockets.on('connection', function (socket) {
            console.log(colors.magenta(' -- connects to socket.io'));

            socket.on('commands', function (data) {
                console.log(colors.magenta('\n -- sends command ' + data.command + ':'));
                console.log(data);

                msgbus.publish("commands", data);
            });
        });

        eventDenormalizer.onEvent(function (evt) {
            console.log(colors.magenta('\nsocket.io -- publish event ' + evt.event + ' to browser'));
            console.log(evt);
            //msgbus.publish("viewmodels", evt);
        });

        eventDenormalizer.onNotification(function (notification) {
            console.log(colors.magenta('\nsocket.io -- publish notification ' + notification.collection + ' to browser'));
            console.log(notification);
            msgbus.publish("viewmodels", notification);
        });

        var port = 3001;
        console.log(colors.cyan('\nStarting server on port ' + port));
        server.listen(port);
    });
});

