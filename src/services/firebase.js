// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Bootcampers collection
export const bootcampersCollection = collection(db, 'bootcampers');

// Helper functions
export const addBootcamper = async (bootcamperData) => {
  try {
    const docRef = await addDoc(bootcampersCollection, {
      ...bootcamperData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...bootcamperData };
  } catch (error) {
    console.error('Error adding bootcamper:', error);
    throw error;
  }
};

export const getBootcampers = async () => {
  try {
    const querySnapshot = await getDocs(bootcampersCollection);
    const bootcampers = [];
    querySnapshot.forEach((doc) => {
      bootcampers.push({ id: doc.id, ...doc.data() });
    });
    return bootcampers;
  } catch (error) {
    console.error('Error getting bootcampers:', error);
    throw error;
  }
};

export const updateBootcamper = async (id, data) => {
  try {
    const bootcamperRef = doc(db, 'bootcampers', id);
    await updateDoc(bootcamperRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating bootcamper:', error);
    throw error;
  }
};

export const deleteBootcamper = async (id) => {
  try {
    const bootcamperRef = doc(db, 'bootcampers', id);
    await deleteDoc(bootcamperRef);
  } catch (error) {
    console.error('Error deleting bootcamper:', error);
    throw error;
  }
};

export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};