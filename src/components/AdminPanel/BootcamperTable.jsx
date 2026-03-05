import React from 'react';
import { useNavigate } from 'react-router-dom';

const BootcamperTable = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>All Bootcampers</h1>
          <p>View and manage all registered bootcampers</p>
        </div>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
        </div>
      </header>
      
      <div className="dashboard-content container">
        <div className="card">
          <div className="card-header">
            <h2>Bootcampers List</h2>
          </div>
          <p>This table will display all bootcampers with options to edit, delete, deactivate, or view details.</p>
          <p className="text-muted">Feature under development...</p>
        </div>
      </div>
    </div>
  );
};

export default BootcamperTable;