import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      console.log('Attempting login with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Login successful, user UID:', user.uid);
      
      // SPECIAL CASE: Check if this is the admin email FIRST
      if (email === 'lesothodefenceforce04@gmail.com') {
        console.log('✅ Admin login detected!');
        
        // Check if admin document exists
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        
        let adminData;
        if (adminDoc.exists()) {
          adminData = adminDoc.data();
          console.log('Found existing admin document');
        } else {
          // Create admin document if it doesn't exist
          adminData = {
            email: user.email,
            role: 'admin',
            fullName: 'Administrator',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isInitialAdmin: true
          };
          
          await setDoc(doc(db, 'admins', user.uid), adminData);
          console.log('Created new admin document');
        }
        
        // Also create/update in bootcampers for backward compatibility
        const bootcamperRef = doc(db, 'bootcampers', user.uid);
        const bootcamperDoc = await getDoc(bootcamperRef);
        
        if (!bootcamperDoc.exists()) {
          // Create minimal record in bootcampers to prevent errors
          await setDoc(bootcamperRef, {
            uid: user.uid,
            email: user.email,
            role: 'admin',
            fullName: 'Administrator',
            forceNumber: 'ADMIN',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        // Store user data
        const userData = {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          fullName: 'Administrator',
          forceNumber: 'ADMIN'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        setCurrentUser(user);
        setUserRole('admin');
        setUserData(userData);
        setLoading(false);
        
        return { 
          success: true, 
          user, 
          role: 'admin',
          data: userData
        };
      }
      
      // FOR NON-ADMIN USERS: Check bootcampers collection
      console.log('Checking bootcampers collection for:', email);
      
      // Try to get user data from bootcampers collection
      let userDoc = await getDoc(doc(db, 'bootcampers', user.uid));
      let role = 'bootcamper';
      let userData = null;
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        role = userData.role || 'bootcamper';
        console.log('Found user in bootcampers collection');
      } else {
        // Fallback: Try users collection
        userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
          role = userData.role || 'bootcamper';
          console.log('Found user in users collection');
        } else {
          // No user data found - this shouldn't happen for regular users
          console.log('No user data found for non-admin user');
          await auth.signOut();
          setLoading(false);
          return { 
            success: false, 
            error: 'Account not properly set up. Please contact support.' 
          };
        }
      }
      
      // Store user data
      const userDataForStorage = {
        uid: user.uid,
        email: user.email,
        role: role,
        ...userData
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userDataForStorage));
      
      setCurrentUser(user);
      setUserRole(role);
      setUserData(userData);
      setLoading(false);
      
      return { 
        success: true, 
        user, 
        role,
        data: userData
      };
      
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error.code, error.message);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Registration function (unchanged)
  const register = async (email, password, userData) => {
    setLoading(true);
    try {
      console.log('Starting registration for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created, UID:', user.uid);
      
      // Prepare user info
      const userInfo = {
        uid: user.uid,
        email: user.email,
        role: 'bootcamper',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData
      };
      
      // Save to both collections for compatibility
      await setDoc(doc(db, 'bootcampers', user.uid), userInfo);
      await setDoc(doc(db, 'users', user.uid), userInfo);
      
      // Store in localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: 'bootcamper',
        ...userInfo
      }));
      
      setCurrentUser(user);
      setUserRole('bootcamper');
      setUserData(userInfo);
      setLoading(false);
      
      return { success: true, user, data: userInfo };
      
    } catch (error) {
      setLoading(false);
      console.error('Registration error:', error.code, error.message);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak (minimum 6 characters)';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Registration is currently disabled';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Update user data
  const updateUserData = async (updates) => {
    try {
      if (!currentUser) return { success: false, error: 'No user logged in' };
      
      const updatedData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Update in appropriate collection based on role
      if (userRole === 'admin') {
        await updateDoc(doc(db, 'admins', currentUser.uid), updatedData);
      } else {
        await updateDoc(doc(db, 'bootcampers', currentUser.uid), updatedData);
        await updateDoc(doc(db, 'users', currentUser.uid), updatedData);
      }
      
      // Update local state
      setUserData(prev => ({ ...prev, ...updatedData }));
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...storedUser,
        ...updatedData
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { success: false, error: error.message };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setUserData(null);
      localStorage.removeItem('currentUser');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get current user's data
  const getUserData = () => {
    return userData;
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Auth state changed - user logged in:', user.uid);
        setCurrentUser(user);
        
        try {
          // SPECIAL CASE: Check if this is the admin
          if (user.email === 'lesothodefenceforce04@gmail.com') {
            console.log('Admin detected in auth state');
            
            // Get admin data
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            
            if (adminDoc.exists()) {
              const data = adminDoc.data();
              setUserRole('admin');
              setUserData(data);
              
              localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                role: 'admin',
                ...data
              }));
            } else {
              // Create admin document if it doesn't exist
              const adminData = {
                email: user.email,
                role: 'admin',
                fullName: 'Administrator',
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              
              await setDoc(doc(db, 'admins', user.uid), adminData);
              setUserRole('admin');
              setUserData(adminData);
              
              localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                role: 'admin',
                ...adminData
              }));
            }
            
            setLoading(false);
            return;
          }
          
          // For non-admin users, check bootcampers
          let userDoc = await getDoc(doc(db, 'bootcampers', user.uid));
          let role = 'bootcamper';
          let data = null;
          
          if (userDoc.exists()) {
            data = userDoc.data();
            role = data.role || 'bootcamper';
          } else {
            // Fallback to users collection
            userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              data = userDoc.data();
              role = data.role || 'bootcamper';
            }
          }
          
          setUserRole(role);
          setUserData(data);
          
          if (data) {
            localStorage.setItem('currentUser', JSON.stringify({
              uid: user.uid,
              email: user.email,
              role: role,
              ...data
            }));
          }
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          
          // If admin and error occurs, still set role as admin
          if (user.email === 'lesothodefenceforce04@gmail.com') {
            setUserRole('admin');
            setUserData({ email: user.email, role: 'admin' });
          } else {
            setUserRole('bootcamper');
            setUserData(null);
          }
        }
        
        setLoading(false);
      } else {
        console.log('Auth state changed - user logged out');
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    loading,
    login,
    register,
    logout,
    updateUserData,
    resetPassword,
    getUserData,
    isAuthenticated: !!currentUser,
    isAdmin: userRole === 'admin',
    isBootcamper: userRole === 'bootcamper'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };