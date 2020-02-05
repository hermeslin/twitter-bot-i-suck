const functions = require('firebase-functions');
const admin = require('../../utils/admin');
const twitter = require('../../utils/twitter');
const dmString = require('../../config/dmString');

const db = admin.firestore();

module.exports = functions.firestore.document('/lookup_user_queue/{screenName}/datetime/{datetime}').onCreate(async (snapshot, context) => {

  const screenName = context.params.screenName;
  const datetime = context.params.datetime;
  const {
    sender,
    receiver,
    created_at
  } = snapshot.data();

  let text = '';
  let updateData = {
    update_at: new Date().getTime()
  };

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

    // update lookup_user data
    updateData.user = user;
  } catch (error) {
    // default error message
    text = dmString.app.systemFault;
    updateData.error = error.message;

    if (error.status) {
      text = dmString.app.notMyFault;
      if (error.status === 404) {
        text = dmString.lookup.userNotExists
      }
      updateData.error = error;
    }
  }

  // update queue data
  await db.doc(`/lookup_user_queue/${screenName}/datetime/${datetime}`).update(updateData);
  return db.collection('direct_message_queue').add({
    sender,
    receiver,
    text,
    is_send: false,
    created_at
  });
});
