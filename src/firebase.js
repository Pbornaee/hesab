import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBflkoGKwm7zKu8tnb61QL4udruW4gF_fs",
  authDomain: "hesab-aa1e2.firebaseapp.com",
  projectId: "hesab-aa1e2",
  storageBucket: "hesab-aa1e2.firebasestorage.app",
  messagingSenderId: "838558400104",
  appId: "1:838558400104:web:5dd5ef56e0c826b91045dd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const normalizeUsername = (username) => {
  return username.toLowerCase().trim();
}; 