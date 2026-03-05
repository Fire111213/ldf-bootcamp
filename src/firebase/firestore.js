import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Import Firebase instances from config.js
import { db, auth } from './config';

// Admin Management Service
export const adminService = {
  // Check if user is admin
  isUserAdmin: async (userId) => {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      return adminDoc.exists();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Add user as admin
  addAdmin: async (userId, email) => {
    try {
      await setDoc(doc(db, 'admins', userId), {
        email: email,
        role: 'admin',
        createdAt: serverTimestamp(),
        addedBy: auth.currentUser?.uid || 'system'
      });
      return { success: true, message: 'Admin added successfully' };
    } catch (error) {
      console.error('Error adding admin:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove user as admin
  removeAdmin: async (userId) => {
    try {
      await deleteDoc(doc(db, 'admins', userId));
      return { success: true, message: 'Admin removed successfully' };
    } catch (error) {
      console.error('Error removing admin:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all admins
  getAllAdmins: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const admins = [];
      querySnapshot.forEach((doc) => {
        admins.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: admins };
    } catch (error) {
      console.error('Error getting admins:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if email is admin
  isAdmin: async (email) => {
    try {
      const q = query(collection(db, 'admins'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return { isAdmin: !querySnapshot.empty };
    } catch (error) {
      console.error('Error checking admin by email:', error);
      return { isAdmin: false, error: error.message };
    }
  },

  // Initialize admin setup (run this once)
  setupInitialAdmin: async (email, password) => {
    try {
      // Create admin user in Auth
      const authResult = await createUserWithEmailAndPassword(auth, email, password);
      const userId = authResult.user.uid;
      
      // Add to admins collection
      await setDoc(doc(db, 'admins', userId), {
        email: email,
        role: 'super-admin',
        createdAt: serverTimestamp(),
        isInitialAdmin: true
      });
      
      return { 
        success: true, 
        message: 'Initial admin created successfully',
        userId: userId
      };
    } catch (error) {
      console.error('Error setting up initial admin:', error);
      return { success: false, error: error.message };
    }
  }
};

// Bootcamper Service
export const bootcamperService = {
  // Get bootcamper by Auth UID
  getBootcamperByAuthUid: async (uid) => {
    try {
      console.log('🔍 Getting bootcamper by Auth UID:', uid);
      
      // First try to find by uid field
      const q1 = query(collection(db, 'bootcampers'), where('uid', '==', uid));
      const querySnapshot1 = await getDocs(q1);
      
      if (!querySnapshot1.empty) {
        const doc = querySnapshot1.docs[0];
        const data = doc.data();
        console.log('✅ Found bootcamper by uid field');
        return {
          success: true,
          data: {
            id: doc.id,
            ...data,
            registeredAt: data.registeredAt ? data.registeredAt.toDate() : null,
            createdAt: data.createdAt ? data.createdAt.toDate() : null
          }
        };
      }
      
      // If not found by uid, try to find by document ID (ID = uid)
      const docRef = doc(db, 'bootcampers', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Found bootcamper by document ID');
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...data,
            registeredAt: data.registeredAt ? data.registeredAt.toDate() : null,
            createdAt: data.createdAt ? data.createdAt.toDate() : null
          }
        };
      }
      
      // If still not found, try email match
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const q2 = query(collection(db, 'bootcampers'), where('email', '==', currentUser.email));
        const querySnapshot2 = await getDocs(q2);
        
        if (!querySnapshot2.empty) {
          const doc = querySnapshot2.docs[0];
          const data = doc.data();
          console.log('✅ Found bootcamper by email');
          return {
            success: true,
            data: {
              id: doc.id,
              ...data,
              registeredAt: data.registeredAt ? data.registeredAt.toDate() : null,
              createdAt: data.createdAt ? data.createdAt.toDate() : null
            }
          };
        }
      }
      
      console.log('❌ Bootcamper not found for UID:', uid);
      return { success: false, error: 'Bootcamper not found' };
    } catch (error) {
      console.error('❌ Error getting bootcamper by Auth UID:', error);
      return { success: false, error: error.message };
    }
  },

  // Get bootcamper by ID (document ID)
  getBootcamperById: async (id) => {
    try {
      const docRef = doc(db, 'bootcampers', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          success: true, 
          data: { 
            id: docSnap.id, 
            ...data,
            registeredAt: data.registeredAt ? data.registeredAt.toDate() : null,
            createdAt: data.createdAt ? data.createdAt.toDate() : null
          } 
        };
      } else {
        return { success: false, error: 'Bootcamper not found' };
      }
    } catch (error) {
      console.error('Error getting bootcamper:', error);
      return { success: false, error: error.message };
    }
  },

  // Get bootcamper by email
  getBootcamperByEmail: async (email) => {
    try {
      const q = query(collection(db, 'bootcampers'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          success: true,
          data: {
            id: doc.id,
            ...data,
            registeredAt: data.registeredAt ? data.registeredAt.toDate() : null,
            createdAt: data.createdAt ? data.createdAt.toDate() : null
          }
        };
      } else {
        return { success: false, error: 'Bootcamper not found' };
      }
    } catch (error) {
      console.error('Error getting bootcamper by email:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all bootcampers
  getAllBootcampers: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'bootcampers'));
      const bootcampers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bootcampers.push({ 
          id: doc.id, 
          ...data,
          registeredAt: data.registeredAt ? data.registeredAt.toDate() : null,
          createdAt: data.createdAt ? data.createdAt.toDate() : null
        });
      });
      console.log('✅ Successfully loaded', bootcampers.length, 'bootcampers from Firebase');
      return { success: true, data: bootcampers };
    } catch (error) {
      console.error('❌ Error getting all bootcampers:', error);
      return { success: false, error: error.message };
    }
  },

  // Register new bootcamper (UPDATED - NO STORAGE)
  registerBootcamper: async (bootcamperData) => {
    try {
      console.log('🚀 Starting bootcamper registration for:', bootcamperData.email);
      
      // Check if email already exists in Firestore
      const emailCheck = await bootcamperService.checkEmailExists(bootcamperData.email);
      if (emailCheck.success && emailCheck.exists) {
        return { 
          success: false, 
          error: 'This email is already registered. Please use a different email.' 
        };
      }
      
      // Check if force number already exists
      const forceNumberCheck = await bootcamperService.checkForceNumberExists(bootcamperData.forceNumber);
      if (forceNumberCheck.success && forceNumberCheck.exists) {
        return { 
          success: false, 
          error: 'This force number is already registered.' 
        };
      }
      
      // Create user in Firebase Auth
      console.log('Creating Firebase Auth user...');
      const authResult = await createUserWithEmailAndPassword(
        auth, 
        bootcamperData.email, 
        bootcamperData.password
      );
      
      const userId = authResult.user.uid;
      console.log('✅ Auth user created:', userId);
      
      // Prepare bootcamper document (NO STORAGE FIELDS)
      const bootcamperDoc = {
        uid: userId,
        forceNumber: bootcamperData.forceNumber,
        email: bootcamperData.email,
        fullName: bootcamperData.fullName,
        serial: bootcamperData.serial,
        dateOfBirth: bootcamperData.dateOfBirth,
        idNumber: bootcamperData.idNumber,
        gender: bootcamperData.gender,
        district: bootcamperData.district,
        location: bootcamperData.location,
        phone: bootcamperData.phone,
        educationLevel: bootcamperData.educationLevel,
        highSchool: bootcamperData.highSchool || '',
        grade: bootcamperData.grade || '',
        university: bootcamperData.university || '',
        course: bootcamperData.course || '',
        year: bootcamperData.year || '',
        workplace: bootcamperData.workplace || '',
        position: bootcamperData.position || '',
        age: parseInt(bootcamperData.age) || 0,
        // Photo and transcripts are stored as base64 strings
        photo: bootcamperData.photo || null,
        highSchoolTranscripts: bootcamperData.highSchoolTranscripts || [],
        tertiaryTranscripts: bootcamperData.tertiaryTranscripts || [],
        status: 'active',
        registeredAt: serverTimestamp(),
        registeredBy: bootcamperData.registeredBy || 'self-registration',
        passwordChanged: false,
        lastPasswordReset: serverTimestamp(),
        resetBy: 'system',
        createdAt: serverTimestamp(),
        // Metadata
        hasPhoto: !!bootcamperData.photo,
        hasTranscripts: (bootcamperData.highSchoolTranscripts && bootcamperData.highSchoolTranscripts.length > 0) || 
                       (bootcamperData.tertiaryTranscripts && bootcamperData.tertiaryTranscripts.length > 0)
      };
      
      // Save to Firestore
      console.log('Saving to Firestore...');
      await setDoc(doc(db, 'bootcampers', userId), bootcamperDoc);
      console.log('✅ Bootcamper document saved to Firestore');
      
      return { 
        success: true, 
        message: 'Bootcamper registered successfully',
        userId: userId
      };
    } catch (error) {
      console.error('❌ Error registering bootcamper:', error);
      
      // Handle specific Firebase Auth errors
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or login.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Update bootcamper profile
  updateBootcamper: async (userId, updateData) => {
    try {
      await updateDoc(doc(db, 'bootcampers', userId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('Error updating bootcamper:', error);
      return { success: false, error: error.message };
    }
  },

  // Update bootcamper status
  updateBootcamperStatus: async (id, status) => {
    try {
      await updateDoc(doc(db, 'bootcampers', id), {
        status: status,
        statusChangedAt: serverTimestamp(),
        statusChangedBy: auth.currentUser?.email || 'admin'
      });
      return { success: true, message: 'Status updated successfully' };
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  resetPassword: async (userId, newPassword) => {
    try {
      // Get the bootcamper's email first
      const bootcamperDoc = await getDoc(doc(db, 'bootcampers', userId));
      
      if (!bootcamperDoc.exists()) {
        return { success: false, error: 'Bootcamper not found' };
      }
      
      const bootcamperData = bootcamperDoc.data();
      
      // Send password reset email
      await sendPasswordResetEmail(auth, bootcamperData.email);
      
      // Update Firestore document
      await updateDoc(doc(db, 'bootcampers', userId), {
        passwordChanged: false,
        lastPasswordReset: serverTimestamp(),
        resetBy: 'admin'
      });
      
      return { 
        success: true, 
        message: 'Password reset email sent successfully. Please check your email.' 
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message };
    }
  },

  // Change password (for bootcampers)
  changePassword: async (currentPassword, newPassword) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return { success: false, error: 'No user logged in' };
      }
      
      // Re-authenticate user
      const credential = await signInWithEmailAndPassword(auth, user.email, currentPassword);
      
      // Update password
      await updatePassword(credential.user, newPassword);
      
      // Update Firestore
      await updateDoc(doc(db, 'bootcampers', user.uid), {
        passwordChanged: true,
        lastPasswordChange: serverTimestamp()
      });
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      
      let errorMessage = error.message;
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Delete bootcamper
  deleteBootcamper: async (id) => {
    try {
      await deleteDoc(doc(db, 'bootcampers', id));
      return { success: true, message: 'Bootcamper deleted successfully' };
    } catch (error) {
      console.error('Error deleting bootcamper:', error);
      return { success: false, error: error.message };
    }
  },

  // Search bootcampers
  searchBootcampers: async (criteria) => {
    try {
      console.log('Searching bootcampers with criteria:', criteria);
      
      let q = collection(db, 'bootcampers');
      const constraints = [];
      
      // Apply filters
      if (criteria.serial) {
        constraints.push(where('serial', '==', criteria.serial));
      }
      if (criteria.district) {
        constraints.push(where('district', '==', criteria.district));
      }
      if (criteria.educationLevel) {
        constraints.push(where('educationLevel', '==', criteria.educationLevel));
      }
      
      const querySnapshot = constraints.length > 0 
        ? await getDocs(query(q, ...constraints))
        : await getDocs(q);
        
      const bootcampers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bootcampers.push({ 
          id: doc.id, 
          ...data,
          registeredAt: data.registeredAt ? data.registeredAt.toDate() : null,
          createdAt: data.createdAt ? data.createdAt.toDate() : null
        });
      });
      
      console.log('Found', bootcampers.length, 'bootcampers before filtering');
      
      // Apply client-side filtering
      let filtered = bootcampers;
      
      if (criteria.searchTerm && criteria.searchTerm.trim()) {
        const term = criteria.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(b => 
          (b.fullName && b.fullName.toLowerCase().includes(term)) ||
          (b.forceNumber && b.forceNumber.toLowerCase().includes(term)) ||
          (b.email && b.email.toLowerCase().includes(term)) ||
          (b.phone && b.phone.includes(term)) ||
          (b.idNumber && b.idNumber.includes(term)) ||
          (b.highSchool && b.highSchool.toLowerCase().includes(term)) ||
          (b.university && b.university.toLowerCase().includes(term)) ||
          (b.course && b.course.toLowerCase().includes(term))
        );
      }
      
      // Apply age range filter
      if (criteria.minAge) {
        filtered = filtered.filter(b => parseInt(b.age) >= parseInt(criteria.minAge));
      }
      if (criteria.maxAge) {
        filtered = filtered.filter(b => parseInt(b.age) <= parseInt(criteria.maxAge));
      }
      
      console.log('Returning', filtered.length, 'filtered bootcampers');
      return { success: true, data: filtered };
    } catch (error) {
      console.error('Error searching bootcampers:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if force number exists
  checkForceNumberExists: async (forceNumber) => {
    try {
      const q = query(collection(db, 'bootcampers'), where('forceNumber', '==', forceNumber));
      const querySnapshot = await getDocs(q);
      return { success: true, exists: !querySnapshot.empty };
    } catch (error) {
      console.error('Error checking force number:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if email exists
  checkEmailExists: async (email) => {
    try {
      const q = query(collection(db, 'bootcampers'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return { success: true, exists: !querySnapshot.empty };
    } catch (error) {
      console.error('Error checking email:', error);
      return { success: false, error: error.message };
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const bootcampersResult = await bootcamperService.getAllBootcampers();
      
      if (!bootcampersResult.success) {
        return bootcampersResult;
      }
      
      const bootcampers = bootcampersResult.data;
      
      // Calculate statistics
      const totalBootcampers = bootcampers.length;
      const activeBootcampers = bootcampers.filter(b => b.status === 'active').length;
      
      // Calculate new registrations in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newRegistrations = bootcampers.filter(b => {
        const regDate = b.registeredAt || b.createdAt || new Date();
        return new Date(regDate) >= sevenDaysAgo;
      }).length;
      
      // Calculate districts
      const districts = [...new Set(bootcampers.map(b => b.district).filter(Boolean))].length;
      
      // Calculate serial counts
      const serialCounts = {};
      bootcampers.forEach(b => {
        if (b.serial) {
          serialCounts[b.serial] = (serialCounts[b.serial] || 0) + 1;
        }
      });
      
      // Calculate education counts
      const educationCounts = {};
      bootcampers.forEach(b => {
        if (b.educationLevel) {
          educationCounts[b.educationLevel] = (educationCounts[b.educationLevel] || 0) + 1;
        }
      });
      
      // Calculate gender distribution
      const genderCounts = {};
      bootcampers.forEach(b => {
        if (b.gender) {
          genderCounts[b.gender] = (genderCounts[b.gender] || 0) + 1;
        }
      });
      
      // Calculate age distribution
      const ageGroups = {
        '16-20': 0,
        '21-25': 0,
        '26-30': 0,
        '31-35': 0,
        '36-40': 0
      };
      bootcampers.forEach(b => {
        const age = parseInt(b.age) || 0;
        if (age >= 16 && age <= 20) ageGroups['16-20']++;
        else if (age <= 25) ageGroups['21-25']++;
        else if (age <= 30) ageGroups['26-30']++;
        else if (age <= 35) ageGroups['31-35']++;
        else if (age <= 40) ageGroups['36-40']++;
      });
      
      return {
        success: true,
        data: {
          totalBootcampers,
          activeBootcampers,
          newRegistrations,
          districts,
          serialCounts,
          educationCounts,
          genderCounts,
          ageGroups
        }
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return { success: false, error: error.message };
    }
  }
};

// Auth Service for login/register
export const authService = {
  // Register new user
  register: async (email, password, userData) => {
    try {
      // Check if email exists first
      const emailCheck = await bootcamperService.checkEmailExists(email);
      if (emailCheck.success && emailCheck.exists) {
        return { 
          success: false, 
          error: 'This email is already registered. Please login instead.' 
        };
      }
      
      // Create user in Firebase Auth
      const authResult = await createUserWithEmailAndPassword(auth, email, password);
      const userId = authResult.user.uid;
      
      // Create user document in Firestore
      const userDoc = {
        uid: userId,
        email: email,
        ...userData,
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', userId), userDoc);
      
      return { 
        success: true, 
        message: 'Registration successful',
        userId: userId
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or login.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const authResult = await signInWithEmailAndPassword(auth, email, password);
      const userId = authResult.user.uid;
      
      // Update last login in Firestore
      try {
        await updateDoc(doc(db, 'users', userId), {
          lastLogin: serverTimestamp()
        });
      } catch (firestoreError) {
        console.log('Note: Could not update last login:', firestoreError.message);
      }
      
      return { 
        success: true, 
        message: 'Login successful',
        userId: userId
      };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later.';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await auth.signOut();
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      return { success: false, error: errorMessage };
    }
  }
};

// Export Firebase instances and services
export { db, auth };
export default { 
  db, 
  auth, 
  bootcamperService, 
  adminService,
  authService 
};