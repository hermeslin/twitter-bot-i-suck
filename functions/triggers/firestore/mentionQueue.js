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

      const response = await twitter.sendMention(subscriber.info.screen_name, newMention.text);
      result.is_send = true;
      result.response = response;
    }
  } catch (error) {
    // http status error via axios
    if (error.status) {
      result.error = error;
    } else {
      // default error message
      result.error = error.message;
    }

    console.error(error);
  }

  if (result.error) {
    const text = dmString.mentionFail.replace(':mention_text', newMention.text);
    await db.collection('direct_message_queue').add({
      sender: newMention.sender,
      receiver: receiverId,
      text,
      is_send: false,
      created_at
    });
  }

  return db.doc(`/mention_queue/${mentionDate}/users/${receiverId}`).update(result);
});