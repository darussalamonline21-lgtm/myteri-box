import React from 'react';
import { Outlet } from 'react-router-dom';

function App() {
  // Biarkan halaman anak (Dashboard, MyPrizes) mengatur layout & header mereka sendiri.
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}

export default App;
