/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var model     = require('socket.base').models.client;
var couchbase = require('../couchbase');

exports.parent = null;
exports.uri    = null;
exports.queue  = model.queue();
exports.format = 'packet.format.raw';

exports.test   = function test () {
  var socket = this.parent;

  couchbase.open(socket);
};

exports.responseHandler = function responseHandler (error, result) {

  var socket     = this.parent;

  if (error) {
    socket.emit('error', error, socket.id, socket);
  }
  else {
    socket.emit('message', result, socket.id);
  }
};
