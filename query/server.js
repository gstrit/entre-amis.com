// server.js is the starting point of the host process:
//
// `node server.js` 
var colors = require('colors')
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
        
        // on receiving an __event__ from redis via the hub module:
        //
        // - let it be handled from the eventDenormalizer to update the viewmodel storage
        msgbus.subscribe("events", function (data) {
            console.log(colors.cyan('eventDenormalizer -- denormalize event ' + data.event));
            eventDenormalizer.handle(data);
        });

        // on receiving an __event__ from eventDenormalizer module:
        //
        // - forward it to connected browsers via socket.io
        eventDenormalizer.onEvent(function (evt) {
            console.log(colors.magenta('\nsocket.io -- publish event ' + evt.event + ' to browser'));
            console.log(evt);
            msgbus.publish("viewmodels", evt);
        });

        eventDenormalizer.onNotification(function (notification) {
            console.log(colors.magenta('\nsocket.io -- publish notification ' + notification.collection + ' to browser'));
            console.log(notification);
            msgbus.publish("viewmodels", notification);
        });

        console.log('Starting query service'.cyan);
    });
});