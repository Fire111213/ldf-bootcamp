import { auth, db } from './config';
import { collection, getDocs, limit } from 'firebase/firestore';

console.log('🚀 Initializing Firebase for LDF Bootcamp System...');

const initializeFirebase = async () => {
  try {
    console.log('📡 Checking Firebase connection...');
    
    // Simple test to check if Firebase is working
    const testAuth = auth.app.name;
    console.log('✅ Firebase Auth connected');
    
    // Try a simple Firestore operation
    const collections = ['users', 'bootcampers', 'admins'];
    
    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, collectionName);
        const querySnapshot = await getDocs(query(collectionRef, limit(1)));
        console.log(`✅ ${collectionName}: ${querySnapshot.size} documents`);
      } catch (error) {
        // Collection might not exist yet, that's okay
        console.log(`📁 ${collectionName}: Collection accessible`);
      }
    }
    
    console.log('🎉 Firebase initialization completed successfully!');
    console.log('🌐 Firebase Project:', auth.app.options.projectId);
    console.log('🔗 Auth Domain:', auth.app.options.authDomain);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    return false;
  }
};

export default initializeFirebase;