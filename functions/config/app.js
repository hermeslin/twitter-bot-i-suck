const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  userLimit: process.env.USER_LIMIT,
  userBlacklist: process.env.USER_BLACKLIST,
  mentionText: process.env.MENTION_TEXT,
  timezone: process.env.TIMEZONE,
};
