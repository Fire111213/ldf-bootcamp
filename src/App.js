import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminDashboard from './components/AdminPanel/AdminDashboard';
import BootcamperDashboard from './components/BootcamperPanel/BootcamperDashboard';
import ForcePasswordChange from './components/Auth/ForcePasswordChange';
import UpdateProfile from './components/BootcamperPanel/UpdateProfile';
import UpdateEducation from './components/BootcamperPanel/UpdateEducation';
import ChangePassword from './components/Auth/ChangePassword';
import PrivateRoute from './components/Auth/PrivateRoute';
import AllBootcampers from './components/AdminPanel/AllBootcampers';
import AddBootcamper from './components/AdminPanel/AddBootcamper';
import SearchBootcamper from './components/AdminPanel/SearchBootcamper';
import BootcamperDetails from './components/AdminPanel/BootcamperDetails';
import Analytics from './components/AdminPanel/Analytics';
import './styles/App.css';
import './styles/responsive.css';

const AppContent = () => {
  const { loading, isAuthenticated, userRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Bootcamper Routes */}
      <Route path="/bootcamper/dashboard" element={
        <PrivateRoute allowedRoles={['bootcamper', 'admin']}>
          <BootcamperDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/bootcamper/force-password-change" element={
        <PrivateRoute allowedRoles={['bootcamper', 'admin']}>
          <ForcePasswordChange />
        </PrivateRoute>
      } />
      
      <Route path="/bootcamper/profile" element={
        <PrivateRoute allowedRoles={['bootcamper', 'admin']}>
          <UpdateProfile />
        </PrivateRoute>
      } />
      
      <Route path="/bootcamper/education" element={
        <PrivateRoute allowedRoles={['bootcamper', 'admin']}>
          <UpdateEducation />
        </PrivateRoute>
      } />
      
      <Route path="/bootcamper/password" element={
        <PrivateRoute allowedRoles={['bootcamper', 'admin']}>
          <ChangePassword />
        </PrivateRoute>
      } />
      
      {/* Protected Admin Routes */}
      <Route path="/admin/dashboard" element={
        <PrivateRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/admin/bootcampers" element={
        <PrivateRoute allowedRoles={['admin']}>
          <AllBootcampers />
        </PrivateRoute>
      } />
      
      <Route path="/admin/add-bootcamper" element={
        <PrivateRoute allowedRoles={['admin']}>
          <AddBootcamper />
        </PrivateRoute>
      } />
      
      <Route path="/admin/search" element={
        <PrivateRoute allowedRoles={['admin']}>
          <SearchBootcamper />
        </PrivateRoute>
      } />
      
      <Route path="/admin/analytics" element={
        <PrivateRoute allowedRoles={['admin']}>
          <Analytics />
        </PrivateRoute>
      } />
      
      <Route path="/admin/bootcamper/:id" element={
        <PrivateRoute allowedRoles={['admin']}>
          <BootcamperDetails />
        </PrivateRoute>
      } />
      
      {/* Default Route - Redirect based on authentication */}
      <Route path="/" element={
        isAuthenticated ? (
          userRole === 'admin' ? (
            <Navigate to="/admin/dashboard" />
          ) : (
            <Navigate to="/bootcamper/dashboard" />
          )
        ) : (
          <Navigate to="/login" />
        )
      } />
      
      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;