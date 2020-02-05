const dmString = require('../../config/dmString');
const config = require('../../config/app');
const admin = require('../../utils/admin');
const twitter = require('../../utils/twitter');

const db = admin.firestore();

module.exports.blacklist = async ({ userId, directMessageEvent, users }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  const { userBlacklist } = config;

  // block user
  try {
    let isBlockUser = false;

    if (userBlacklist.split(',').includes(messageSenderId)) {
      await db.collection('blacklist').doc(messageSenderId).set({
        created_at,
        info: users[messageSenderId]
      });

      await db.collection('direct_message_queue').add({
        sender: userId,
        receiver: messageSenderId,
        text: dmString.blockUser,
        is_send: false,
        created_at
      });

      isBlockUser = true;
    }

    return Promise.resolve({ isBlockUser });
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.subscribe = async ({ userId, directMessageEvent, users, payload: customText }) => {
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
      text: dmString.subscribe.success,
      is_send: false,
      created_at
    };

    if (!subscribersSnap.empty && subscribersSnap.size >= userLimit) {
      message.text = dmString.subscribe.maximum;
    } else {
      await db.collection('subscribers').doc(messageSenderId).set({
        info: users[messageSenderId],
        customText: (customText) ? customText : null,
        created_at
      });
    }
    await db.collection('direct_message_queue').add(message);

    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.unsubscribe = async ({ userId, directMessageEvent }) => {
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
      text: dmString.unsubscribe.success,
      is_send: false,
      created_at
    });

    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.users = async ({ userId, directMessageEvent }) => {
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
      text: dmString.users.replace(':user_count', subscribersSnap.size),
      is_send: false,
      created_at
    });
    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.unknownCommand = async ({ userId, directMessageEvent }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  try {

    await db.collection('direct_message_queue').add({
      sender: userId,
      receiver: messageSenderId,
      text: dmString.unknownCommand,
      is_send: false,
      created_at
    });
    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
}

module.exports.lookup = async ({ userId, directMessageEvent, payload: screenName }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  if (screenName) {
    const datetime = new Date().getTime();
    await db.doc(`/lookup_user_queue/${screenName}/datetime/${datetime}`).set({
      sender: userId,
      receiver: messageSenderId,
      created_at
    });
  }
  return 'done';
}