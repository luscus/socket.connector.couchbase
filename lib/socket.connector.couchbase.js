/* jshint node:true */
/* global require */
'use strict';

var EventEmitter = require('events').EventEmitter;
var merge        = require('node.extend');
var base         = require('socket.base');
var validate     = require('./validate');
var info         = require('../package.json');

module.exports = function (_socket) {
  // disable path usage
  if (_socket.emitter instanceof EventEmitter) {
    _socket.options.useRootHash = false;
  }
  else {
    _socket.useRootHash = false;
  }

  _socket = base.init(_socket, info);

  // validate protocol specific optionsuration options
  validate.checkOptions(_socket.options);

  // Applying the pattern specific beaviour template
  var patternTemplate = require('./templates/' + _socket.options.pattern);
  merge(true, _socket.lib, patternTemplate);

  // initialise socket
  _socket.lib._init();

  return _socket;
};
