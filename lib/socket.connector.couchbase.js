/* jshint node:true */
/* global require */
'use strict';

var merge        = require('node.extend');
var pless        = require('prototype-less');
var base         = require('../../socket.base');
var validate     = require('./validate');
var info         = require('../package.json');
var couch        = require('./couchbase');
var connTemplate = require('./templates/connection');

module.exports = function (_socket) {

  _socket = base.init(_socket, info);

  // validate protocol specific optionsuration options
  validate.checkOptions(_socket.options);

  // Applying the pattern specific beaviour template
  var patternTemplate = require('./templates/' + _socket.options.pattern);
  pless.mixin(_socket.lib, patternTemplate);

  var connection = pless.mixin({}, connTemplate);

  connection.parent = _socket;
  connection.uri    = _socket.id;

  _socket.connections[connection.uri] = connection;
  _socket.client    = connection;

  couch.connect(connection);

  return _socket;
};
