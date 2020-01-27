const dotenv = require("dotenv");

dotenv.config();

module.exports =  {
  consumerApiKey: process.env.TWITTER_CONSUMER_API_KEY,
  consumerApiSecretKey: process.env.TWITTER_CONSUMER_API_SECRET_KEY,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
};
