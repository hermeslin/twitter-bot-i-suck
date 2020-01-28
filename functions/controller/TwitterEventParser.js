const config = require('../config/app');
const admin = require('../utils/admin');

module.exports = (request, response) => {
  // dm evnt
  const db = admin.firestore();
  const { userLimit, userBlacklist } = config;
  const userId = request.body.for_user_id;
  const directMessageEvents = request.body.direct_message_events;

  if (directMessageEvents) {
    directMessageEvents.forEach(async directMessageEvent => {
      const {
        type,
        created_timestamp: created_at,
        message_create: {
          sender_id: senderId,
          message_data: messageData
        }
      } = directMessageEvent;

      // block user
      if (userBlacklist.split(',').includes(senderId)) {
        db.collection('blacklist').doc(senderId).set({
          created_at
        });

        db.collection('direct_message_queue').add({
          sender: userId,
          receiver: senderId,
          text: 'you are not allowed to use any functions of this bot.',
          is_send: false,
          created_at
        });
        return;
      }

      // subscribe
      if (type === 'message_create' && messageData.text === 'subscribe') {
        const subscribersSnap = await db.collection('subscribers').get();
        if (!subscribersSnap.empty && subscribersSnap.size > userLimit) {
          db.collection('direct_message_queue').add({
            sender: userId,
            receiver: senderId,
            text: 'oops, maximum number of users reached.',
            is_send: false,
            created_at
          });
        } else {
          db.collection('subscribers').doc(senderId).set({
            created_at
          });

          db.collection('direct_message_queue').add({
            sender: userId,
            receiver: senderId,
            text: 'subscribe success.',
            is_send: false,
            created_at
          })
        }
        return;
      }

      // unsubscribe
      if (type === 'message_create' && messageData.text === 'unsubscribe') {
        db.collection('subscribers').doc(senderId).delete();

        db.collection('direct_message_queue').add({
          sender: userId,
          receiver: senderId,
          text: 'unsubscribe success.',
          is_send: false,
          created_at
        });
        return;
      }

      // get user count
      if (type === 'message_create' && messageData.text === 'users') {
        const subscribersSnap = await db.collection('subscribers').get();
        db.collection('direct_message_queue').add({
          sender: userId,
          receiver: senderId,
          text: `${subscribersSnap.size} user(s) subscribe this bot.`,
          is_send: false,
          created_at
        });
        return;
      }
    });
  }
}