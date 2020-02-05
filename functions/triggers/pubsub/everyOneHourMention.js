const moment = require('moment-timezone');
const functions = require('firebase-functions');
const admin = require('../../utils/admin');
const config = require('../../config/app');

module.exports = functions.pubsub.topic('every-one-hour-mention').onPublish(async (message) => {
  const db = admin.firestore();
  const today = moment().tz(config.timezone).format('YYYYMMDD');
  const subscribersSnap = await db.collection('subscribers').get();

  const filterResult = [];
  subscribersSnap.forEach((subscriber) => {
    const notMentionedUsers = async (subscriber) => {
      const notMentionedUsersSnap = await db.doc(`mention_queue/${today}/users/${subscriber.id}`).get();
      return {
        exists: notMentionedUsersSnap.exists,
        subscriber: {
          id: subscriber.id,
          data: subscriber.data()
        },
      };
    };
    filterResult.push(notMentionedUsers(subscriber));
  });

  const notMentionedListPromise = await Promise.all(filterResult);
  const notMentionedList = notMentionedListPromise.filter((notMentioned) => {
    return !notMentioned.exists
  });

  if (notMentionedList.length > 0) {
    const randomIndex = Math.floor(Math.random() * notMentionedList.length);
    const notMentioned = notMentionedList[randomIndex];
    db.doc(`mention_queue/${today}/users/${notMentioned.subscriber.id}`).set({
      sender: notMentioned.subscriber.data.handler,
      text: (notMentioned.subscriber.data.customText) ? notMentioned.subscriber.data.customText : config.mentionText,
      is_send: false,
      create_at: new Date().getTime(),
    });
  }
});