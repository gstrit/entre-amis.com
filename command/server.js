// server.js is the starting point of the domain process:
//
// `node server.js` 
var colors = require('colors')
  , msgbus = require('servicebus').bus();


var domain = require('cqrs-domain')({
    domainPath: __dirname + '/lib',
    eventStore: {
        type: 'inMemory', //'mongodb',
        dbName: 'cqrssample'
    }
});

domain.defineCommand({
    id: 'id',
    name: 'command',
    aggregateId: 'payload.id',
    payload: 'payload',
    revision: 'head.revision'
});
domain.defineEvent({
    correlationId: 'commandId',
    id: 'id',
    name: 'event',
    aggregateId: 'payload.id',
    payload: 'payload',
    revision: 'head.revision'
});

domain.init(function (err) {
    if (err) {
        return console.log(err);
    }

    // on receiving a message (__=command__) from msgbus pass it to 
    // the domain calling the handle function
    msgbus.subscribe("commands", function (cmd) {
        console.log(colors.blue('\ndomain -- received command ' + cmd.command + ' from rabbitmq:'));
        console.log(cmd);

        console.log(colors.cyan('\n-> handle command ' + cmd.command));

        domain.handle(cmd);
    });

    // on receiving a message (__=event) from domain pass it to the msgbus
    domain.onEvent(function (evt) {
        console.log('domain: ' + evt.event);
        msgbus.publish("events", evt);
    });

    console.log('Starting command service'.cyan);
});