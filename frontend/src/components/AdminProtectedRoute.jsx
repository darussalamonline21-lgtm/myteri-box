import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  // Cek token khusus admin
  const token = localStorage.getItem('adminAuthToken');
  return token ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminProtectedRoute;