import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  // Cek sederhana untuk menampilkan/menyembunyikan tombol logout
  const isLoggedIn = !!localStorage.getItem('authToken');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Sederhana */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-gray-800">
          Mystery Box App
        </Link>
        {isLoggedIn && (
           <button 
             onClick={handleLogout}
             className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
           >
             Logout
           </button>
        )}
      </nav>

      {/* Konten Halaman akan dirender di sini */}
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default App;