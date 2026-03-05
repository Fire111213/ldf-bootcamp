import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Collections
const BOOTCAMPERS_COLLECTION = 'bootcampers';
const ADMINS_COLLECTION = 'admins';
const ACTIVITY_LOGS_COLLECTION = 'activityLogs';

// Bootcamper operations
export const addBootcamper = async (bootcamperData) => {
  try {
    // Create auth user first
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      bootcamperData.email,
      bootcamperData.password
    );
    
    const userId = userCredential.user.uid;
    
    // Prepare bootcamper document
    const bootcamperDoc = {
      ...bootcamperData,
      id: userId,
      uid: userId,
      registeredAt: serverTimestamp(),
      lastLogin: null,
      status: 'active',
      passwordChanged: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Remove password from Firestore document
    delete bootcamperDoc.password;
    
    // Add to Firestore
    await setDoc(doc(db, BOOTCAMPERS_COLLECTION, userId), bootcamperDoc);
    
    // Log activity
    await logActivity({
      action: 'REGISTER_BOOTCAMPER',
      performedBy: bootcamperData.registeredBy || 'admin',
      targetUserId: userId,
      details: {
        forceNumber: bootcamperData.forceNumber,
        name: bootcamperData.fullName
      },
      timestamp: serverTimestamp()
    });
    
    return { success: true, userId, email: bootcamperData.email };
  } catch (error) {
    console.error('Error adding bootcamper:', error);
    throw error;
  }
};

export const getBootcampers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, BOOTCAMPERS_COLLECTION));
    const bootcampers = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamps to Date objects
      const bootcamper = {
        ...data,
        id: doc.id,
        registeredAt: data.registeredAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLogin: data.lastLogin?.toDate() || null,
        statusChangedAt: data.statusChangedAt?.toDate() || null,
        lastPasswordReset: data.lastPasswordReset?.toDate() || null
      };
      bootcampers.push(bootcamper);
    });
    
    return bootcampers;
  } catch (error) {
    console.error('Error getting bootcampers:', error);
    throw error;
  }
};

export const getBootcamperById = async (id) => {
  try {
    const docRef = doc(db, BOOTCAMPERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        registeredAt: data.registeredAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLogin: data.lastLogin?.toDate() || null,
        statusChangedAt: data.statusChangedAt?.toDate() || null,
        lastPasswordReset: data.lastPasswordReset?.toDate() || null
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting bootcamper:', error);
    throw error;
  }
};

export const updateBootcamper = async (id, updates) => {
  try {
    const docRef = doc(db, BOOTCAMPERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating bootcamper:', error);
    throw error;
  }
};

export const deleteBootcamper = async (id, adminName) => {
  try {
    const docRef = doc(db, BOOTCAMPERS_COLLECTION, id);
    await deleteDoc(docRef);
    
    // Log activity
    await logActivity({
      action: 'DELETE_BOOTCAMPER',
      performedBy: adminName,
      targetUserId: id,
      timestamp: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting bootcamper:', error);
    throw error;
  }
};

export const searchBootcampers = async (searchCriteria) => {
  try {
    const bootcampers = await getBootcampers();
    
    // Apply filters in memory (for complex queries)
    let results = [...bootcampers];
    
    // Basic search term
    if (searchCriteria.searchTerm) {
      const term = searchCriteria.searchTerm.toLowerCase();
      results = results.filter(b => 
        b.fullName?.toLowerCase().includes(term) ||
        b.forceNumber?.toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.phone?.includes(term) ||
        b.idNumber?.includes(term)
      );
    }
    
    // Advanced filters
    if (searchCriteria.serial) {
      results = results.filter(b => b.serial === searchCriteria.serial);
    }
    
    if (searchCriteria.district) {
      results = results.filter(b => b.district === searchCriteria.district);
    }
    
    if (searchCriteria.educationLevel) {
      results = results.filter(b => b.educationLevel === searchCriteria.educationLevel);
    }
    
    if (searchCriteria.status) {
      results = results.filter(b => b.status === searchCriteria.status);
    }
    
    // Sort results
    if (searchCriteria.sortBy) {
      results.sort((a, b) => {
        let aValue = a[searchCriteria.sortBy];
        let bValue = b[searchCriteria.sortBy];
        
        // Handle dates
        if (searchCriteria.sortBy.includes('At') || searchCriteria.sortBy === 'registeredAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        if (searchCriteria.sortOrder === 'desc') {
          return bValue - aValue;
        }
        return aValue - bValue;
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error searching bootcampers:', error);
    throw error;
  }
};

// Activity logging
export const logActivity = async (activityData) => {
  try {
    await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), activityData);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Statistics
export const getBootcamperStats = async () => {
  try {
    const bootcampers = await getBootcampers();
    
    const stats = {
      totalBootcampers: bootcampers.length,
      activeBootcampers: bootcampers.filter(b => b.status === 'active').length,
      inactiveBootcampers: bootcampers.filter(b => b.status === 'inactive').length,
      serialDistribution: {},
      educationLevels: {},
      genderDistribution: {},
      districts: new Set(),
      registrationTrends: [],
      ageDistribution: {},
      monthlyRegistrations: {}
    };
    
    bootcampers.forEach(bootcamper => {
      // Count serials
      stats.serialDistribution[bootcamper.serial] = 
        (stats.serialDistribution[bootcamper.serial] || 0) + 1;
      
      // Count education levels
      stats.educationLevels[bootcamper.educationLevel] = 
        (stats.educationLevels[bootcamper.educationLevel] || 0) + 1;
      
      // Count genders
      stats.genderDistribution[bootcamper.gender] = 
        (stats.genderDistribution[bootcamper.gender] || 0) + 1;
      
      // Add district
      if (bootcamper.district) {
        stats.districts.add(bootcamper.district);
      }
      
      // Age distribution
      const age = parseInt(bootcamper.age) || 0;
      let ageGroup;
      if (age >= 16 && age <= 20) ageGroup = '16-20';
      else if (age <= 25) ageGroup = '21-25';
      else if (age <= 30) ageGroup = '26-30';
      else if (age <= 35) ageGroup = '31-35';
      else if (age <= 40) ageGroup = '36-40';
      
      if (ageGroup) {
        stats.ageDistribution[ageGroup] = (stats.ageDistribution[ageGroup] || 0) + 1;
      }
      
      // Monthly registrations
      if (bootcamper.registeredAt) {
        const date = new Date(bootcamper.registeredAt);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        stats.monthlyRegistrations[monthYear] = 
          (stats.monthlyRegistrations[monthYear] || 0) + 1;
      }
    });
    
    // Convert sets to arrays
    stats.districts = Array.from(stats.districts);
    
    return stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
};

// Reset password function
export const resetBootcamperPassword = async (bootcamperId, newPassword) => {
  try {
    // Note: In a real app, you would use Firebase Auth Admin SDK on backend
    // For frontend, we'll update the document and log the reset
    const docRef = doc(db, BOOTCAMPERS_COLLECTION, bootcamperId);
    
    await updateDoc(docRef, {
      passwordChanged: false,
      lastPasswordReset: serverTimestamp(),
      resetBy: 'admin'
    });
    
    // Log activity
    await logActivity({
      action: 'RESET_PASSWORD',
      performedBy: 'admin',
      targetUserId: bootcamperId,
      timestamp: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export { db, auth };