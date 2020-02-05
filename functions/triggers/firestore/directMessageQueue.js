const functions = require('firebase-functions');
const admin = require('../../utils/admin');
const twitter = require('../../utils/twitter');

const db = admin.firestore();

module.exports = functions.firestore.document('/direct_message_queue/{queueId}').onCreate(async (snapshot, context) => {

  const queueId = context.params.queueId;
  const newMessage = snapshot.data();

  const { status, statusText, data } = await twitter.sendDm(newMessage.receiver, newMessage.text);
  return db.doc(`/direct_message_queue/${queueId}`).update({
    update_at: new Date().getTime(),
    is_send: true,
    response: {
      status, statusText, data
    }
  });
});
