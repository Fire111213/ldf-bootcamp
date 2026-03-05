import { auth } from './config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';

import { 
  adminService, 
  bootcamperService 
} from './firestore';

export const authService = {
  // Register new bootcamper - NO STORAGE
  async register(email, password, userData) {
    try {
      console.log('Starting registration for:', email);
      
      // Validate required fields
      if (!email || !password || !userData.forceNumber || !userData.fullName) {
        return { success: false, error: 'Missing required fields' };
      }

      // Check if email already exists in bootcampers
      const existingBootcamper = await bootcamperService.getBootcamperByEmail(email);
      if (existingBootcamper.success) {
        return { success: false, error: 'Email already registered as bootcamper' };
      }

      // Check if email already exists in admins
      const adminCheck = await adminService.isAdmin(email);
      if (adminCheck.isAdmin) {
        return { success: false, error: 'Email already registered as admin' };
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification (optional)
      await sendEmailVerification(user);

      // Calculate age from date of birth
      let age = 0;
      if (userData.dateOfBirth) {
        const birthDate = new Date(userData.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Prepare complete bootcamper data (NO STORAGE FIELDS)
      const bootcamperData = {
        // Personal Information
        email: email.toLowerCase(),
        fullName: userData.fullName,
        forceNumber: userData.forceNumber,
        serial: userData.serial || '',
        
        // Demographic Information
        dateOfBirth: userData.dateOfBirth || '',
        idNumber: userData.idNumber || '',
        gender: userData.gender || '',
        age: age,
        
        // Contact Information
        district: userData.district || '',
        location: userData.location || '',
        phone: userData.phone || '',
        
        // Education Information
        educationLevel: userData.educationLevel || '',
        highSchool: userData.highSchool || '',
        grade: userData.grade || '',
        university: userData.university || '',
        course: userData.course || '',
        year: userData.year || '',
        
        // Work Information
        workplace: userData.workplace || '',
        position: userData.position || '',
        
        // System Information
        authUid: user.uid,
        passwordChanged: false,
        status: 'active',
        registeredBy: userData.registeredBy || 'self',
        registeredAt: new Date().toISOString(),
        
        // Files stored as base64 strings (NOT Storage URLs)
        photo: userData.photo || '', // base64 string
        highSchoolTranscripts: userData.highSchoolTranscripts || [], // array of base64 strings
        tertiaryTranscripts: userData.tertiaryTranscripts || [], // array of base64 strings
        
        // Metadata
        hasPhoto: !!userData.photo,
        hasTranscripts: (userData.highSchoolTranscripts && userData.highSchoolTranscripts.length > 0) || 
                       (userData.tertiaryTranscripts && userData.tertiaryTranscripts.length > 0),
        notes: userData.notes || ''
      };

      // Create bootcamper record in Firestore
      const bootcamperResult = await bootcamperService.createBootcamper(bootcamperData);
      
      if (bootcamperResult.success) {
        return { 
          success: true, 
          user: user,
          bootcamperId: bootcamperResult.id,
          bootcamperData: bootcamperResult.data,
          message: 'Registration successful. Please verify your email.' 
        };
      } else {
        // Delete auth user if bootcamper creation failed
        try {
          await user.delete();
        } catch (deleteError) {
          console.error('Error deleting auth user:', deleteError);
        }
        return { success: false, error: bootcamperResult.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Login user
  async login(email, password) {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified (optional requirement)
      if (!user.emailVerified) {
        console.log('Email not verified for user:', email);
        // You can choose to allow login without verification or require it
      }

      // Check if user is admin
      const adminCheck = await adminService.isAdmin(email);
      
      if (adminCheck.isAdmin) {
        return { 
          success: true, 
          user: user, 
          role: 'admin',
          emailVerified: user.emailVerified,
          message: 'Admin login successful' 
        };
      } else {
        // Check if user is bootcamper
        const bootcamperCheck = await bootcamperService.getBootcamperByEmail(email);
        
        if (bootcamperCheck.success) {
          const bootcamper = bootcamperCheck.data;
          
          // Check if account is active
          if (bootcamper.status === 'inactive') {
            await auth.signOut();
            return { success: false, error: 'Account has been deactivated. Contact support.' };
          }

          return { 
            success: true, 
            user: user, 
            role: 'bootcamper',
            bootcamper: bootcamper,
            requiresPasswordChange: !bootcamper.passwordChanged,
            emailVerified: user.emailVerified,
            message: 'Login successful' 
          };
        } else {
          // User authenticated but not found in our system
          await auth.signOut();
          return { success: false, error: 'Account not found in system. Please register.' };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please register first.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Try again later or reset your password.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Account has been disabled. Contact support.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        message: 'Password reset email sent. Check your inbox.' 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Change password
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      await updatePassword(user, newPassword);
      
      // Update bootcamper record if exists
      const bootcamperCheck = await bootcamperService.getBootcamperByEmail(user.email);
      if (bootcamperCheck.success) {
        await bootcamperService.updateBootcamper(bootcamperCheck.data.id, {
          passwordChanged: true,
          lastPasswordChange: new Date().toISOString()
        });
      }
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      
      let errorMessage = 'Failed to change password';
      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Please re-login to change your password';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Get current user
  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  },

  // Auth state change listener
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Check if user exists
  async checkUserExists(email) {
    try {
      const methods = await auth.fetchSignInMethodsForEmail(email);
      return { success: true, exists: methods.length > 0 };
    } catch (error) {
      console.error('Check user exists error:', error);
      return { success: false, error: error.message };
    }
  }
};