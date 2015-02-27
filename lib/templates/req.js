/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var tools = require('socket.base').tools;
var model = require('socket.base').models.client;
var couch = require('../couchbase');



exports._send = function send (packet, _connection) {

  var options = _connection.parent.options;
  var doc     = packet.getData();
  var key     = doc.id || doc._id;
  var expiry  = (options.expiry ? options.expiry[doc.type] || options.expiry.default || 0 : 0);

  couch.insert(_connection, key, doc, expiry);
};
