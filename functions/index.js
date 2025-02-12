const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.checkUsername = functions.https.onCall(async (data, context) => {
  const { username } = data;
  const email = `${username}@hesabketab.app`;

  try {
    // چک کردن در Authentication
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord) {
        return { exists: true };
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // چک کردن در Firestore
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('normalizedUsername', '==', username).get();

    return { exists: !snapshot.empty };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 