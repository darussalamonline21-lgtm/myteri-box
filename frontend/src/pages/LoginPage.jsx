import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import apiClient from '../services/apiClient';

const LoginPage = () => {
    const navigate = useNavigate();

    // State untuk input form, dipersist sementara di sessionStorage agar tidak hilang saat app di-background
    const [storeCode, setStoreCode] = useState(() => {
        if (typeof window === 'undefined') return '';
        return sessionStorage.getItem('loginStoreCode') || '';
    });
    const [password, setPassword] = useState(() => {
        if (typeof window === 'undefined') return '';
        return sessionStorage.getItem('loginPassword') || '';
    });
    const [showPassword, setShowPassword] = useState(false);

    // State untuk UI feedback
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Persist nilai sementara saat user berpindah aplikasi/tab
    useEffect(() => {
        sessionStorage.setItem('loginStoreCode', storeCode);
    }, [storeCode]);

    useEffect(() => {
        sessionStorage.setItem('loginPassword', password);
    }, [password]);

    const handleLogin = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/login', {
                storeCode,
                password,
            });

            const { token, activeCampaignId } = response.data;

            // 1. Simpan token JWT ke localStorage
            if (token) {
                localStorage.setItem('authToken', token);
            }

            // 2. Simpan activeCampaignId (bisa null jika tidak ada campaign)
            if (typeof activeCampaignId !== 'undefined' && activeCampaignId !== null) {
                localStorage.setItem('activeCampaignId', String(activeCampaignId));
            } else if (activeCampaignId === null) {
                localStorage.removeItem('activeCampaignId');
            }

            // 3. Set default header untuk permintaan selanjutnya
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
                const decodedPayload = JSON.parse(atob(token.split('.')[1]));
                if (decodedPayload.userId) {
                    localStorage.setItem('userId', decodedPayload.userId);
                }
            } catch (e) {
                console.error("Could not parse JWT payload to get userId:", e);
            }

            // 4. Arahkan ke dashboard
            navigate('/dashboard');

            // Bersihkan cache input setelah login sukses
            sessionStorage.removeItem('loginStoreCode');
            sessionStorage.removeItem('loginPassword');

        } catch (err) {
            const backendMsg = err.response?.data?.message;
            setError(backendMsg || 'Login gagal. Periksa koneksi Anda lalu coba lagi.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#0f0518] to-[#1a0b2e] relative overflow-hidden">
            {/* Radial Spotlight Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>

            <motion.div
                className="relative p-10 backdrop-blur-xl bg-black/40 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.3)] w-full max-w-md border-2 border-yellow-400/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Decorative Glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>

                <motion.h1
                    className="text-4xl font-black mb-2 text-center bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 bg-clip-text text-transparent drop-shadow-lg"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    ✨ MYSTERY BOX
                </motion.h1>
                <p className="text-center text-gray-400 mb-8 text-sm font-semibold tracking-wide">Portal Distributor</p>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label htmlFor="storeCode" className="block text-yellow-200 mb-2 font-semibold text-sm">Kode Toko</label>
                        <input
                            id="storeCode"
                            type="text"
                            value={storeCode}
                            onChange={(e) => setStoreCode(e.target.value)}
                            className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-2 border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 text-white placeholder-gray-500 transition-all"
                            placeholder="Masukkan kode toko Anda"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-yellow-200 mb-2 font-semibold text-sm">Kata Sandi</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 backdrop-blur-md bg-white/5 border-2 border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 text-white placeholder-gray-500 transition-all"
                                placeholder="Masukkan kata sandi"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-yellow-200 hover:text-yellow-400 transition-colors"
                                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="backdrop-blur-md bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        type="submit"
                        className="relative w-full py-4 px-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-purple-950 font-black text-lg rounded-lg shadow-[0_0_30px_rgba(251,191,36,0.5)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        disabled={isLoading}
                    >
                        {/* Glossy Inner Highlight */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-lg"></div>

                        <span className="relative z-10">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Masuk...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </span>
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default LoginPage;
