import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx'
import './index.css'

// Import semua komponen halaman
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MyPrizesPage from './pages/MyPrizesPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Konfigurasi Router
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <App />, // Layout utama
    children: [
      // Semua rute di dalam children ini akan dilindungi
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'my-prizes',
            element: <MyPrizesPage />,
          },
          // Arahkan halaman utama (/) ke dashboard jika sudah login
          {
            index: true, 
            element: <DashboardPage />
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
