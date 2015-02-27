/* jshint node:true */
/* global require */
var couch = require('../lib/couchbase');

couch.connect('uam', 'test', ['192.168.0.125'])
.then(function (bucket) {

console.log(bucket);

  })
.catch(console.error);
