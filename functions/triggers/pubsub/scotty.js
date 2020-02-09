const moment = require('moment-timezone');
const functions = require('firebase-functions');
const admin = require('../../utils/admin');
const config = require('../../config/app');
const twitter = require('../../utils/twitter');
const dmString = require('../../config/dmString');

module.exports = functions.pubsub.topic('doesnt-know').onPublish(async (message) => {
  const {
    scout,
    scotty,
    fiona
  } = message.attributes;

  const db = admin.firestore();
  const today = moment().tz(config.timezone).format('YYYYMMDDHHmmss');

  try {
    const users = await twitter.lookup({ user_id: fiona });
    const user = users[0];

    const fionaRef = db.doc(`scout/${fiona}`);

    const userSummary = {
      protected: user.protected,
      name: user.name,
      screen_name: user.screen_name,
      followers_count: user.followers_count,
      friends_count: user.friends_count,
      favourites_count: user.favourites_count,
      statuses_count: user.statuses_count,
    }

    if (!user.protected) {

      // set latest id and status
      userSummary.text = user.status.text;
      userSummary.lastest_status_id = user.status.id;
      userSummary.status = user.status;

      // get initial status
      const parameters = {
        user_id: fiona
      };

      // get lastest id
      const fionaStatusRef = fionaRef.collection('status');
      const fionaStatusSnapshot = await fionaStatusRef.orderBy('id', 'desc').limit(1).get();

      if (!fionaStatusSnapshot.empty) {
        fionaStatusSnapshot.forEach((doc) => {
          const status = doc.data();
          parameters.since_id = status.id;
        });
      }

      const timeline = await twitter.userTimeline(parameters);
      const insertAll = [];
      const addFionaStatus = async (status) => (
        await fionaStatusRef.add({
          id: status.id,
          text: status.text,
          status,
        })
      );

      for (const status of timeline) {
        insertAll.push(addFionaStatus(status));
      }

      await Promise.all(insertAll);

      //
      if (scout && scotty && parameters.since_id && timeline.length) {
        await db.collection('direct_message_queue').add({
          sender: scout,
          receiver: scotty,
          text: timeline[0].text,
          is_send: false,
          created_at
        });
      }
    }

    await fionaRef.set({
      userSummary,
      updated_at: new Date().getTime(),
    });

    await fionaRef.collection('date').doc(today).set({
      user,
      create_at: new Date().getTime(),
    });

    return 'done';
  } catch (error) {
    console.error(error);
    return 'error';
  }
});