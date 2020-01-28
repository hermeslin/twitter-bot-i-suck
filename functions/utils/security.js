const crypto = require('crypto');
const twitter = require('../config/twitter');

module.exports.hash = (data) => {
  return crypto.createHmac('sha256', twitter.consumerApiSecretKey).update(data, 'utf8').digest('base64');
};

module.exports.signature = (data) => {
  const signingKey = [
    twitter.consumerApiSecretKey,
    twitter.accessTokenSecret
  ].map((secret) => {
    return encodeURIComponent(secret);
  }).join('&');

  return crypto.createHmac('sha1', signingKey).update(data).digest('base64');
};