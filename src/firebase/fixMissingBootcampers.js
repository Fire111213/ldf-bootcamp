import { auth, db } from './firebase/config';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { bootcamperService } from './firebase/firestore';

// Run this function to check and fix missing bootcampers
export async function fixMissingBootcampers() {
  try {
    console.log('🔍 Checking for missing bootcampers...');
    
    // Get all Firebase Auth users (you might need to use Admin SDK for this)
    // For now, let's just check Firestore
    const bootcampersRef = collection(db, 'bootcampers');
    const querySnapshot = await getDocs(bootcampersRef);
    
    console.log(`📊 Found ${querySnapshot.size} bootcampers in Firestore`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Bootcamper: ${data.email} (${data.forceNumber})`);
    });
    
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    console.error('Error checking bootcampers:', error);
    return { success: false, error: error.message };
  }
}

// Function to check if a specific bootcamper exists
export async function checkBootcamperExists(email) {
  try {
    console.log(`Checking for bootcamper with email: ${email}`);
    
    // Check in Firestore
    const bootcamperCheck = await bootcamperService.getBootcamperByEmail(email);
    
    if (bootcamperCheck.success) {
      console.log('✅ Bootcamper found in Firestore:', bootcamperCheck.data);
      return { exists: true, data: bootcamperCheck.data };
    } else {
      console.log('❌ Bootcamper not found in Firestore');
      return { exists: false };
    }
  } catch (error) {
    console.error('Error checking bootcamper:', error);
    return { exists: false, error: error.message };
  }
}