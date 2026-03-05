import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../firebase/firestore';

const AdminSetup = () => {
  const navigate = useNavigate();
  // Updated to use the new admin email
  const [email, setEmail] = useState('lesothodefenceforce04@gmail.com');
  const [password, setPassword] = useState('LDFydp@20_21');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await adminService.setupInitialAdmin(email, password);
      
      if (result.success) {
        setMessage(`✅ Initial admin created successfully! User ID: ${result.userId}`);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(`❌ Failed to create admin: ${result.error}`);
      }
    } catch (error) {
      setError(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Setup</h1>
        <p className="text-gray-600 mb-6 text-center">
          This will create an initial admin user in the system.
          <br />
          <strong className="text-red-500">⚠️ Run this only once!</strong>
        </p>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin@example.com"
            readOnly // Make it read-only since we have a fixed email
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Admin Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimum 8 characters"
          />
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up admin...' : 'Setup Initial Admin'}
        </button>

        <p className="mt-4 text-sm text-gray-600 text-center">
          After setup, you can login with this email and password.
          <br />
          <button
            onClick={() => navigate('/login')}
            className="text-blue-500 hover:underline mt-2"
          >
            Go to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminSetup;