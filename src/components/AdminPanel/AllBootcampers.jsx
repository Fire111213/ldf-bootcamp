import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bootcamperService } from '../../firebase/firestore';
import { SERIALS } from '../../utils/constants';

const AllBootcampers = () => {
  const [bootcampers, setBootcampers] = useState([]);
  const [filteredBootcampers, setFilteredBootcampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSerial, setSelectedSerial] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    loadBootcampers();
  }, []);

  useEffect(() => {
    filterAndSortBootcampers();
  }, [bootcampers, searchTerm, selectedSerial, selectedDistrict, selectedEducation, sortBy, sortOrder]);

  const loadBootcampers = async () => {
    try {
      setLoading(true);
      const result = await bootcamperService.getAllBootcampers();
      
      if (result.success && result.data) {
        setBootcampers(result.data);
        setFilteredBootcampers(result.data);
      } else {
        console.error('Failed to load bootcampers:', result.error);
      }
    } catch (error) {
      console.error('Error loading bootcampers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBootcampers = () => {
    let filtered = [...bootcampers];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.fullName?.toLowerCase().includes(term) ||
        b.forceNumber?.toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.phone?.includes(term) ||
        b.idNumber?.includes(term) ||
        b.highSchool?.toLowerCase().includes(term) ||
        b.university?.toLowerCase().includes(term) ||
        b.course?.toLowerCase().includes(term) ||
        b.district?.toLowerCase().includes(term)
      );
    }

    // Apply serial filter
    if (selectedSerial) {
      filtered = filtered.filter(b => b.serial === selectedSerial);
    }

    // Apply district filter
    if (selectedDistrict) {
      filtered = filtered.filter(b => b.district === selectedDistrict);
    }

    // Apply education level filter
    if (selectedEducation) {
      filtered = filtered.filter(b => b.educationLevel === selectedEducation);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      // Handle date sorting
      if (sortBy === 'registeredAt' || sortBy === 'createdAt') {
        aValue = new Date(a[sortBy] || 0);
        bValue = new Date(b[sortBy] || 0);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBootcampers(filtered);
    setCurrentPage(1);
  };

  const handleDeleteBootcamper = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this bootcamper? This action cannot be undone.')) {
      try {
        const result = await bootcamperService.deleteBootcamper(id);
        if (result.success) {
          alert('Bootcamper deleted successfully!');
          loadBootcampers();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting bootcamper:', error);
        alert('Error deleting bootcamper');
      }
    }
  };

  const handleViewDetails = (bootcamper) => {
    navigate(`/admin/bootcamper/${bootcamper.id || bootcamper.uid}`, { state: { bootcamper } });
  };

  const handleResetPassword = async (bootcamper) => {
    const newPassword = prompt(`Enter new password for ${bootcamper.fullName} (minimum 8 characters):`);
    if (newPassword && newPassword.length >= 8) {
      try {
        const result = await bootcamperService.resetPassword(bootcamper.id || bootcamper.uid, newPassword);
        if (result.success) {
          alert('Password reset successfully! The bootcamper will need to change it on first login.');
          loadBootcampers();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        alert('Error resetting password');
      }
    } else if (newPassword) {
      alert('Password must be at least 8 characters long.');
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    const bootcamper = bootcampers.find(b => b.id === id || b.uid === id);
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${action} ${bootcamper?.fullName}?`)) {
      try {
        const result = await bootcamperService.updateBootcamperStatus(id, newStatus);
        if (result.success) {
          alert(`Account ${action}d successfully!`);
          loadBootcampers();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status');
      }
    }
  };

  const handleBulkAction = async (action) => {
    const selectedBootcampers = filteredBootcampers.slice(startIndex, endIndex);
    
    if (selectedBootcampers.length === 0) {
      alert('No bootcampers selected on this page.');
      return;
    }

    if (action === 'activate') {
      if (window.confirm(`Activate ${selectedBootcampers.length} bootcampers?`)) {
        try {
          const promises = selectedBootcampers.map(bootcamper => 
            bootcamperService.updateBootcamperStatus(bootcamper.id || bootcamper.uid, 'active')
          );
          await Promise.all(promises);
          alert(`${selectedBootcampers.length} bootcampers activated successfully!`);
          loadBootcampers();
        } catch (error) {
          console.error('Error activating bootcampers:', error);
          alert('Error activating bootcampers');
        }
      }
    } else if (action === 'deactivate') {
      if (window.confirm(`Deactivate ${selectedBootcampers.length} bootcampers?`)) {
        try {
          const promises = selectedBootcampers.map(bootcamper => 
            bootcamperService.updateBootcamperStatus(bootcamper.id || bootcamper.uid, 'inactive')
          );
          await Promise.all(promises);
          alert(`${selectedBootcampers.length} bootcampers deactivated successfully!`);
          loadBootcampers();
        } catch (error) {
          console.error('Error deactivating bootcampers:', error);
          alert('Error deactivating bootcampers');
        }
      }
    } else if (action === 'reset-passwords') {
      if (window.confirm(`Reset passwords for ${selectedBootcampers.length} bootcampers? They will all get the same new password.`)) {
        const newPassword = prompt('Enter new password for all selected bootcampers (minimum 8 characters):');
        if (newPassword && newPassword.length >= 8) {
          try {
            const promises = selectedBootcampers.map(bootcamper => 
              bootcamperService.resetPassword(bootcamper.id || bootcamper.uid, newPassword)
            );
            await Promise.all(promises);
            alert(`Passwords reset for ${selectedBootcampers.length} bootcampers!`);
            loadBootcampers();
          } catch (error) {
            console.error('Error resetting passwords:', error);
            alert('Error resetting passwords');
          }
        } else if (newPassword) {
          alert('Password must be at least 8 characters long.');
        }
      }
    }
  };

  const getDistricts = () => {
    return [...new Set(bootcampers.map(b => b.district).filter(Boolean))].sort();
  };

  const getEducationLevels = () => {
    return [...new Set(bootcampers.map(b => b.educationLevel).filter(Boolean))].sort();
  };

  // Pagination
  const totalPages = Math.ceil(filteredBootcampers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBootcampers = filteredBootcampers.slice(startIndex, endIndex);

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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading bootcampers...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>All Bootcampers</h1>
          <p>View and manage registered bootcampers</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
          <button 
            onClick={() => navigate('/admin/add-bootcamper')} 
            className="btn btn-primary"
          >
            Add New Bootcamper
          </button>
        </div>
      </header>
      
      <div className="dashboard-content">
        {/* Bulk Actions */}
        <div className="card">
          <div className="card-header">
            <h2>Bulk Actions</h2>
          </div>
          <div className="bulk-actions">
            <button 
              className="btn btn-success"
              onClick={() => handleBulkAction('activate')}
              disabled={currentBootcampers.length === 0}
            >
              Activate Selected
            </button>
            <button 
              className="btn btn-warning"
              onClick={() => handleBulkAction('deactivate')}
              disabled={currentBootcampers.length === 0}
            >
              Deactivate Selected
            </button>
            <button 
              className="btn btn-info"
              onClick={() => handleBulkAction('reset-passwords')}
              disabled={currentBootcampers.length === 0}
            >
              Reset Passwords
            </button>
            <small className="text-muted ml-2">
              Applies to {currentBootcampers.length} bootcampers on this page
            </small>
          </div>
        </div>

        {/* Filters Card */}
        <div className="card">
          <div className="card-header">
            <h2>Filters & Search</h2>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, force number, email, school, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="form-label">Serial</label>
              <select
                className="form-control"
                value={selectedSerial}
                onChange={(e) => setSelectedSerial(e.target.value)}
              >
                <option value="">All Serials</option>
                {SERIALS.map(serial => (
                  <option key={serial} value={serial}>{serial}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="form-label">District</label>
              <select
                className="form-control"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">All Districts</option>
                {getDistricts().map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="form-label">Education Level</label>
              <select
                className="form-control"
                value={selectedEducation}
                onChange={(e) => setSelectedEducation(e.target.value)}
              >
                <option value="">All Levels</option>
                {getEducationLevels().map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="form-label">Sort By</label>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="registeredAt">Registration Date</option>
                <option value="createdAt">Created Date</option>
                <option value="fullName">Name</option>
                <option value="serial">Serial</option>
                <option value="district">District</option>
                <option value="age">Age</option>
                <option value="forceNumber">Force Number</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="form-label">Sort Order</label>
              <select
                className="form-control"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest/Descending</option>
                <option value="asc">Oldest/Ascending</option>
              </select>
            </div>
          </div>

          <div className="filter-summary">
            <span className="text-muted">
              Showing {filteredBootcampers.length} of {bootcampers.length} bootcampers
            </span>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedSerial('');
                setSelectedDistrict('');
                setSelectedEducation('');
                setSortBy('registeredAt');
                setSortOrder('desc');
              }}
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Bootcampers Table */}
        <div className="card">
          <div className="card-header">
            <h2>Bootcampers List</h2>
            <div className="header-stats">
              <span className="badge badge-primary">{bootcampers.length} Total</span>
              <span className="badge badge-success">{bootcampers.filter(b => b.status === 'active').length} Active</span>
              <span className="badge badge-warning">{bootcampers.filter(b => b.status === 'inactive').length} Inactive</span>
              <span className="badge badge-info">{filteredBootcampers.length} Filtered</span>
            </div>
          </div>
          
          {currentBootcampers.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Force Number</th>
                      <th>Full Name</th>
                      <th>Serial</th>
                      <th>Age</th>
                      <th>District</th>
                      <th>Education</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBootcampers.map(bootcamper => (
                      <tr key={bootcamper.id || bootcamper.uid}>
                        <td>
                          <strong>{bootcamper.forceNumber}</strong>
                        </td>
                        <td>
                          <div className="bootcamper-info">
                            <strong>{bootcamper.fullName}</strong>
                            <small className="text-muted">{bootcamper.email}</small>
                            <small className="text-muted d-block">{bootcamper.phone}</small>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ 
                            backgroundColor: getSerialColor(bootcamper.serial)
                          }}>
                            {bootcamper.serial}
                          </span>
                        </td>
                        <td>{bootcamper.age || 'N/A'}</td>
                        <td>{bootcamper.district || 'N/A'}</td>
                        <td>
                          <small>{bootcamper.educationLevel}</small>
                          {bootcamper.university && (
                            <div className="text-muted small">{bootcamper.university}</div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${bootcamper.status === 'active' ? 'active' : 'inactive'}`}>
                            {bootcamper.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          {bootcamper.registeredAt ? new Date(bootcamper.registeredAt).toLocaleDateString() : 
                           bootcamper.createdAt ? new Date(bootcamper.createdAt).toLocaleDateString() : 'N/A'}
                          <div className="text-muted small">
                            {bootcamper.passwordChanged ? '✓ Changed' : 'Default'}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleViewDetails(bootcamper)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button 
                              className="btn btn-sm btn-warning ml-1"
                              onClick={() => handleResetPassword(bootcamper)}
                              title="Reset Password"
                            >
                              🔐
                            </button>
                            {bootcamper.status === 'active' ? (
                              <button 
                                className="btn btn-sm btn-danger ml-1"
                                onClick={() => handleToggleStatus(bootcamper.id || bootcamper.uid, 'inactive')}
                                title="Deactivate"
                              >
                                ⏸️
                              </button>
                            ) : (
                              <button 
                                className="btn btn-sm btn-success ml-1"
                                onClick={() => handleToggleStatus(bootcamper.id || bootcamper.uid, 'active')}
                                title="Activate"
                              >
                                ▶️
                              </button>
                            )}
                            <button 
                              className="btn btn-sm btn-outline ml-1"
                              onClick={() => handleDeleteBootcamper(bootcamper.id || bootcamper.uid)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="page-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    className="btn btn-outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No bootcampers found</h3>
              <p className="text-muted">Try adjusting your search filters or add new bootcampers</p>
              <button 
                onClick={() => navigate('/admin/add-bootcamper')} 
                className="btn btn-primary"
              >
                Add New Bootcamper
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllBootcampers;