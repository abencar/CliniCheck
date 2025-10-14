import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyAG9swFp4kJK23qSXaa34mWGUGD4iA6uK0",
  authDomain: "clinicheck-668a2.firebaseapp.com",
  databaseURL: "https://clinicheck-668a2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "clinicheck-668a2",
  storageBucket: "clinicheck-668a2.firebasestorage.app",
  messagingSenderId: "409225740971",
  appId: "1:409225740971:web:f9ba212d7d39a74276edee",
  measurementId: "G-KE5BNT1J53"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
