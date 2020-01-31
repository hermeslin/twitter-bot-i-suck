const messageCreate = require('../utils/twitter/messageCreate');

module.exports = async (request, response) => {
  // dm evnt
  const {
    for_user_id: userId,
    direct_message_events: directMessageEvents,
  } = request.body;

  const directMessageResults = [];

  if (directMessageEvents) {
    const users = request.body.users;

    for (const directMessageEvent of directMessageEvents) {
      const {
        type,
        message_create: {
          message_data: messageData
        }
      } = directMessageEvent;

      // check user
      directMessageResults.push(messageCreate.blacklist(userId, directMessageEvent, users));

      if (type === 'message_create') {
        // subscribe or subscribe with custom string
        const subscribeStrMatch = messageData.text.match(/^(?:subscribe|subscribe:(.+))$/);
        if (subscribeStrMatch) {
          directMessageResults.push(messageCreate.subscribe(userId, directMessageEvent, users, subscribeStrMatch));
        } else {
          // not subscribe string
          switch (messageData.text) {
            case 'unsubscribe':
              directMessageResults.push(messageCreate.unsubscribe(userId, directMessageEvent, users));
              break;
            case 'users':
              directMessageResults.push(messageCreate.users(userId, directMessageEvent, users));
              break;
            default:
              directMessageResults.push(messageCreate.unknownCommand(userId, directMessageEvent, users));
              break;
          }
        }
      }
    }

    await Promise.all(directMessageResults);
  }

  response.status(200).send('done');
}