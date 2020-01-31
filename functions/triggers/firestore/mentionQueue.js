const functions = require('firebase-functions');
const admin = require('../../utils/admin');
const twitter = require('../../utils/twitter');
const dmString = require('../../config/dmString');

const db = admin.firestore();

module.exports = functions.firestore.document('/mention_queue/{mentionDate}/users/{receiverId}').onCreate(async (snapshot, context) => {

  const mentionDate = context.params.mentionDate;
  const receiverId = context.params.receiverId;
  const newMention = snapshot.data();

  const result = {
    update_at: new Date().getTime(),
  };

  try {
    const subscriberSnap = await db.doc(`/subscribers/${receiverId}`).get();

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
    result.error = {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      data: error.response.data,
    };
    db.doc(`/mention_queue/${mentionDate}/users/${receiverId}`).update(result);

    const dmText = dmString.mentionFail.replace(':mention_text', newMention.text);
    twitter.sendDm(receiverId, dmText);

    return Promise.reject(error);
  }
});