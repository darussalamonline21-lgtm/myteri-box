import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const SuperAdminProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const adminToken = localStorage.getItem('adminAuthToken');
        if (!adminToken) {
          setIsLoading(false);
          return;
        }

        // Simple check - decode JWT payload (in production, you should verify this with backend)
        const payload = JSON.parse(atob(adminToken.split('.')[1]));
        
        // Check if admin has superadmin role
        // In real implementation, this should be verified with backend
        const adminRole = payload.role;
        
        if (adminRole === 'superadmin') {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error('Failed to verify admin role:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default SuperAdminProtectedRoute;