const functions = require('firebase-functions');
const admin = require('../../utils/admin');
const twitter = require('../../utils/twitter');

const db = admin.firestore();

module.exports = functions.firestore.document('/mention_queue/{mentionDate}/users/{receiverId}').onCreate(async (snapshot, context) => {

  const mentionDate = context.params.mentionDate;
  const receiverId = context.params.receiverId;
  const newMention = snapshot.data();

  try {
    const subscriberSnap = await db.doc(`/subscribers/${receiverId}`).get();
    const result = {
      update_at: new Date().getTime(),
    };

    if (subscriberSnap.exists) {
      const subscriber = subscriberSnap.data();
      const { status, statusText, data } = await twitter.sendMention(subscriber.info.screen_name, newMention.text);
      result.is_send = true;
      result.response = {
        status, statusText, data
      };
    }
    return db.doc(`/mention_queue/${mentionDate}/users/${receiverId}`).update(result);
  } catch (error) {
    return Promise.reject(error);
  }
});