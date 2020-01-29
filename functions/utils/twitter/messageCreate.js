const config = require('../../config/app');
const admin = require('../../utils/admin');

const db = admin.firestore();

module.exports.blacklist = async (userId, directMessageEvent) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  const { userBlacklist } = config;

  // block user
  try {
    if (userBlacklist.split(',').includes(messageSenderId)) {
      await db.collection('blacklist').doc(messageSenderId).set({
        created_at
      });

      await db.collection('direct_message_queue').add({
        sender: userId,
        receiver: messageSenderId,
        text: 'you are not allowed to use any functions.',
        is_send: false,
        created_at
      });
    }
    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.subscribe = async (userId, directMessageEvent) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  const { userLimit } = config;

  try {
    const subscribersSnap = await db.collection('subscribers').get();
    const message = {
      sender: userId,
      receiver: messageSenderId,
      text: 'successfully subscribed.',
      is_send: false,
      created_at
    };

    if (!subscribersSnap.empty && subscribersSnap.size > userLimit) {
      message.text = 'oops, maximum number of users reached.';
    } else {
      await db.collection('subscribers').doc(messageSenderId).set({
        created_at
      });
    }
    await db.collection('direct_message_queue').add(message);

    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.unsubscribe = async (userId, directMessageEvent) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  try {
    await db.collection('subscribers').doc(messageSenderId).delete();

    await db.collection('direct_message_queue').add({
      sender: userId,
      receiver: messageSenderId,
      text: 'successfully unsubscribed.',
      is_send: false,
      created_at
    });

    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.users = async (userId, directMessageEvent) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  try {
    const subscribersSnap = await db.collection('subscribers').get();

    await db.collection('direct_message_queue').add({
      sender: userId,
      receiver: messageSenderId,
      text: `${subscribersSnap.size} user(s) subscribed this bot.`,
      is_send: false,
      created_at
    });
    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
}