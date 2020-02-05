const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  app: {
    systemFault: process.env.DM_APP_SYSTEM_FAULT,
    notMyFault: process.env.DM_APP_NOT_MY_FAULT,
  },
  blockUser: process.env.DM_BLOCK_USER,
  subscribe: {
    success: process.env.DM_SUBSCRIBRE_SUCCESS,
    maximum: process.env.DM_SUBSCRIBRE_MAXIMUM,
  },
  unsubscribe: {
    success: process.env.DM_UNSUBSCRIBRE_SUCCESS,
  },
  users: process.env.DM_USERS,
  unknownCommand: process.env.DM_UNKNOWN_COMMAND,
  mentionFail: process.env.DM_MENTION_FAIL,
  lookup: {
    match: process.env.DM_LOOKUP,
    userNotExists: process.env.DM_LOOKUP_USER_NOT_EXISTS,
  }
};
