import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.post('/admin/login', {
                email,
                password,
            });
            const { token } = response.data;

            // Simpan token admin
            localStorage.setItem('adminAuthToken', token);
            
            // --- INI ADALAH PERBAIKAN PENTING ---
            // Secara langsung atur header Authorization pada instance apiClient
            // untuk semua permintaan di masa depan dalam sesi ini.
            if (token) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
          
            // ------------------------------------

            // Arahkan ke dasbor admin
            navigate('/admin/dashboard');

        } catch (err) {
            const backendMsg = err.response?.data?.message;
            setError(backendMsg || 'Login gagal. Periksa email/kata sandi Anda.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
            <div className="p-8 bg-gray-900 rounded-lg shadow-xl w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Login Panel Admin</h1>
                
                <form onSubmit={handleLogin}>
                    {/* --- BAGIAN FORM YANG HILANG --- */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-400 mb-2">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-400 mb-2">Kata Sandi</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring focus:ring-blue-500"
                            required
                        />
                    </div>
                    {/* ---------------------------------- */}
                    
                    {error && <p className="text-red-400 text-center mb-4">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-blue-800"
                    >
                        {isLoading ? 'Masuk...' : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
