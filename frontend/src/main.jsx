import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Import Halaman Pengguna
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MyPrizesPage from './pages/MyPrizesPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Import Halaman Admin
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import CreateCampaignPage from './pages/admin/CreateCampaignPage.jsx';
import CampaignDetailPage from './pages/admin/CampaignDetailPage.jsx';
import CampaignEditPage from './pages/admin/CampaignEditPage.jsx';
import AdminAuditPage from './pages/admin/AdminAuditPage.jsx';
import AdminUserListPage from './pages/admin/AdminUserListPage.jsx';
import CreateUserPage from './pages/admin/CreateUserPage.jsx';

import AdminProtectedRoute from './components/AdminProtectedRoute.jsx';
import SuperAdminProtectedRoute from './components/SuperAdminProtectedRoute.jsx';
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx';

const router = createBrowserRouter([
  // --- Rute Pengguna ---
  {
    path: '/login',
    element: (
      <PublicOnlyRoute tokenKey="authToken" redirectTo="/dashboard">
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'my-prizes', element: <MyPrizesPage /> },
          { index: true, element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },

  // --- Rute Admin ---
  {
    path: '/admin/login',
    element: (
      <PublicOnlyRoute tokenKey="adminAuthToken" redirectTo="/admin/dashboard">
        <AdminLoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/admin',
    element: <AdminProtectedRoute />,
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      // --- RUTE YANG SEBELUMNYA HILANG ---
      {
        path: 'campaigns',
        element: <AdminDashboardPage />, // Menampilkan daftar kampanye
      },
      // -----------------------------------
      {
        path: 'campaigns/new',
        element: <CreateCampaignPage />,
      },
      {
        path: 'campaigns/:id',
        element: <CampaignDetailPage />,
      },
      {
        path: 'campaigns/:id/edit',
        element: <CampaignEditPage />,
      },
      {
        path: 'campaigns/:id/audit',
        element: <AdminAuditPage />,
      },
      // Rute User Management (Hanya SuperAdmin)
      {
        path: 'users',
        element: (
          <SuperAdminProtectedRoute>
            <AdminUserListPage />
          </SuperAdminProtectedRoute>
        ),
      },
      {
        path: 'users/new',
        element: (
          <SuperAdminProtectedRoute>
            <CreateUserPage />
          </SuperAdminProtectedRoute>
        ),
      },
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
