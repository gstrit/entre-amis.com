// server.js is the starting point of the host process:
//
// `node server.js` 
var express = require('express')
  , http = require('http')
  , colors = require('colors')
  , socket = require('socket.io')
  , viewmodel = require('viewmodel');

// create an configure:
//
// - express webserver
// - socket.io socket communication from/to browser
var app = express()
  , server = http.createServer(app)
  , io = socket.listen(server);


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

console.log('1. -> viewmodel'.cyan);
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

    console.log('2. -> eventdenormalizer'.cyan);
    eventDenormalizer.init(function (err) {
        if (err) {
            console.log(err);
        }

        console.log('3. -> message bus'.cyan);
        var msgbus = require('servicebus');

        // on receiving an __event__ from redis via the hub module:
        //
        // - let it be handled from the eventDenormalizer to update the viewmodel storage
        msgbus.onEvent(function (data) {
            console.log(colors.cyan('eventDenormalizer -- denormalize event ' + data.event));
            eventDenormalizer.handle(data);
        });

        // on receiving an __event__ from eventDenormalizer module:
        //
        // - forward it to connected browsers via socket.io
        eventDenormalizer.onEvent(function (evt) {
            console.log(colors.magenta('\nsocket.io -- publish event ' + evt.event + ' to browser'));
            //send to bus
        });
    });
});