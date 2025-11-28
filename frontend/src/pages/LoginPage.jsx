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
            } catch (err) {
                console.error("Could not parse JWT payload to get userId:", err);
            }

            // 4. Arahkan ke dashboard
            navigate('/dashboard');

            // Bersihkan cache input setelah login sukses
            sessionStorage.removeItem('loginStoreCode');
            sessionStorage.removeItem('loginPassword');

        } catch (err) {
            const backendMsg = err.response?.data?.message;
            const status = err.response?.status;
            const isInvalidCredential =
                status === 401 ||
                (typeof backendMsg === 'string' && /invalid/i.test(backendMsg));

            const friendly = isInvalidCredential
                ? 'Username atau kata sandi salah. Silakan cek kembali.'
                : (backendMsg || 'Login gagal. Periksa koneksi Anda lalu coba lagi.');
            setError(friendly);
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-white flex items-center justify-center px-4"
            style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url('/patterns/patern-logo.svg')",
                backgroundRepeat: "no-repeat, space",
                backgroundSize: "auto, 320px 120px",
                backgroundPosition: "center, center"
            }}
        >
            <div className="w-full max-w-md">
                <motion.div
                    className="bg-white border border-amber-500 rounded-2xl shadow-sm p-8 space-y-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <div className="space-y-2 text-center">
                        <motion.div
                            className="flex items-center justify-center gap-3"
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <img
                                src="/logo-java-01.svg"
                                alt="Logo Java"
                                className="w-10 h-10 md:w-12 md:h-12"
                                loading="lazy"
                                decoding="async"
                            />
                            <h1 className="text-2xl font-bold text-amber-800">
                                Magic Box Portal
                            </h1>
                            <img
                                src="/logo-javamas-01.svg"
                                alt="Logo Javamas"
                                className="w-10 h-10 md:w-12 md:h-12"
                                loading="lazy"
                                decoding="async"
                            />
                        </motion.div>
                        <p className="text-sm text-amber-700 font-medium">
                            Akses dashboard distributor
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="storeCode" className="block text-sm font-medium text-slate-700">
                                Username
                            </label>
                            <input
                                id="storeCode"
                                type="text"
                                value={storeCode}
                                onChange={(e) => setStoreCode(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500 text-slate-900 placeholder-amber-600/70 transition"
                                placeholder="Masukkan username Anda"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500 text-slate-900 placeholder-amber-600/70 transition"
                                    placeholder="Masukkan kata sandi"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-amber-600 hover:text-amber-700 transition"
                                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            type="submit"
                            className="w-full py-3.5 px-6 bg-amber-500 text-white font-semibold rounded-lg shadow-sm hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <span>{isLoading ? 'Memproses...' : 'Masuk'}</span>
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
