const dmString = require('../../config/dmString');
const config = require('../../config/app');
const admin = require('../../utils/admin');
const twitter = require('../../utils/twitter');

const db = admin.firestore();

module.exports.blacklist = async (userId, directMessageEvent, users) => {
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

module.exports.subscribe = async (userId, directMessageEvent, users, customText) => {
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

module.exports.unsubscribe = async (userId, directMessageEvent, users) => {
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

module.exports.users = async (userId, directMessageEvent, users) => {
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

module.exports.unknownCommand = async (userId, directMessageEvent, users) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  try {

    if (userId === messageSenderId) {
      return Promise.resolve('done');
    }

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

module.exports.lookup = async (userId, directMessageEvent, users, screenName) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  try {
    if (screenName) {
      const response = await twitter.lookup({ screen_name: screenName });
      const user = await response.data[0];
      const {
        name,
        screen_name,
        protected,
        followers_count,
        friends_count,
        listed_count,
        favourites_count,
        statuses_count,
      } = user;

      await db.collection('direct_message_queue').add({
        sender: userId,
        receiver: messageSenderId,
        text: dmString.lookup.replace(':name', name)
          .replace(':screen_name', screen_name)
          .replace(':protected', protected)
          .replace(':followers_count', followers_count)
          .replace(':friends_count', friends_count)
          .replace(':listed_count', listed_count)
          .replace(':favourites_count', favourites_count)
          .replace(':statuses_count', statuses_count)
        ,
        is_send: false,
        created_at
      });
    }
    return Promise.resolve('done');
  } catch (error) {
    return Promise.reject(error);
  }
}