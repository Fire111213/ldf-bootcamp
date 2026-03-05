import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bootcamperService } from '../../firebase/firestore';
import { SERIALS, DISTRICTS, EDUCATION_LEVELS } from '../../utils/constants';

const SearchBootcamper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState({
    serial: '',
    district: '',
    educationLevel: '',
    minAge: '',
    maxAge: '',
    school: '',
    university: '',
    course: '',
    workplace: '',
    position: ''
  });
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    
    try {
      const result = await bootcamperService.searchBootcampers({
        searchTerm,
        ...filters
      });
      
      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        console.error('Search failed:', result.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching bootcampers:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilters({
      serial: '',
      district: '',
      educationLevel: '',
      minAge: '',
      maxAge: '',
      school: '',
      university: '',
      course: '',
      workplace: '',
      position: ''
    });
    setSearchResults([]);
  };

  const handleViewDetails = (bootcamper) => {
    navigate(`/admin/bootcamper/${bootcamper.id || bootcamper.uid}`, { state: { bootcamper } });
  };

  useEffect(() => {
    const hasSearchCriteria = searchTerm.trim() || Object.values(filters).some(f => f && f.trim());
    
    if (hasSearchCriteria) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, filters]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Search Bootcampers</h1>
          <p>Find bootcampers using various search criteria</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
        </div>
      </header>
      
      <div className="dashboard-content">
        {/* Search Card */}
        <div className="card">
          <div className="card-header">
            <h2>Search Criteria</h2>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setAdvancedSearch(!advancedSearch)}
            >
              {advancedSearch ? 'Basic Search' : 'Advanced Search'}
            </button>
          </div>

          <div className="search-form">
            <div className="form-group">
              <label className="form-label">
                <span className="search-icon">🔍</span>
                Quick Search
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, force number, email, serial number, age..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <small className="form-text">
                Search across all fields including names, numbers, and serials
              </small>
            </div>

            {advancedSearch && (
              <div className="advanced-filters">
                <h4>Advanced Filters</h4>
                <div className="filters-grid">
                  <div className="filter-group">
                    <label className="form-label">Serial</label>
                    <select
                      className="form-control"
                      value={filters.serial}
                      onChange={(e) => setFilters({...filters, serial: e.target.value})}
                    >
                      <option value="">Any Serial</option>
                      {SERIALS.map(serial => (
                        <option key={serial} value={serial}>{serial}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="form-label">District</label>
                    <select
                      className="form-control"
                      value={filters.district}
                      onChange={(e) => setFilters({...filters, district: e.target.value})}
                    >
                      <option value="">Any District</option>
                      {DISTRICTS.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="form-label">Education Level</label>
                    <select
                      className="form-control"
                      value={filters.educationLevel}
                      onChange={(e) => setFilters({...filters, educationLevel: e.target.value})}
                    >
                      <option value="">Any Level</option>
                      {EDUCATION_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="form-label">Age Range</label>
                    <div className="age-range">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Min"
                        value={filters.minAge}
                        onChange={(e) => setFilters({...filters, minAge: e.target.value})}
                        min="16"
                        max="40"
                      />
                      <span className="range-separator">to</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Max"
                        value={filters.maxAge}
                        onChange={(e) => setFilters({...filters, maxAge: e.target.value})}
                        min="16"
                        max="40"
                      />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label className="form-label">High School</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="School name"
                      value={filters.school}
                      onChange={(e) => setFilters({...filters, school: e.target.value})}
                    />
                  </div>

                  <div className="filter-group">
                    <label className="form-label">University</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Institution name"
                      value={filters.university}
                      onChange={(e) => setFilters({...filters, university: e.target.value})}
                    />
                  </div>

                  <div className="filter-group">
                    <label className="form-label">Course</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Course/program"
                      value={filters.course}
                      onChange={(e) => setFilters({...filters, course: e.target.value})}
                    />
                  </div>

                  <div className="filter-group">
                    <label className="form-label">Workplace</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Company/organization"
                      value={filters.workplace}
                      onChange={(e) => setFilters({...filters, workplace: e.target.value})}
                    />
                  </div>

                  <div className="filter-group">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Job title"
                      value={filters.position}
                      onChange={(e) => setFilters({...filters, position: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="search-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm mr-2"></span>
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
              <button 
                className="btn btn-outline"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="card">
          <div className="card-header">
            <h2>Search Results</h2>
            <span className="badge badge-success">{searchResults.length} found</span>
          </div>
          
          {loading ? (
            <div className="loading-results">
              <div className="spinner"></div>
              <p>Searching bootcampers...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results">
              {searchResults.map(bootcamper => (
                <div key={bootcamper.id || bootcamper.uid} className="search-result-card">
                  <div className="result-header">
                    <div className="result-info">
                      <h4>{bootcamper.fullName}</h4>
                      <div className="result-meta">
                        <span className="force-number">{bootcamper.forceNumber}</span>
                        <span className="separator">•</span>
                        <span className="serial">{bootcamper.serial}</span>
                        <span className="separator">•</span>
                        <span className="age">{bootcamper.age} years</span>
                      </div>
                    </div>
                    <span className="badge" style={{ 
                      backgroundColor: bootcamper.educationLevel === 'Still in High School' ? '#FF9800' :
                                     bootcamper.educationLevel === 'In Tertiary/University' ? '#2196F3' :
                                     bootcamper.educationLevel === 'Graduate' ? '#4CAF50' : '#9C27B0'
                    }}>
                      {bootcamper.educationLevel}
                    </span>
                  </div>
                  
                  <div className="result-details">
                    <div className="detail-item">
                      <span className="detail-label">District:</span>
                      <span className="detail-value">{bootcamper.district}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{bootcamper.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{bootcamper.phone}</span>
                    </div>
                    {bootcamper.highSchool && (
                      <div className="detail-item">
                        <span className="detail-label">High School:</span>
                        <span className="detail-value">{bootcamper.highSchool}</span>
                      </div>
                    )}
                    {bootcamper.university && (
                      <div className="detail-item">
                        <span className="detail-label">University:</span>
                        <span className="detail-value">{bootcamper.university}</span>
                      </div>
                    )}
                    {bootcamper.workplace && (
                      <div className="detail-item">
                        <span className="detail-label">Workplace:</span>
                        <span className="detail-value">{bootcamper.workplace}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="result-actions">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleViewDetails(bootcamper)}
                    >
                      View Full Details
                    </button>
                    <small className="text-muted">
                      Registered: {bootcamper.registeredAt ? new Date(bootcamper.registeredAt).toLocaleDateString() : 
                                 bootcamper.createdAt ? new Date(bootcamper.createdAt).toLocaleDateString() : 'N/A'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim() || Object.values(filters).some(f => f && f.trim()) ? (
            <div className="no-results">
              <div className="no-results-icon">📭</div>
              <h3>No bootcampers found</h3>
              <p className="text-muted">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Enter search criteria</h3>
              <p className="text-muted">Use the search form above to find bootcampers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBootcamper;