const messageCreate = require('../utils/twitter/messageCreate');

module.exports = async (request, response) => {
  // dm evnt
  // const userId = request.body.for_user_id;
  const {
    for_user_id: userId,
    direct_message_events: directMessageEvents,
    users,
  } = request.body;

  const directMessageResults = [];

  if (directMessageEvents) {
    for (const directMessageEvent of directMessageEvents) {
      const {
        type,
        message_create: {
          message_data: messageData
        }
      } = directMessageEvent;

      // check user
      directMessageResults.push(messageCreate.blacklist(userId, directMessageEvent, users));

      // subscribe
      if (type === 'message_create' && messageData.text === 'subscribe') {
        directMessageResults.push(messageCreate.subscribe(userId, directMessageEvent, users));
      }

      // unsubscribe
      if (type === 'message_create' && messageData.text === 'unsubscribe') {
        directMessageResults.push(messageCreate.unsubscribe(userId, directMessageEvent, users));
      }

      if (type === 'message_create' && messageData.text === 'users') {
        directMessageResults.push(messageCreate.users(userId, directMessageEvent, users));
      }
    }

    await Promise.all(directMessageResults);
  }

  response.status(200).send('done');
}