const functions = require('firebase-functions');
const hnapi = require('hnpwa-api');

exports.api = hnapi.trigger({ useCors: true });
