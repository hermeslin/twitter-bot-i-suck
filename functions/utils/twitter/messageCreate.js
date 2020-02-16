const weirdFonts = require('weird-fonts');
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

  return { isBlockUser };
};

module.exports.subscribe = async ({ userId, directMessageEvent, users, payload: customText }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  const { userLimit } = config;
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
      handler: userId,
      info: users[messageSenderId],
      customText: (customText) ? customText : null,
      created_at
    });
  }
  await db.collection('direct_message_queue').add(message);

  return 'done';
};

module.exports.unsubscribe = async ({ userId, directMessageEvent }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  await db.collection('subscribers').doc(messageSenderId).delete();
  await db.collection('direct_message_queue').add({
    sender: userId,
    receiver: messageSenderId,
    text: dmString.unsubscribe.success,
    is_send: false,
    created_at
  });

  return 'done';
};

module.exports.users = async ({ userId, directMessageEvent }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  const subscribersSnap = await db.collection('subscribers').get();

  await db.collection('direct_message_queue').add({
    sender: userId,
    receiver: messageSenderId,
    text: dmString.users.replace(':user_count', subscribersSnap.size),
    is_send: false,
    created_at
  });

  return 'done';
};

module.exports.unknownCommand = async ({ userId, directMessageEvent }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  await db.collection('direct_message_queue').add({
    sender: userId,
    receiver: messageSenderId,
    text: dmString.unknownCommand,
    is_send: false,
    created_at
  });

  return 'done';
};

module.exports.lookup = async ({ userId, directMessageEvent, payload: screenName }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  if (!screenName) {
    return 'done'
  }

  let text = dmString.app.systemFault;

  try {
    const users = await twitter.lookup({ screen_name: screenName });
    const user = users[0];

    text = dmString.lookup.match.replace(':name', user.name)
      .replace(':screen_name', user.screen_name)
      .replace(':protected', user.protected)
      .replace(':followers_count', user.followers_count)
      .replace(':friends_count', user.friends_count)
      .replace(':listed_count', user.listed_count)
      .replace(':favourites_count', user.favourites_count)
      .replace(':statuses_count', user.statuses_count);
  } catch (error) {
    // http status error via axios
    if (error.status) {
      text = dmString.app.notMyFault;
      if (error.status === 404) {
        text = dmString.lookup.userNotExists
      }
    }
    console.error(error);
  }

  // insert queue data
  await db.collection('direct_message_queue').add({
    sender: userId,
    receiver: messageSenderId,
    text,
    is_send: false,
    created_at
  });

  return 'done';
};

module.exports.fonts = async ({ userId, directMessageEvent, payload: originalText }) => {
  const {
    created_timestamp: created_at,
    message_create: {
      sender_id: messageSenderId,
    }
  } = directMessageEvent;

  if (!originalText || originalText.length <= 0) {
    return 'done'
  }

  const tranformText = [
    { name: 'serif', style: 'italic' },
    { name: 'serif', style: 'bold' },
    { name: 'serif', style: 'bold-italic' },
    { name: 'sansSerif', style: 'normal' },
    { name: 'sansSerif', style: 'italic' },
    { name: 'sansSerif', style: 'bold' },
    { name: 'sansSerif', style: 'bold-italic' },
    { name: 'monoSpace' },
    { name: 'doubleStruck' },
    { name: 'circle' },
    { name: 'square' },
    { name: 'script', style: 'normal' },
    { name: 'script', style: 'bold' },
    { name: 'fraktur', style: 'normal' },
    { name: 'fraktur', style: 'bold' },
  ].map((font) => {
    return weirdFonts[font.name](originalText, { fontStyle: font.style });
  });

  // insert queue data
  await db.collection('direct_message_queue').add({
    sender: userId,
    receiver: messageSenderId,
    text: tranformText.join('\n'),
    is_send: false,
    created_at
  });

  return 'done';
};
