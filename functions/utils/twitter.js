const querystring = require('querystring');
const axios = require('axios');
const crypto = require('crypto');
const twitter = require('../config/twitter');
const security = require('../utils/security');

const axiosHandler = async (options) => {
  try {
    const response = await axios(options);
    const result = await response.data;
    return result;
  } catch (error) {
    if (error.response && error.response.status) {
      const httpError = {
        status: error.response.status,
        statusText: error.response.statusText,
        errors: error.response.data.errors,
      };
      // reject http status error
      return Promise.reject(httpError);
    }
    throw error;
  }
};

const defaultHeaders = () => ({
  oauth_consumer_key: twitter.consumerApiKey,
  oauth_nonce: crypto.randomBytes(32).toString('hex'),
  oauth_signature_method: 'HMAC-SHA1',
  oauth_timestamp: Math.floor(new Date().getTime() / 1000),
  oauth_token: twitter.accessToken,
  oauth_version: '1.0',
});

const authorizationHeader = (method, url, query = {}, postData = {}) => {
  const headers = defaultHeaders();
  const parameters = Object.assign({}, query, postData, headers);

  const parameterString = Object.keys(parameters).sort().map((currentKey) => {
    const value = parameters[currentKey];
    return `${encodeURIComponent(currentKey)}=${encodeURIComponent(value)}`;
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

module.exports.sendDm = (receiver, text) => {
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

  return axiosHandler({
    method,
    url,
    data: directMessage,
    headers,
  });
};

module.exports.sendMention = (screenName, text) => {
  const method = 'POST';
  const url = 'https://api.twitter.com/1.1/statuses/update.json';
  const query = {
    status: `@${screenName} ${text}`
  };

  const headers = {
    'Authorization': `OAuth ${authorizationHeader(method, url, query)}`,
  }

  return axiosHandler({
    method,
    url: `${url}?${querystring.encode(query)}`,
    data: null,
    headers,
  });
};

module.exports.lookup = (parameters) => {
  const method = 'GET';
  const url = 'https://api.twitter.com/1.1/users/lookup.json';
  const query = parameters;

  const headers = {
    'Authorization': `OAuth ${authorizationHeader(method, url, query)}`,
  }

  return axiosHandler({
    method,
    url: `${url}?${querystring.encode(query)}`,
    headers
  });
};
