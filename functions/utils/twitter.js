const axios = require('axios');
const crypto = require('crypto');
const twitter = require('../config/twitter');
const security = require('../utils/security');

const defaultHeaders = () => ({
  oauth_consumer_key: twitter.consumerApiKey,
  oauth_nonce: crypto.randomBytes(32).toString('hex'),
  oauth_signature_method: 'HMAC-SHA1',
  oauth_timestamp: new Date().getTime().toString().substring(0, 10),
  oauth_token: twitter.accessToken,
  oauth_version: '1.0',
});

const authorizationHeader = (method, url, query = {}, postData = {}) => {
  const headers = defaultHeaders();
  const parameters = Object.assign({}, query, postData, headers);

  const parameterString = Object.keys(parameters).sort().map((currentKey) => {
    const value = parameters[currentKey];
    return `${encodeURIComponent(currentKey)}=${value}`;
  }).join('&');

  const oauthSignatureString = [method, url, parameterString].map((element) => (
    encodeURIComponent(element)
  )).join('&');

  // set heoauth_signatureader
  headers.oauth_signature = security.signature(oauthSignatureString);

  return Object.keys(headers).map((currentKey) => {
    const value = headers[currentKey];
    return `${encodeURIComponent(currentKey)}="${encodeURIComponent(value)}"`;
  }).join(',');
}

module.exports.sendDm = async (receiver, text) => {
  const method = 'POST';
  const url = 'https://api.twitter.com/1.1/direct_messages/events/new.json';

  const directMessage = {
    "event": {
      "type": "message_create",
      "message_create": {
        "target": {
          "recipient_id": receiver
        },
        "message_data": {
          "text": text
        }
      }
    }
  };

  const headers = {
    'Authorization': `OAuth ${authorizationHeader(method, url)}`,
  }

  try {
    const response = await axios.post(url, directMessage, { headers });
    return response;
  } catch (error) {
    console.error(error);
    return false;
  }
};
