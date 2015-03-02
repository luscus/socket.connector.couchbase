/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var couchbase = require('couchbase');

// TODO: put error handling in a lib file
process.on('uncaughtException', function CouchbaseExceptionCatcher (error) {
  if (error.stack.indexOf('/clustermgr.js') > 0) {
    console.error('Couchbase Error: Your bucket credentials may be false...');
  }
});

exports.open = function open (connection) {

  var socket     = connection.parent;
  var bucketName = socket.options.target;
  var password   = socket.options.password || null;

  connection.bucket = connection.cluster.openBucket(bucketName, password);

  connection.bucket.on('connect', function openBucketSuccess () {
    console.log('CONNECTED to Couchbase cluster: ', socket.options.hosts);
    socket.emit('connected', connection);
  });

  connection.bucket.on('error', function openBucketSuccess (error) {
    // Failed to open the wanted bucket.
    console.log('error.stack', error.stack);
    socket.emit('error', error, socket.id, socket);
  });
};

/**
 * Connects against the Couchbase cluster and opens the wanted bucket.
 *
 * @param {Object} connection
 */
exports.connect = function connect (connection) {

  var socket     = connection.parent;
  var hosts      = socket.options.hosts;
  var bucketName = socket.options.target;
  var password   = socket.options.password || null;

  connection.cluster = new couchbase.Cluster(hosts);

  var manager = connection.cluster.manager(bucketName, password);

  manager.listBuckets(function listBucketsHandler (error, buckets) {

    if (error) {
      // Failed to make a connection to the Couchbase cluster.
      console.log('error.stack', error.stack);
      socket.emit('error', error, socket.id, socket);
      return;
    }

    var bucketNames = [];

    buckets.forEach(function bucketNameIterator (remoteBucket) {
      bucketNames.push(remoteBucket.name);
    });

    var bucketExists = bucketNames.indexOf(bucketName) > -1;

    if (bucketExists) {
      exports.open(connection);
    }
    else {
      // Wanted bucket does not exist.
      error = new Error('Bucket ' + bucketName + ' does not exist in cluster\n  you may use: ' + bucketNames);
      console.log(error.stack);
      socket.emit('error', error, socket.id, socket);
    }
  });
};

/**
 * Fetches a document from the database.
 *
 * @param {Object} connection
 * @param {String} key document key
 */
exports.get = function get (connection, key) {

  connection.bucket.get(key, connection.responseHandler.bind(connection));
};

/**
 * Couchbase does not use consistently seconds for the expiry property.
 * This method awaits a time period in seconds or undefined, and transforms it into the awaited Number.
 *
 * @param {Number} expirySeconds expiration time in seconds for the document
 *
 * @returns {Number} 0, seconds or unix timestamp depending on provided input
 */
exports.calculateExpiryDate = function calculateExpiryDate (expirySeconds) {
  expirySeconds = expirySeconds || 0;

  var nowSeconds = 0;

  if (expirySeconds > 2592000) {

    // for an expiry over 30 days, you have to calculate the expiry date in seconds
    nowSeconds = Math.floor(Date.now() / 1000);
  }

  return  nowSeconds + expirySeconds;
};

/**
 * Stores a document in the database.
 *
 * @param {Object} connection
 * @param {String} key document key
 * @param {Object} doc document
 * @param {Number} [expiry] expiration time in seconds for the document
 */
exports.insert = function insert (connection, key, doc, expiry) {
  var options = {
    expiry: exports.calculateExpiryDate(expiry)
  };

  connection.bucket.insert(
    key,
    doc,
    options,
    connection.responseHandler.bind(connection)
  );
};


exports.replace = function insert (connection, key, doc, expiry) {
  var options = {
    expiry: exports.calculateExpiryDate(expiry)
  };

  connection.bucket.insert(
    key,
    doc,
    options,
		function replaceHandler (error, value) {
			if (error && error.code === 12) {
				connection.bucket.replace(
					key,
					doc,
					options,
					connection.responseHandler.bind(connection)
        );
				return;
			}

			connection.responseHandler.bind(connection)(error, value);
		}
  );
};

/**
 * Executes a partial update on a document.
 * Update process: queries the document from the database, deep merges the update object on it and stores it back.
 * If there is a concurrency problem, the method will restart the update process until it works.
 *
 * @param {Object} connection
 * @param {String} key document key
 * @param {Object} update with new property values
 */
exports.update = function update (connection, key, diff) {

  /*
  var options = {
    expiry: exports.calculateExpiryDate(expiry)
  };

  connection.bucket.insert(
      key,
      doc,
      options,
    connection.responseHandler.bind(connection)
    );
    */

};
