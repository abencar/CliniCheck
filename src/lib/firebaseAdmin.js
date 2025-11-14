import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://clinicheck-668a2-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;