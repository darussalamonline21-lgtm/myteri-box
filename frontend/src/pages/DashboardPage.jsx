import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Home, User, ArrowLeft, X, LogOut } from 'lucide-react';
import apiClient from '../services/apiClient';
import MysteryBox from '../components/MysteryBox.jsx';
import RoomCard from '../components/RoomCard.jsx';
import { resolveImageUrl } from '../utils/imageUrl.js';

const summariesEqual = (a, b) => {
    if (!a || !b) return false;
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch (_) {
        return false;
    }
};

const boxesEqual = (prevBoxes, nextBoxes) => {
    if (!Array.isArray(prevBoxes) || !Array.isArray(nextBoxes)) return false;
    if (prevBoxes.length !== nextBoxes.length) return false;
    for (let i = 0; i < prevBoxes.length; i++) {
        const prev = prevBoxes[i];
        const next = nextBoxes[i];
        if (
            prev.id !== next.id ||
            prev.status !== next.status ||
            (prev.openedBy?.userId ?? null) !== (next.openedBy?.userId ?? null)
        ) {
            return false;
        }
    }
    return true;
};

// Progress palette shifts hue based on completion for a more dynamic feel.
const getProgressPalette = (value) => {
    if (value < 33) {
        return {
            start: '#fb7185', // rose
            end: '#facc15',   // amber
            glow: 'rgba(250, 204, 21, 0.4)',
            track: 'rgba(250, 204, 21, 0.18)',
        };
    }
    if (value < 66) {
        return {
            start: '#facc15', // amber
            end: '#34d399',   // emerald
            glow: 'rgba(52, 211, 153, 0.4)',
            track: 'rgba(52, 211, 153, 0.18)',
        };
    }
    return {
        start: '#34d399', // emerald
        end: '#38bdf8',   // sky
        glow: 'rgba(56, 189, 248, 0.35)',
        track: 'rgba(56, 189, 248, 0.16)',
    };
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const currentCampaignId = localStorage.getItem('activeCampaignId');
    const currentUserId = parseInt(localStorage.getItem('userId'), 10);
    const [boxesPerRoom, setBoxesPerRoom] = useState(100);
    const brandLogoEnv = import.meta.env.VITE_BRAND_LOGO || '/uploads/brand-logo.png';
    const openedBrandLogoEnv = import.meta.env.VITE_BRAND_LOGO_OPENED || '/uploads/brand-logo.png';
    const brandLogo = useMemo(() => resolveImageUrl(brandLogoEnv), [brandLogoEnv]);
    const openedBrandLogo = useMemo(() => resolveImageUrl(openedBrandLogoEnv), [openedBrandLogoEnv]);

    // State untuk data ringkasan
    const [summary, setSummary] = useState(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [error, setError] = useState('');

    // State untuk data kotak dan paginasi
    const [allBoxes, setAllBoxes] = useState([]);
    const [displayedBoxes, setDisplayedBoxes] = useState([]);
    const [isLoadingBoxes, setIsLoadingBoxes] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // State untuk hasil pembukaan kotak
    const [wonPrize, setWonPrize] = useState(null);
    const [openBoxError, setOpenBoxError] = useState('');

    // State untuk navigasi UI (pilihan room)
    const [selectedRoom, setSelectedRoom] = useState(null);

    // State untuk animasi: menyimpan ID kotak yang sedang dibuka
    const [openingBoxId, setOpeningBoxId] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const campaignInactiveReason = useMemo(() => {
        const isActive = summary?.campaign?.isActive;
        const endDate = summary?.campaign?.endDate ? new Date(summary.campaign.endDate) : null;
        const now = Date.now();
        const hasEndedByDate = endDate ? now > endDate.getTime() : false;

        if (isActive === false || hasEndedByDate) {
            const endText = endDate ? ` (berakhir ${new Date(endDate).toLocaleDateString()})` : '';
            return `Program sudah berakhir atau tidak aktif${endText}. Silakan pilih program lain atau login ulang.`;
        }
        return '';
    }, [summary]);
    const isCampaignInactive = Boolean(campaignInactiveReason);

    // Fungsi untuk mengambil data ringkasan
    const fetchCampaignSummary = useCallback(async () => {
        if (!currentCampaignId) {
            setError("Program aktif tidak ditemukan. Silakan login ulang.");
            return;
        }
        try {
            const response = await apiClient.get(`/campaigns/${currentCampaignId}/summary`);
            setSummary(prev => summariesEqual(prev, response.data) ? prev : response.data);
            const roomSize = response.data?.campaign?.roomSize || 100;
            setBoxesPerRoom(roomSize);
        } catch (err) {
            const status = err?.response?.status;
            const backendMsg = err?.response?.data?.message;
            const friendly = status === 403
                ? (backendMsg || "Program sudah berakhir atau tidak aktif. Silakan pilih program lain atau login ulang.")
                : (backendMsg || "Data program tidak bisa dimuat.");
            setError(friendly);
        }
    }, [currentCampaignId]);

    // Fungsi untuk mengambil daftar semua kotak
    const fetchBoxes = useCallback(async (options = {}) => {
        const { silent = false } = options;
        if (!currentCampaignId) return;
        if (!silent) setIsLoadingBoxes(true);
        try {
            const response = await apiClient.get(`/campaigns/${currentCampaignId}/boxes`);
            const incomingBoxes = response.data;
            setAllBoxes(prev => boxesEqual(prev, incomingBoxes) ? prev : incomingBoxes);
            const incomingTotalPages = Math.ceil(incomingBoxes.length / boxesPerRoom);
            setTotalPages(prev => prev === incomingTotalPages ? prev : incomingTotalPages);
        } catch (err) {
            const status = err?.response?.status;
            const backendMsg = err?.response?.data?.message;
            const friendly = status === 403
                ? (backendMsg || "Program sudah berakhir atau tidak aktif. Silakan pilih program lain atau login ulang.")
                : (backendMsg || "Box tidak bisa dimuat.");
            setError(friendly);
        } finally {
            if (!silent) setIsLoadingBoxes(false);
        }
    }, [currentCampaignId, boxesPerRoom]);

    // Effect untuk memuat data awal
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingSummary(true);
            await Promise.all([
                fetchCampaignSummary(),
                fetchBoxes()
            ]);
            setIsLoadingSummary(false);
        };
        loadInitialData();
    }, [fetchCampaignSummary, fetchBoxes]);

    // Sync ringan agar status box antar user tetap up-to-date tanpa refresh (aktif hanya saat room dipilih)
    useEffect(() => {
        if (!currentCampaignId || !selectedRoom) return;
        const interval = setInterval(() => {
            fetchBoxes({ silent: true });
        }, 8000);
        return () => clearInterval(interval);
    }, [currentCampaignId, selectedRoom, fetchBoxes]);

    // Effect untuk mengelola paginasi
    useEffect(() => {
        if (allBoxes.length > 0 && selectedRoom) {
            const startIndex = (currentPage - 1) * boxesPerRoom;
            const endIndex = startIndex + boxesPerRoom;
            setDisplayedBoxes(allBoxes.slice(startIndex, endIndex));
        }
    }, [allBoxes, currentPage, selectedRoom, boxesPerRoom]);

    // Jika campaign nonaktif, pastikan tidak ada room yang dipilih
    useEffect(() => {
        if (isCampaignInactive && selectedRoom) {
            setSelectedRoom(null);
        }
    }, [isCampaignInactive, selectedRoom]);

    // Fungsi untuk menangani aksi membuka kotak
    const handleOpenBox = async (boxId) => {
        if (isCampaignInactive) {
            setOpenBoxError(campaignInactiveReason);
            return;
        }
        if (openingBoxId || (summary && summary.couponBalance && summary.couponBalance.balance <= 0)) return;

        setOpeningBoxId(boxId);
        setOpenBoxError('');
        setWonPrize(null);

        try {
            const response = await apiClient.post(`/boxes/${boxId}/open`);

            // Update UI secara optimis
            setSummary(prev => ({
                ...prev,
                couponBalance: response.data.couponBalance,
                stats: {
                    ...prev.stats,
                    totalPrizesWon: (prev.stats.totalPrizesWon || 0) + 1,
                    totalBoxesOpened: (prev.stats.totalBoxesOpened || 0) + 1
                }
            }));
            setAllBoxes(prevBoxes =>
                prevBoxes.map(b =>
                    b.id === boxId
                        ? { ...b, status: 'opened', openedBy: { userId: currentUserId, name: 'You' } }
                        : b
                )
            );

            // Tampilkan hadiah segera setelah respon agar lebih responsif
            setWonPrize(response.data.prize);
            setOpeningBoxId(null);

        } catch (err) {
            const status = err?.response?.status;
            const backendMsg = err?.response?.data?.message;
            const friendly = status === 403
                ? (backendMsg || "Program sudah berakhir atau tidak aktif. Silakan pilih program lain atau login ulang.")
                : (backendMsg || "Tidak bisa membuka box sekarang. Coba lagi atau hubungi admin.");
            setOpenBoxError(friendly);
            setOpeningBoxId(null);
            if (status !== 403) {
                fetchCampaignSummary();
                fetchBoxes({ silent: true });
            }
        }
    };

    const closeModal = () => { setWonPrize(null); setOpenBoxError(''); };
    const handleSelectRoom = (roomNumber) => {
        if (isCampaignInactive) {
            setSelectedRoom(null);
            return;
        }
        setCurrentPage(roomNumber);
        setSelectedRoom(roomNumber);
    };
    const handleBackToRooms = () => { setSelectedRoom(null); };
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };
    const openProfile = () => setShowProfile(true);
    const closeProfile = () => setShowProfile(false);
    const openInfo = () => setShowInfo(true);
    const closeInfo = () => setShowInfo(false);

    // Tampilan loading dan error
    if (isLoadingSummary && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#0f0518] to-[#1a0b2e]">
                <div className="text-center">
                    <motion.div
                        className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-yellow-200 font-semibold">Loading Dashboard...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#0f0518] to-[#1a0b2e] p-8">
                <motion.div
                    className="backdrop-blur-xl bg-red-900/20 border-2 border-red-500/30 text-red-400 px-6 py-8 rounded-2xl text-center max-w-md w-full space-y-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <div className="text-5xl font-black mb-2">:(</div>
                    <p className="text-lg font-semibold">Terjadi kendala</p>
                    <p className="text-sm text-red-200/90">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <motion.button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/50 text-red-100 font-bold shadow-[0_0_18px_rgba(248,113,113,0.35)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Coba Muat Ulang
                        </motion.button>
                        <motion.button
                            onClick={() => { localStorage.clear(); navigate('/login'); }}
                            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-yellow-100 font-bold"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Login
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const totalBoxes = summary?.stats?.totalBoxesInCampaign ?? summary?.stats?.totalBoxes ?? allBoxes.length;
    const totalCouponsEarned = summary?.couponBalance?.totalEarned ?? ((summary?.couponBalance?.balance ?? 0) + (summary?.couponBalance?.totalUsed ?? 0));
    const couponsUsed = summary?.couponBalance?.totalUsed ?? 0;
    const couponProgress = Math.min(100, Math.max(0, (couponsUsed / (totalCouponsEarned || 1)) * 100));
    const progressPalette = getProgressPalette(couponProgress);
    const remainingCoupons = summary?.couponBalance?.balance ?? 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#0f0518] to-[#1a0b2e] flex justify-center font-sans relative overflow-hidden">
            {/* Radial Spotlights */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md min-h-screen flex flex-col relative pb-28">
                {/* Prize Modal */}
                <AnimatePresence>
                    {(wonPrize || openBoxError) && (
                        <motion.div
                            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-black/80 border-2 border-yellow-400/40 p-8 rounded-3xl shadow-[0_0_30px_rgba(251,191,36,0.35)] text-center w-full max-w-sm relative overflow-hidden"
                                initial={{ scale: 0.8, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0.8, rotate: 10 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl"></div>

                                {wonPrize ? (
                                    <>
                                        <motion.div
                                            className="mb-4 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 text-purple-900 font-black flex items-center justify-center shadow-[0_0_35px_rgba(251,191,36,0.45)]"
                                            animate={{ scale: [0.95, 1.05, 0.98, 1], rotate: [0, -3, 3, 0] }}
                                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            WIN
                                        </motion.div>
                                        <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 bg-clip-text text-transparent mb-3">Selamat!</h2>
                                        <p className="text-gray-300 text-sm mb-4 font-semibold">Anda mendapat:</p>
                                        <motion.div
                                            className="mx-auto mb-4 w-40 h-40 rounded-2xl overflow-hidden relative backdrop-blur-lg bg-gradient-to-br from-white/10 via-yellow-200/10 to-amber-400/10 border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.45)]"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
                                            {wonPrize.imageUrl ? (
                                                <img
                                                    src={resolveImageUrl(wonPrize.imageUrl)}
                                                    alt={wonPrize.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-yellow-200/80 text-xs font-semibold tracking-wide">
                                                    Foto hadiah belum tersedia
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold text-purple-950 bg-gradient-to-r from-yellow-300 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                                                {wonPrize.tier} Tier
                                            </div>
                                        </motion.div>
                                        <p className="text-2xl font-black text-white mb-2">{wonPrize.name}</p>

                                        {/* Context Sisa Kupon */}
                                        <p className="text-yellow-200/70 text-xs mb-3 font-medium">
                                            Sisa Kupon: {remainingCoupons}
                                        </p>
                                        {remainingCoupons > 0 && (
                                            <p className="text-[11px] text-yellow-300/80 font-semibold mb-2">
                                                'buka box lainya, jika kupon masih tersedia.'
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="text-6xl font-black mb-4">!</div>
                                        <h2 className="text-2xl font-black text-red-400 mb-3">Oops!</h2>
                                        <p className="text-gray-300 text-sm mb-8">{openBoxError}</p>
                                    </>
                                )}
                                <motion.button
                                    onClick={closeModal}
                                    className="relative w-full py-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-purple-950 rounded-xl font-black text-lg overflow-hidden shadow-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                                    <span className="relative z-10">
                                        {wonPrize
                                            ? (remainingCoupons > 0 ? 'Buka Box Lain!' : 'Ambil Hadiah! 🎁')
                                            : 'Tutup'
                                        }
                                    </span>
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info Sheet */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeInfo}
                        >
                            <motion.div
                                className="w-full max-w-md bg-[#0c0714] text-yellow-100 rounded-t-3xl border-t-2 border-yellow-400/30 p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] space-y-4"
                                initial={{ y: 300 }}
                                animate={{ y: 0 }}
                                exit={{ y: 300 }}
                                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-yellow-300/70 font-semibold">Tentang Program</p>
                                        <h3 className="text-2xl font-black text-white">Magic Box Loyalty</h3>
                                    </div>
                                    <button
                                        onClick={closeInfo}
                                        className="p-2 rounded-full hover:bg-white/10 text-yellow-100"
                                        aria-label="Tutup"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-white/5 border border-yellow-400/15 rounded-xl p-4 space-y-2">
                                    <p className="text-sm text-yellow-200 font-semibold">Cara Main</p>
                                    <ul className="text-xs text-gray-200 space-y-1 list-disc list-inside">
                                        <li>Kumpulkan kupon dari transaksi yang memenuhi syarat.</li>
                                        <li>Pilih room, pilih box yang masih available, lalu buka.</li>
                                        <li>Lihat hadiah yang muncul; stats & kupon terupdate otomatis.</li>
                                    </ul>
                                </div>

                                <div className="bg-white/5 border border-yellow-400/15 rounded-xl p-4 space-y-2">
                                    <p className="text-sm text-yellow-200 font-semibold">Algoritma Hadiah</p>
                                    <ul className="text-xs text-gray-200 space-y-1 list-disc list-inside">
                                        <li>Hadiah diundi otomatis oleh sistem, termasuk hadiah utama.</li>
                                        <li>Setiap buka box diproses mesin supaya adil dan tidak bisa dipilih manual.</li>
                                        <li>Hadiah yang stoknya habis/tidak aktif tidak ikut diundi.</li>
                                    </ul>
                                </div>

                                <div className="bg-white/5 border border-yellow-400/15 rounded-xl p-4 space-y-2">
                                    <p className="text-sm text-yellow-200 font-semibold">Tips Singkat</p>
                                    <ul className="text-xs text-gray-200 space-y-1 list-disc list-inside">
                                        <li>Cek sisa kupon sebelum buka box.</li>
                                        <li>Pilih room lain jika box di room ini sudah habis.</li>
                                        <li>Lihat riwayat hadiah di menu "Hadiah Saya".</li>
                                        <li>Gunakan kupon sebelum program berakhir supaya tidak hangus.</li>
                                    </ul>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Sheet */}
                <AnimatePresence>
                    {showProfile && (
                        <motion.div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeProfile}
                        >
                            <motion.div
                                className="w-full max-w-md bg-[#0c0714] text-yellow-100 rounded-t-3xl border-t-2 border-yellow-400/30 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                                initial={{ y: 300 }}
                                animate={{ y: 0 }}
                                exit={{ y: 300 }}
                                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-start justify-between mb-4 gap-3">
                                    <div>
                                        <p className="text-sm text-yellow-300/70 font-semibold">Profil Toko</p>
                                        <h3 className="text-2xl font-black text-white">
                                            {summary?.user?.name || 'Toko'}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Owner: {summary?.user?.ownerName || '-'}</p>
                                        <p className="text-xs text-gray-500">Store Code: {summary?.user?.storeCode || '-'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleLogout}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full bg-red-500/15 border border-red-400/40 text-red-200 hover:bg-red-500/25 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                        <button
                                            onClick={closeProfile}
                                            className="p-2 rounded-full hover:bg-white/10 text-yellow-100"
                                            aria-label="Tutup"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between bg-white/5 border border-yellow-400/10 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-xs text-gray-400">Total Kupon Diterima</p>
                                            <p className="text-lg font-black text-white">{summary?.couponBalance?.totalEarned ?? 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 text-right">Total Digunakan</p>
                                            <p className="text-lg font-black text-red-300 text-right">{summary?.couponBalance?.totalUsed ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-yellow-600/20 border border-yellow-400/40 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-xs text-yellow-200">Sisa Kupon</p>
                                            <p className="text-2xl font-black text-yellow-300">
                                                {summary?.couponBalance?.balance ?? 0}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-yellow-100/80">
                                            <p>Total Box Dibuka: {summary?.stats?.totalBoxesOpened ?? 0}</p>
                                            <p>Total Prize: {summary?.stats?.totalPrizesWon ?? 0}</p>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Card */}
                <motion.div
                    className="p-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="bg-black/70 border-2 border-yellow-400/30 rounded-2xl p-5 shadow-[0_0_24px_rgba(251,191,36,0.25)] relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 bg-clip-text text-transparent drop-shadow-lg">
                                    {summary?.user?.storeName || summary?.user?.name || 'Toko Pemenang'}
                                </h1>
                                <div className="relative inline-block mt-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                                    <div className="relative flex items-center gap-2">
                                        <span className="text-purple-950 text-xs font-bold">Kupon:</span>
                                        <span className="text-purple-950 font-black text-lg">{summary?.couponBalance?.balance || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-yellow-400 font-black text-lg leading-none tracking-widest drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">MAGIC</div>
                                <div className="text-white font-black text-2xl leading-none tracking-widest drop-shadow-lg">BOX</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative z-10 space-y-3">
                            <div className="text-xs text-yellow-100/90">Kupon Dipakai</div>
                            <div
                                className="h-5 backdrop-blur-md rounded-full overflow-hidden relative"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: `2px solid ${progressPalette.track}`,
                                    boxShadow: `0 0 22px ${progressPalette.glow}`,
                                }}
                            >
                                <motion.div
                                    className="h-full relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(90deg, ${progressPalette.start}, ${progressPalette.end})`,
                                        boxShadow: `0 0 30px ${progressPalette.glow}`,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${couponProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                        animate={{ x: ['-200%', '200%'] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    />
                                </motion.div>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-md">
                                    {couponsUsed}/{totalCouponsEarned || 0}
                                </div>
                            </div>

                        </div>

                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
                    </div>
                </motion.div>

                {/* Action Button */}
                <div className="px-4 mb-6">
                    <motion.button
                        onClick={() => navigate('/my-prizes')}
                        className="relative w-full py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl text-purple-950 font-black text-lg shadow-[0_0_30px_rgba(251,191,36,0.5)] overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                        <span className="relative z-10">Hadiah Saya</span>
                    </motion.button>
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-6 w-full shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
                </div>

                {/* Main Content */}
                <div className="px-4 flex-1 pb-6">
                    {isCampaignInactive ? (
                        <div className="text-center p-8 space-y-3 bg-white/5 border border-yellow-400/10 rounded-2xl">
                            <p className="text-lg font-black text-yellow-300">Program tidak aktif</p>
                            <p className="text-sm text-gray-300">{campaignInactiveReason}</p>
                            <p className="text-xs text-gray-400">Riwayat hadiah tetap bisa dilihat lewat tombol di atas.</p>
                        </div>
                    ) : isLoadingBoxes ? (
                        <div className="text-center p-10">
                            <motion.div
                                className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p className="text-yellow-200">Loading boxes...</p>
                        </div>
                    ) : (
                        !selectedRoom ? (
                            <div className="flex flex-col space-y-6 pb-6">
                                {Array.from({ length: Math.max(1, totalPages) }, (_, index) => {
                                    const roomNumber = index + 1;
                                    const startBox = (roomNumber - 1) * boxesPerRoom + 1;
                                    const endBox = Math.min(roomNumber * boxesPerRoom, allBoxes.length);
                                    const roomBoxes = allBoxes.slice((roomNumber - 1) * boxesPerRoom, roomNumber * boxesPerRoom);
                                    const remainingBoxes = roomBoxes.filter(box => box.status === 'available').length;

                                    return (
                                        <RoomCard
                                            key={roomNumber}
                                            roomNumber={roomNumber}
                                            startBox={startBox}
                                            endBox={endBox}
                                            remainingBoxes={remainingBoxes}
                                            totalBoxes={boxesPerRoom}
                                            onClick={() => handleSelectRoom(roomNumber)}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                <div className="px-1 mb-3 sticky top-2 z-20">
                                    <div className="flex items-center justify-between gap-3 bg-black/60 border border-yellow-400/20 rounded-xl px-3 py-2 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
                                        <motion.button
                                            type="button"
                                            onClick={handleBackToRooms}
                                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-300 px-3 py-1.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(124,58,237,0.45)] border border-white/10"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Back to Rooms</span>
                                        </motion.button>
                                        <div className="flex-1 text-right ml-auto">
                                            <div className="text-xs font-black bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-md inline-block whitespace-nowrap truncate max-w-[140px]">
                                                End Year Javamas {selectedRoom}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {displayedBoxes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No boxes in this room.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3">
                                        {displayedBoxes.map((box, idx) => (
                                            <MysteryBox
                                                key={box.id}
                                                box={box}
                                                index={(currentPage - 1) * boxesPerRoom + idx + 1}
                                                onClick={handleOpenBox}
                                                isOpenedByMe={box.openedBy?.userId === currentUserId}
                                                isOpening={openingBoxId === box.id}
                                                brandLogo={brandLogo}
                                                openedBrandLogo={openedBrandLogo}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>

                {/* Bottom Navigation minimized for safer taps */}
                <div className="fixed bottom-0 w-full max-w-md px-4 pb-[max(12px,env(safe-area-inset-bottom))] z-40">
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/80 border border-yellow-400/20 shadow-[0_-3px_14px_rgba(0,0,0,0.35)] px-3 py-2">
                        <motion.button
                            onClick={openInfo}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-300 hover:text-yellow-300 px-3 py-2 rounded-xl hover:bg-white/5"
                            whileTap={{ scale: 0.95 }}
                        >
                            <Menu className="w-4 h-4" />
                            <span>Info</span>
                        </motion.button>
                        <motion.button
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-300 px-3 py-2 rounded-xl bg-white/5 border border-yellow-300/30"
                            whileTap={{ scale: 0.95 }}
                            disabled
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </motion.button>
                        <motion.button
                            onClick={openProfile}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-300 hover:text-red-300 px-3 py-2 rounded-xl hover:bg-white/5"
                            whileTap={{ scale: 0.95 }}
                        >
                            <User className="w-4 h-4" />
                            <span>Profil</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
