import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Cek sederhana: apakah ada token di local storage?
  // Di aplikasi nyata, Anda mungkin ingin memverifikasi token ini dengan backend.
  const token = localStorage.getItem('authToken');

  // Jika ada token, render halaman yang diminta (melalui <Outlet />)
  // Jika tidak, arahkan pengguna ke halaman login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;