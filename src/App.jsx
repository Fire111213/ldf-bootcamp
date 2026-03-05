import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PrivateRoute from './components/Auth/PrivateRoute';

// Bootcamper Components
import BootcamperDashboard from './components/BootcamperPanel/BootcamperDashboard';
import ChangePassword from './components/Auth/ChangePassword';
import ProfileUpdate from './components/BootcamperPanel/ProfileUpdate';
import ForcePasswordChange from './components/Auth/ForcePasswordChange';

// Admin Components
import AdminDashboard from './components/AdminPanel/AdminDashboard';
import AddBootcamper from './components/AdminPanel/AddBootcamper';
import SearchBootcamper from './components/AdminPanel/SearchBootcamper';
import BootcamperTable from './components/AdminPanel/BootcamperTable';

// Styles
import './styles/theme.css';
import './styles/App.css';
import './styles/responsive.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
    setLoading(false);
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('role', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            isAuthenticated ? 
            <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/bootcamper/dashboard'} /> : 
            <Login onLogin={handleLogin} />
          } />
          
          <Route path="/register" element={
            isAuthenticated ? 
            <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/bootcamper/dashboard'} /> : 
            <Register />
          } />
          
          {/* Bootcamper Protected Routes */}
          <Route path="/bootcamper/dashboard" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="bootcamper">
              <BootcamperDashboard onLogout={handleLogout} />
            </PrivateRoute>
          } />
          
          <Route path="/bootcamper/profile" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="bootcamper">
              <ProfileUpdate />
            </PrivateRoute>
          } />
          
          <Route path="/bootcamper/password" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="bootcamper">
              <ChangePassword />
            </PrivateRoute>
          } />
          
          <Route path="/bootcamper/force-password-change" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="bootcamper">
              <ForcePasswordChange />
            </PrivateRoute>
          } />
          
          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="admin">
              <AdminDashboard onLogout={handleLogout} />
            </PrivateRoute>
          } />
          
          <Route path="/admin/add-bootcamper" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="admin">
              <AddBootcamper />
            </PrivateRoute>
          } />
          
          <Route path="/admin/search" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="admin">
              <SearchBootcamper />
            </PrivateRoute>
          } />
          
          <Route path="/admin/bootcampers" element={
            <PrivateRoute isAuthenticated={isAuthenticated} role="admin">
              <BootcamperTable />
            </PrivateRoute>
          } />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;