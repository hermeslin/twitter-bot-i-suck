const dotenv = require("dotenv");

dotenv.config();

module.exports = {
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
};
