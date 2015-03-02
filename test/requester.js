/* jshint node:true */
/* global require */
/* global process */
var couch = require('../lib/socket.connector.couchbase');

var config = {
  hosts: ['192.168.0.125'],
  expiry: {
    default: 86400,
    cargo: 2592000,
    truck: 2592000
  },
  pattern: 'req',
  name: 'connector.couchbase.exchange',
  target: 'uam',
  password: 'test',
  connector: 'couchbase'
};


var socket = couch(config);



socket.on('message', function (packet, clusterSource) {
  console.log('<<<<<<<<<<<<<<<<<<<<<');
  console.log('response at : ', new Date().toISOString(), 'from', clusterSource, packet);
});

setInterval(function () {

setInterval(function () {
  var date = new Date().toISOString();
  var random1 = Math.floor(Math.random() * 100000);
  var random2 = Math.floor(Math.random() * 100000);
  var data = {id: 'test::', pid:process.pid, timestamp: date};

  console.log('--------------');
  console.log('sending: ', data);
  socket.send(data);
}, 5);
}, 1000);
