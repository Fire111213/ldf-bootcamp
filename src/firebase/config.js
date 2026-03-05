import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for bootcamp-6472b project
const firebaseConfig = {
  apiKey: "AIzaSyC9dojtm71ZW6YCBCpv_RPLolveFekQVDA",
  authDomain: "bootcamp-6472b.firebaseapp.com",
  projectId: "bootcamp-6472b",
  storageBucket: "bootcamp-6472b.firebasestorage.app",
  messagingSenderId: "517379840825",
  appId: "1:517379840825:web:c042106d494b5063a7a6e8",
  measurementId: "G-6Y6TKD4FH1"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log(`✅ Firebase connected to project: bootcamp-6472b`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Export services
export { app, auth, db };
export default { app, auth, db };