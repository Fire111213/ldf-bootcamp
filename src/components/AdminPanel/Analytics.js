import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bootcamperService } from '../../firebase/firestore';

const Analytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBootcampers: 0,
    activeBootcampers: 0,
    inactiveBootcampers: 0,
    districts: [],
    serialDistribution: [],
    educationLevels: [],
    genderDistribution: [],
    registrationTrends: [],
    ageDistribution: [],
    monthlyRegistrations: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadAnalytics();
  }, [selectedFilter, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get bootcampers from Firebase
      const result = await bootcamperService.getAllBootcampers();
      
      if (result.success && result.data) {
        let bootcampers = result.data;
        
        // Apply filters
        if (selectedFilter === 'active') {
          bootcampers = bootcampers.filter(b => b.status === 'active');
        } else if (selectedFilter === 'inactive') {
          bootcampers = bootcampers.filter(b => b.status === 'inactive');
        }
        
        // Apply date range filter
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          
          bootcampers = bootcampers.filter(b => {
            const regDate = b.registeredAt ? new Date(b.registeredAt) : new Date(b.createdAt);
            return regDate >= startDate && regDate <= endDate;
          });
        }
        
        // Calculate total statistics
        const total = bootcampers.length;
        const active = bootcampers.filter(b => b.status === 'active').length;
        const inactive = bootcampers.filter(b => b.status === 'inactive').length;
        
        // Serial distribution
        const serialCounts = {};
        bootcampers.forEach(b => {
          if (b.serial) {
            serialCounts[b.serial] = (serialCounts[b.serial] || 0) + 1;
          }
        });
        const serialDistribution = Object.entries(serialCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        // Education levels
        const educationCounts = {};
        bootcampers.forEach(b => {
          if (b.educationLevel) {
            educationCounts[b.educationLevel] = (educationCounts[b.educationLevel] || 0) + 1;
          }
        });
        const educationLevels = Object.entries(educationCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        // Gender distribution
        const genderCounts = {};
        bootcampers.forEach(b => {
          if (b.gender) {
            genderCounts[b.gender] = (genderCounts[b.gender] || 0) + 1;
          }
        });
        const genderDistribution = Object.entries(genderCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        // Districts coverage
        const districtSet = new Set(bootcampers.map(b => b.district).filter(Boolean));
        const districts = Array.from(districtSet);
        
        // Registration trends (last 30 days)
        const registrationTrends = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const count = bootcampers.filter(b => {
            const regDate = b.registeredAt ? new Date(b.registeredAt).toISOString().split('T')[0] : 
                           b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : null;
            return regDate === dateStr;
          }).length;
          registrationTrends.push({
            date: dateStr.slice(5), // MM-DD format
            registrations: count
          });
        }
        
        // Age distribution
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
        const ageDistribution = Object.entries(ageGroups).map(([name, value]) => ({
          name,
          value
        }));
        
        // Monthly registrations
        const monthlyData = {};
        bootcampers.forEach(b => {
          const regDate = b.registeredAt ? new Date(b.registeredAt) : new Date(b.createdAt);
          const monthYear = `${regDate.getFullYear()}-${(regDate.getMonth() + 1).toString().padStart(2, '0')}`;
          monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
        });
        const monthlyRegistrations = Object.entries(monthlyData).map(([month, count]) => ({
          month,
          registrations: count
        })).sort((a, b) => a.month.localeCompare(b.month));

        setStats({
          totalBootcampers: total,
          activeBootcampers: active,
          inactiveBootcampers: inactive,
          districts,
          serialDistribution,
          educationLevels,
          genderDistribution,
          registrationTrends,
          ageDistribution,
          monthlyRegistrations
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await bootcamperService.getAllBootcampers();
      
      if (result.success && result.data) {
        const bootcampers = result.data;
        
        // Prepare CSV data
        const headers = [
          'Force Number', 'Full Name', 'Email', 'Phone', 'Serial', 'District',
          'Education Level', 'Age', 'Gender', 'Status', 'Registered Date'
        ];
        
        const rows = bootcampers.map(b => [
          b.forceNumber || '',
          b.fullName || '',
          b.email || '',
          b.phone || '',
          b.serial || '',
          b.district || '',
          b.educationLevel || '',
          b.age || '',
          b.gender || '',
          b.status || 'active',
          b.registeredAt ? new Date(b.registeredAt).toLocaleDateString() : 
          b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bootcampers_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  // Custom chart rendering functions
  const renderBarChart = (data, color = '#4CAF50') => {
    if (data.length === 0) {
      return <p className="text-muted text-center">No data available</p>;
    }
    
    const maxValue = Math.max(...data.map(d => d.value));
    return (
      <div className="custom-chart">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="chart-row">
              <div className="chart-label">{item.name}</div>
              <div className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color
                  }}
                >
                  <span className="chart-value">{item.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPieChart = (data) => {
    if (data.length === 0) {
      return <p className="text-muted text-center">No data available</p>;
    }
    
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="custom-pie-chart">
        <div className="pie-chart-container">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="pie-legend-item">
                <div 
                  className="pie-color-box" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <div className="pie-label">{item.name}</div>
                <div className="pie-value">{item.value} ({percentage.toFixed(1)}%)</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = (data) => {
    if (data.length === 0) {
      return <p className="text-muted text-center">No data available</p>;
    }
    
    const maxValue = Math.max(...data.map(d => d.registrations));
    const minValue = Math.min(...data.map(d => d.registrations));
    const range = maxValue - minValue || 1;
    
    return (
      <div className="custom-line-chart">
        <div className="line-chart-container">
          <div className="line-chart-grid">
            {data.map((item, index) => {
              const percentage = range > 0 ? ((item.registrations - minValue) / range) * 100 : 50;
              return (
                <div key={index} className="line-point" style={{ left: `${(index / (data.length - 1)) * 100}%`, bottom: `${percentage}%` }}>
                  <div className="point-value">{item.registrations}</div>
                  <div className="point-label">{item.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Analytics Dashboard</h1>
          <p>Detailed reports and statistics</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
          <button onClick={handleExport} className="btn btn-primary">
            Export Data
          </button>
        </div>
      </header>
      
      <div className="dashboard-content">
        {/* Filters */}
        <div className="card">
          <div className="card-header">
            <h2>Filters</h2>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="form-label">Status Filter</label>
              <select
                className="form-control"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Bootcampers</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            <div className="filter-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
            <div className="filter-group">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSelectedFilter('all');
                  setDateRange({ start: '', end: '' });
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <p>Total Bootcampers</p>
            <h3>{stats.totalBootcampers}</h3>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <p>Active Bootcampers</p>
            <h3>{stats.activeBootcampers}</h3>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏸️</div>
            <p>Inactive Bootcampers</p>
            <h3>{stats.inactiveBootcampers}</h3>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <p>Districts Covered</p>
            <h3>{stats.districts.length}</h3>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="dashboard-row">
          <div className="dashboard-column">
            <div className="card">
              <div className="card-header">
                <h2>Registration Trends (Last 30 Days)</h2>
              </div>
              <div className="chart-container">
                {renderLineChart(stats.registrationTrends)}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Monthly Registrations</h2>
              </div>
              <div className="chart-container">
                {renderBarChart(stats.monthlyRegistrations, '#2196F3')}
              </div>
            </div>
          </div>

          <div className="dashboard-column">
            <div className="card">
              <div className="card-header">
                <h2>Serial Distribution</h2>
              </div>
              <div className="chart-container">
                {renderPieChart(stats.serialDistribution)}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Education Levels</h2>
              </div>
              <div className="chart-container">
                {renderPieChart(stats.educationLevels)}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="dashboard-row">
          <div className="dashboard-column">
            <div className="card">
              <div className="card-header">
                <h2>Age Distribution</h2>
              </div>
              <div className="chart-container">
                {renderBarChart(stats.ageDistribution, '#FF9800')}
              </div>
            </div>
          </div>

          <div className="dashboard-column">
            <div className="card">
              <div className="card-header">
                <h2>Gender Distribution</h2>
              </div>
              <div className="chart-container">
                {renderPieChart(stats.genderDistribution)}
              </div>
            </div>
          </div>
        </div>

        {/* Districts Table */}
        <div className="card">
          <div className="card-header">
            <h2>District Coverage</h2>
          </div>
          <div className="districts-grid">
            {stats.districts.length > 0 ? (
              stats.districts.map((district, index) => (
                <div key={district} className="district-card">
                  <span className="district-badge">{index + 1}</span>
                  <span className="district-name">{district}</span>
                </div>
              ))
            ) : (
              <p className="text-muted text-center">No district data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;