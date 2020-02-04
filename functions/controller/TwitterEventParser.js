const messageCreate = require('../utils/twitter/messageCreate');

const directMessageHandler = async (userId, directMessageEvent, users) => {
  const {
    type,
    message_create: {
      sender_id: messageSenderId,
      message_data: messageData
    }
  } = directMessageEvent;

  try {
    if (type === 'message_create' && messageData) {

      // do not process self message
      if (userId === messageSenderId) {
        return Promise.resolve(directMessageEvent);
      }

      // parse direct message string
      const [, command, payload] = messageData.text.match(/^(\w+)(?::(.+))?$/);
      const data = {
        userId,
        directMessageEvent,
        users,
        payload,
      };

      // check user is in blacklist or not
      const { isBlockUser } = await messageCreate.blacklist(data);
      if (isBlockUser) {
        return Promise.resolve(directMessageEvent);
      }

      switch (command.toLowerCase()) {
        // command with paylaod
        // exp: subscribe:mention_text
        case 'subscribe':
          await messageCreate.subscribe(data);
          break;
        case 'lookup':
          await messageCreate.lookup(data);
          break;
        // command without paylaod
        case 'unsubscribe':
          await messageCreate.unsubscribe(data);
          break;
        case 'users':
        case 'user':
          await messageCreate.users(data);
          break;
        default:
          await messageCreate.unknownCommand(data);
          break;
      }
    }

    return Promise.resolve(directMessageEvent);
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = async (request, response) => {
  // dm evnt
  const {
    for_user_id: userId,
    direct_message_events: directMessageEvents,
  } = request.body;

  if (directMessageEvents) {
    const users = request.body.users;
    const directMessageResults = [];

    // process directMessageEvents in parallel
    for (const directMessageEvent of directMessageEvents) {
      directMessageResults.push(directMessageHandler(userId, directMessageEvent, users));
    }

    try {
      await Promise.all(directMessageResults);
    } catch (error) {
      console.error(error);
    }
  }

  response.status(200).send('done');
}