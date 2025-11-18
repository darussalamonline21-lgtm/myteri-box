import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

const LoginPage = () => {
    const navigate = useNavigate();

    // State untuk input form
    const [storeCode, setStoreCode] = useState('');
    const [password, setPassword] = useState('');

    // State untuk UI feedback
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        setIsLoading(true);
        setError('');

        try {
            // Panggil API login
            const response = await apiClient.post('/auth/login', {
                storeCode: storeCode,
                password: password,
            });

            const { token } = response.data;

            // 1. Simpan token ke localStorage untuk sesi login
            localStorage.setItem('authToken', token);
            
            // 2. Uraikan token untuk mendapatkan userId dan simpan juga
            try {
                // Bagian tengah dari JWT adalah payload dalam format base64
                const payloadBase64 = token.split('.')[1];
                // 'atob' akan men-decode string base64
                const decodedPayload = JSON.parse(atob(payloadBase64));
                
                if (decodedPayload.userId) {
                    localStorage.setItem('userId', decodedPayload.userId);
                }
            } catch (e) {
                // Tangani jika token tidak valid atau ada error parsing
                console.error("Could not parse JWT payload to get userId:", e);
            }

            // 3. Perbarui header default apiClient untuk permintaan selanjutnya
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // 4. Arahkan ke dashboard
            navigate('/dashboard');

        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            } else {
                setError('Login failed. Please check your connection and try again.');
            }
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Distributor Login</h1>
                
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="storeCode" className="block text-gray-700 mb-2">Store Code</label>
                        <input
                            id="storeCode"
                            type="text"
                            value={storeCode}
                            onChange={(e) => setStoreCode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-blue-300"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;