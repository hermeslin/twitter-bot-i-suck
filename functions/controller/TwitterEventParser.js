const messageCreate = require('../utils/twitter/messageCreate');

const directMessageHandler = async (userId, directMessageEvent, users) => {
  const {
    type,
    message_create: {
      message_data: messageData
    }
  } = directMessageEvent;

  try {
    // check user is in blacklist or not
    const { isBlockUser } = await messageCreate.blacklist(userId, directMessageEvent, users);

    if (type === 'message_create' && !isBlockUser) {
      // subscribe or subscribe with custom string
      const subscribeStrMatch = messageData.text.match(/^(?:subscribe|subscribe:(.+))$/i);
      if (subscribeStrMatch) {
        await messageCreate.subscribe(userId, directMessageEvent, users, subscribeStrMatch);
      } else {
        // not subscribe string
        switch (messageData.text.toLowerCase()) {
          case 'unsubscribe':
            await messageCreate.unsubscribe(userId, directMessageEvent, users);
            break;
          case 'users':
          case 'user':
            await messageCreate.users(userId, directMessageEvent, users);
            break;
          default:
            await messageCreate.unknownCommand(userId, directMessageEvent, users);
            break;
        }
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