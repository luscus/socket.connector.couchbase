// testing
var zmqLib = require('../lib/socket.connector.couchbase.js'),
    service = {
      name: 'zmqTest'
    },
    client = {
      name: 'client',
      pattern: 'sub'
    },
    server = {
      name: 'server',
      pattern: 'pub',
      port: [22000, 22001]
    };


/*
var socket = new Socket(server);

socket.on('listen', function (url) {
  console.log('Process "' + process.pid + '" listening on ' + url);
})
*/

var socket = zmqLib(server);

var responseCount = 0;

socket.bind(function (data, meta, raw) {
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('data: ', data);

  if (responseCount === 400) {
    process.exit();
  }

  responseCount += 1;
  data.responder = new Date().toISOString();

  return data;
});


setInterval(function () {
    console.log('--------------');
    console.log('sending: ', {pid:process.pid,timestamp: new Date().toISOString()});
  socket.broadcast({requester: new Date().toISOString()});
}, 1000);
