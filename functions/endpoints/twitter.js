const express = require('express');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const HeaderVaiidator = require('../middleware/headerValidator');
const ChallengeResponseCheck = require('../controller/ChallengeResponseCheck');
// const TwitterEventParser = require('../controller/TwitterEventParser');

const app = express();

app.use(bodyParser.json());

app.get('/*', ChallengeResponseCheck);

app.post('/*', HeaderVaiidator, (request, response) => {
  response.send('hi');
})

module.exports = functions.https.onRequest(app);
