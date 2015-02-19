/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var couchbase = require('couchbase');
var Q         = require('q');

exports.bucketName = false;
exports.cluster    = false;
exports.bucket     = false;
exports.hosts      = [];


exports.responseHandler = function responseHandler (couchError, result) {

  if (couchError) {
    couchError.key = this.key;

    this.deferred.reject(couchError);
  }
  else {
    this.deferred.resolve(result.value);
  }
};

/**
 * Connects against the Couchbase cluster and opens the wanted bucket.
 *
 * @param {String} bucketName name of the requested bucket
 * @param {String[]} hosts list of hosts been part of the cluster
 *
 * @returns {Q.promise}
 */
exports.connect = function connect (bucketName, hosts) {
  var deferred = Q.defer();

  exports.bucketName = bucketName;
  exports.cluster    = new couchbase.Cluster(hosts);

  var manager = exports.cluster.manager();

  manager.listBuckets(function listBucketsHandler (error, buckets) {
    // TODO: only open if bucket in buckets
    exports.bucket = exports.cluster.openBucket(exports.bucketName);

    exports.bucket.on('connect', function openBucketSuccess () {
      console.log('CONNECTED to: ', exports.hosts);
      deferred.resolve(exports.bucket);
    });

    exports.bucket.on('error', function openBucketSuccess (error) {
      // Failed to make a connection to the Couchbase cluster.
      console.log('error.stack', error.stack);
      deferred.reject(error.stack);
    });
  });

  return deferred.promise;
};

/**
 * Fetches a document from the database.
 * 
 * @param {String} key document key
 * @param {Q} [deferred] used only internally for recursive calls
 * 
 * @returns {Q.promise}
 */
exports.get = function get (key, deferred) {
  deferred = deferred || Q.defer();

  var context = {
    parent: this.parent,
    deferred: deferred,
    key: key
  };

  if (!exports.bucket) {

    // initialise connection
    exports.connect()
      .then(function connectSuccess () {
        get(key, deferred);
      })
      .catch(function connectError (error) {
        deferred.reject(error);
      });
  }
  else {
    exports.bucket.get(
      key,
      exports.responseHandler.bind(context)
    );
  }

  return deferred.promise;
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
 * @param {String} key document key
 * @param {Object} doc document
 * @param {Number} [expiry] expiration time in seconds for the document
 * @param {Q} [deferred] used only internally for recursive calls
 * 
 * @returns {Q.promise}
 */
exports.insert = function insert (key, doc, expiry, deferred) {
  deferred = deferred || Q.defer();

  var options = {
    expiry: exports.calculateExpiryDate(expiry)
  };
  var context = {
    parent:   this.parent,
    deferred: deferred,
    key: key
  };

  if (!exports.bucket) {

    // initialise connection
    exports.open()
      .then(function connectSuccess () {
        insert(key, doc, expiry, deferred);
      })
      .catch(function connectError (error) {
        deferred.reject(error);
      });
  }
  else {
    exports.bucket.insert(
      key,
      doc,
      options,
      responseHandler.bind(context)
    );
  }

  return deferred.promise;
};

/**
 * Executes a partial update on a document.
 * Update process: queries the document from the database, deep merges the update object on it and stores it back.
 * If there is a concurrency problem, the method will restart the update process until it works.
 *
 * @param {String} key document key
 * @param {Object} update with new property values
 * @param {Q} [deferred] used only internally for recursive calls
 *
 * @returns {Q.promise}
 */
exports.update = function update (key, update, deferred) {
  deferred = deferred || Q.defer();

  var options = {
    expiry: exports.calculateExpiryDate(expiry)
  };
  var context = {
    parent:   this.parent,
    deferred: deferred,
    key: key
  };

  if (!exports.bucket) {

    // initialise connection
    exports.open()
      .then(function connectSuccess () {
        insert(key, update, deferred);
      })
      .catch(function connectError (error) {
        deferred.reject(error);
      });
  }
  else {

    exports.bucket.insert(
      key,
      doc,
      options,
      responseHandler.bind(context)
    );
  }

  return deferred.promise;
};
