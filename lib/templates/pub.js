/* jshint node:true */
'use strict';

var pub      = require('./rep');
var tools    = require('socket.base').tools;

pub._broadcast = function _broadcast (data, socket) {

  if (data) {
    socket.listener.sockets.emit(socket.options.rootHash + '_broadcast', data);
  }
};

module.exports = pub;
