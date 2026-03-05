import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bootcamperService } from '../../firebase/firestore';


const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBootcampers: 0,
    activeBootcampers: 0,
    newRegistrations: 0,
    districts: 0,
    serialCounts: {},
    educationLevels: {}
  });
  
  const [recentBootcampers, setRecentBootcampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading admin dashboard data from Firebase...');
      
      // Get all bootcampers from Firebase
      const bootcampersResult = await bootcamperService.getAllBootcampers();
      console.log('Bootcampers result:', bootcampersResult);
      
      if (bootcampersResult.success && bootcampersResult.data) {
        const bootcampers = bootcampersResult.data;
        console.log('Total bootcampers loaded:', bootcampers.length);
        
        // Calculate statistics
        const totalBootcampers = bootcampers.length;
        const activeBootcampers = bootcampers.filter(b => b.status === 'active').length;
        
        // Calculate new registrations in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newRegistrations = bootcampers.filter(b => {
          const regDate = b.registeredAt ? new Date(b.registeredAt) : new Date(b.createdAt);
          return regDate >= sevenDaysAgo;
        }).length;
        
        // Calculate districts
        const districts = [...new Set(bootcampers.map(b => b.district).filter(Boolean))].length;
        
        // Calculate serial distribution
        const serialCounts = {};
        bootcampers.forEach(b => {
          if (b.serial) {
            serialCounts[b.serial] = (serialCounts[b.serial] || 0) + 1;
          }
        });
        
        // Calculate education levels
        const educationCounts = {};
        bootcampers.forEach(b => {
          if (b.educationLevel) {
            educationCounts[b.educationLevel] = (educationCounts[b.educationLevel] || 0) + 1;
          }
        });
        
        setStats({
          totalBootcampers,
          activeBootcampers,
          newRegistrations,
          districts,
          serialCounts,
          educationLevels: educationCounts
        });
        
        // Get recent bootcampers (last 5)
        const recent = bootcampers
          .sort((a, b) => {
            const dateA = a.registeredAt ? new Date(a.registeredAt) : new Date(a.createdAt);
            const dateB = b.registeredAt ? new Date(b.registeredAt) : new Date(b.createdAt);
            return dateB - dateA;
          })
          .slice(0, 5);
        
        console.log('Recent bootcampers:', recent);
        setRecentBootcampers(recent);
        
        if (bootcampers.length === 0) {
          console.warn('No bootcampers found in Firebase');
        }
      } else {
        console.error('Failed to load bootcampers:', bootcampersResult.error);
        setError(`Failed to load bootcampers: ${bootcampersResult.error}`);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getSerialColor = (serial) => {
    const colors = {
      'Serial 1': '#4CAF50',
      'Serial 2': '#2196F3',
      'Serial 3': '#FF9800',
      'Serial 4': '#9C27B0',
      'Serial 5': '#F44336',
      'Serial 6': '#00BCD4',
      'Serial 7': '#8BC34A',
      'Serial 8': '#FF5722'
    };
    return colors[serial] || '#607D8B';
  };

  const refreshDashboard = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Admin Dashboard</h1>
          <p>LDF Bootcamp Management System</p>
          {currentUser && (
            <p className="text-muted small">Logged in as: {currentUser.email}</p>
          )}
        </div>
        <div className="header-actions">
          <button 
            onClick={refreshDashboard} 
            className="btn btn-outline mr-2"
            title="Refresh dashboard data"
          >
            🔄 Refresh
          </button>
          <button onClick={handleLogout} className="btn btn-outline">Logout</button>
        </div>
      </header>
      
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <p>Total Bootcampers</p>
            <h3>{stats.totalBootcampers.toLocaleString()}</h3>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <p>Active Bootcampers</p>
            <h3>{stats.activeBootcampers.toLocaleString()}</h3>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <p>New Registrations (7 days)</p>
            <h3>{stats.newRegistrations.toLocaleString()}</h3>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <p>Districts Covered</p>
            <h3>{stats.districts.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="dashboard-row">
          <div className="dashboard-column">
            <div className="card">
              <div className="card-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="admin-actions">
                <Link to="/admin/add-bootcamper" className="admin-action-card">
                  <div className="action-icon">➕</div>
                  <h3>Add New Bootcamper</h3>
                  <p>Manually register a new bootcamper</p>
                </Link>
                <Link to="/admin/search" className="admin-action-card">
                  <div className="action-icon">🔍</div>
                  <h3>Search Bootcampers</h3>
                  <p>Find bootcampers by various criteria</p>
                </Link>
                <Link to="/admin/bootcampers" className="admin-action-card">
                  <div className="action-icon">📋</div>
                  <h3>View All Bootcampers</h3>
                  <p>Browse all registered bootcampers</p>
                </Link>
                <Link to="/admin/analytics" className="admin-action-card">
                  <div className="action-icon">📊</div>
                  <h3>Analytics</h3>
                  <p>View detailed reports & statistics</p>
                </Link>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Recent Registrations</h2>
                <button 
                  onClick={refreshDashboard} 
                  className="btn btn-sm btn-outline"
                  title="Refresh recent registrations"
                >
                  Refresh
                </button>
              </div>
              {recentBootcampers.length > 0 ? (
                <div className="recent-list">
                  {recentBootcampers.map(bootcamper => (
                    <div key={bootcamper.id || bootcamper.uid} className="recent-item">
                      <div className="recent-info">
                        <strong>{bootcamper.fullName || 'Unknown Name'}</strong>
                        <small>
                          {bootcamper.forceNumber || 'No Force Number'} • {bootcamper.serial || 'No Serial'}
                        </small>
                      </div>
                      <div className="recent-meta">
                        <span className="badge" style={{ backgroundColor: getSerialColor(bootcamper.serial) }}>
                          {bootcamper.serial || 'Unknown'}
                        </span>
                        <span className="text-muted">
                          {bootcamper.registeredAt ? new Date(bootcamper.registeredAt).toLocaleDateString() : 
                           bootcamper.createdAt ? new Date(bootcamper.createdAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="text-muted text-center">No bootcampers found in the database</p>
                  <button 
                    onClick={refreshDashboard} 
                    className="btn btn-primary btn-sm"
                  >
                    Check Again
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-column">
            <div className="card">
              <div className="card-header">
                <h2>Serial Distribution</h2>
              </div>
              <div className="serial-distribution">
                {Object.entries(stats.serialCounts).length > 0 ? (
                  Object.entries(stats.serialCounts).map(([serial, count]) => (
                    <div key={serial} className="serial-item">
                      <div className="serial-header">
                        <span className="serial-badge" style={{ backgroundColor: getSerialColor(serial) }}>
                          {serial}
                        </span>
                        <span className="serial-count">{count}</span>
                      </div>
                      <div className="serial-bar">
                        <div 
                          className="serial-fill"
                          style={{
                            width: `${stats.totalBootcampers > 0 ? (count / stats.totalBootcampers) * 100 : 0}%`,
                            backgroundColor: getSerialColor(serial)
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p className="text-muted text-center">No serial distribution data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Education Levels</h2>
              </div>
              <div className="education-levels">
                {Object.entries(stats.educationLevels).length > 0 ? (
                  Object.entries(stats.educationLevels).map(([level, count]) => (
                    <div key={level} className="education-item">
                      <span className="education-level">{level}</span>
                      <span className="education-count">{count}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p className="text-muted text-center">No education level data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;