const functions = require('firebase-functions');
const admin = require('../../utils/admin');
const twitter = require('../../utils/twitter');

const db = admin.firestore();

module.exports = functions.firestore.document('/direct_message_queue/{queueId}').onCreate(async (snapshot, context) => {

  const queueId = context.params.queueId;
  const newMessage = snapshot.data();
  const updateData = {
    update_at: new Date().getTime()
  };

  try {
    const response = await twitter.sendDm(newMessage.receiver, newMessage.text);
    updateData.is_send = true;
    updateData.response = response;
  } catch (error) {
    // http status error via axios
    if (error.status) {
      updateData.error = error;
    } else {
      // default error message
      updateData.error = error.message;
    }
    console.error(error);
  }

  return db.doc(`/direct_message_queue/${queueId}`).update(updateData);
});
