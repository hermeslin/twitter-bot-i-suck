const crypto = require('crypto');
const twitter = require('../config/twitter');

module.exports = (data) => {
  return crypto.createHmac('sha256', twitter.consumerApiSecretKey).update(data, 'utf8').digest('base64');
};
