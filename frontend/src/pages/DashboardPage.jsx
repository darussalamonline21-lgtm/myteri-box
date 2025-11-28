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

const ROOM_UNLOCK_THRESHOLD = parseInt(import.meta.env.VITE_ROOM_UNLOCK_THRESHOLD || '50', 10) || 50;

const deriveRoomsMeta = (boxes, roomSize, unlockThreshold) => {
    if (!Array.isArray(boxes) || boxes.length === 0 || !roomSize) return [];
    const totalRooms = Math.ceil(boxes.length / roomSize);
    const rooms = [];

    for (let i = 0; i < totalRooms; i++) {
        const startIndex = i * roomSize;
        const roomBoxes = boxes.slice(startIndex, startIndex + roomSize);
        const openedCount = roomBoxes.filter(box => box.status === 'opened').length;
        const remainingBoxes = roomBoxes.length - openedCount;
        const prevRoom = rooms[i - 1];
        const isUnlocked = i === 0
            ? true
            : Boolean(prevRoom?.isUnlocked && prevRoom.openedCount >= unlockThreshold);

        rooms.push({
            roomNumber: i + 1,
            startBox: startIndex + 1,
            endBox: startIndex + roomBoxes.length,
            totalBoxes: roomBoxes.length,
            openedCount,
            remainingBoxes,
            isUnlocked,
        });
    }
    return rooms;
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
    const [roomsMeta, setRoomsMeta] = useState([]);

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
            const payload = response.data;
            const incomingBoxes = Array.isArray(payload) ? payload : (payload?.boxes || []);
            const incomingRooms = Array.isArray(payload?.rooms) ? payload.rooms : null;
            setAllBoxes(prev => boxesEqual(prev, incomingBoxes) ? prev : incomingBoxes);
            if (incomingRooms) {
                setRoomsMeta(incomingRooms);
            } else {
                setRoomsMeta(deriveRoomsMeta(incomingBoxes, boxesPerRoom, ROOM_UNLOCK_THRESHOLD));
            }
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

    // Jika room yang dipilih terkunci (atau hilang), reset ke daftar room
    useEffect(() => {
        if (!selectedRoom) return;
        const room = roomsMeta.find(r => r.roomNumber === selectedRoom);
        if (!room || !room.isUnlocked) {
            setSelectedRoom(null);
            setCurrentPage(1);
        }
    }, [roomsMeta, selectedRoom]);

    // Effect untuk mengelola paginasi
    useEffect(() => {
        if (allBoxes.length > 0 && selectedRoom) {
            setDisplayedBoxes(allBoxes.filter(box => box.roomNumber === selectedRoom));
        } else {
            setDisplayedBoxes([]);
        }
    }, [allBoxes, selectedRoom]);

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
            fetchBoxes({ silent: true });

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
        const room = roomsMeta.find(r => r.roomNumber === roomNumber);
        if (!room || !room.isUnlocked) return;
        setCurrentPage(roomNumber);
        setSelectedRoom(roomNumber);
    };
    const handleBackToRooms = () => { setSelectedRoom(null); setCurrentPage(1); };
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
            <div className="flex items-center justify-center min-h-screen bg-amber-50">
                <div className="text-center">
                    <motion.div
                        className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-sm text-slate-700 font-semibold">Loading dashboard...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
                <motion.div
                    className="bg-white border border-slate-200 text-slate-900 px-6 py-8 rounded-2xl text-center max-w-md w-full space-y-4 shadow-sm"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <div className="text-5xl font-semibold mb-2 text-rose-500">:(</div>
                    <p className="text-lg font-semibold">Terjadi kendala</p>
                    <p className="text-sm text-slate-600">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <motion.button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold hover:bg-rose-100 transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Coba Muat Ulang
                        </motion.button>
                        <motion.button
                            onClick={() => { localStorage.clear(); navigate('/login'); }}
                            className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-semibold hover:bg-slate-200 transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
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
    const isOnRoomList = !selectedRoom;
    const unlockedRooms = roomsMeta.filter(room => room.isUnlocked);

    return (
        <div
            className="min-h-screen bg-white text-slate-900 flex justify-center font-sans"
            style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url('/patterns/patern-logo.svg')",
                backgroundRepeat: "no-repeat, space",
                backgroundSize: "auto, 320px 120px",
                backgroundPosition: "center, center"
            }}
        >
            <div className="w-full max-w-md min-h-screen flex flex-col relative pb-24 px-3">
                {/* Prize Modal */}
                <AnimatePresence>
                    {(wonPrize || openBoxError) && (
                        <motion.div
                            className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white border border-amber-200 p-6 md:p-8 rounded-2xl shadow-xl text-center w-full max-w-sm relative overflow-hidden"
                                initial={{ scale: 0.96, y: 12 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.96, y: 12 }}
                                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                            >

                                {wonPrize ? (
                                    <>
                                        <motion.div
                                            className="mb-4 mx-auto w-14 h-14 rounded-xl bg-amber-500 text-white font-semibold flex items-center justify-center"
                                            animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.92, 1, 0.92] }}
                                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            WIN
                                        </motion.div>
                                        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">Selamat!</h2>
                                        <p className="text-sm text-slate-500 mb-3 font-medium">Anda mendapat:</p>
                                        <motion.div
                                            className="mx-auto mb-4 w-40 h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"
                                            initial={{ scale: 0.98, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 240, damping: 20, delay: 0.05 }}
                                        >
                                            {wonPrize.imageUrl ? (
                                                <img
                                                    src={resolveImageUrl(wonPrize.imageUrl)}
                                                    alt={wonPrize.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold tracking-wide">
                                                    Foto hadiah belum tersedia
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-amber-500 shadow-sm">
                                                {wonPrize.tier} Tier
                                            </div>
                                        </motion.div>
                                        <p className="text-lg md:text-xl font-semibold text-slate-900 mb-1">{wonPrize.name}</p>
                                        <p className="text-xs text-slate-600 font-medium mb-1">
                                            Sisa Kupon: {remainingCoupons}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-4xl font-bold mb-2 text-amber-500">!</div>
                                        <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-2">Tidak bisa membuka box</h2>
                                        <p className="text-sm text-slate-600 mb-4">{openBoxError}</p>
                                        <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-left bg-slate-50">
                                            <p className="text-sm text-slate-700 font-semibold">Tips singkat</p>
                                            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                                <li>Cek sisa kupon sebelum buka box.</li>
                                                <li>Pilih room lain jika box di room ini sudah habis.</li>
                                                <li>Lihat riwayat hadiah di menu "Hadiah Saya".</li>
                                                <li>Gunakan kupon sebelum program berakhir supaya tidak hangus.</li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                                <motion.button
                                    onClick={closeModal}
                                    className="mt-6 w-full py-3 bg-amber-500 text-white rounded-lg font-semibold shadow-sm hover:bg-amber-600 transition"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {wonPrize
                                        ? (remainingCoupons > 0 ? 'Buka box lain' : 'Tutup')
                                        : 'Tutup'
                                    }
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info Sheet */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div
                        className="fixed inset-0 bg-amber-900/30 backdrop-blur-sm z-50 flex items-end justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeInfo}
                        >
                            <motion.div
                                className="w-full max-w-md bg-white text-slate-900 rounded-t-3xl border border-amber-200 p-6 shadow-xl space-y-4"
                                initial={{ y: 300 }}
                                animate={{ y: 0 }}
                                exit={{ y: 300 }}
                                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Tentang Program</p>
                                        <h3 className="text-2xl font-semibold text-slate-900">Magic Box Loyalty</h3>
                                    </div>
                                    <button
                                        onClick={closeInfo}
                                        className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                                        aria-label="Tutup"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                                    <p className="text-sm text-amber-900 font-semibold">Cara Main</p>
                                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                                        <li>Kumpulkan kupon dari transaksi yang memenuhi syarat.</li>
                                        <li>Pilih room, pilih box yang masih available, lalu buka.</li>
                                        <li>Lihat hadiah yang muncul; stats & kupon terupdate otomatis.</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                                    <p className="text-sm text-amber-900 font-semibold">Algoritma Hadiah</p>
                                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                                        <li>Hadiah diundi otomatis oleh sistem, termasuk hadiah utama.</li>
                                        <li>Setiap buka box diproses mesin supaya adil dan tidak bisa dipilih manual.</li>
                                        <li>Hadiah yang stoknya habis/tidak aktif tidak ikut diundi.</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                                    <p className="text-sm text-amber-900 font-semibold">Tips Singkat</p>
                                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
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
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeProfile}
                        >
                            <motion.div
                                className="w-full max-w-md bg-white text-slate-900 rounded-t-3xl border border-slate-200 p-6 shadow-xl"
                                initial={{ y: 300 }}
                                animate={{ y: 0 }}
                                exit={{ y: 300 }}
                                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-start justify-between mb-4 gap-3">
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Profil Toko</p>
                                        <h3 className="text-2xl font-semibold text-slate-900">
                                            {summary?.user?.name || 'Toko'}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">Owner: {summary?.user?.ownerName || '-'}</p>
                                        <p className="text-xs text-slate-500">Username: {summary?.user?.storeCode || '-'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleLogout}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                        <button
                                            onClick={closeProfile}
                                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                                            aria-label="Tutup"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-xs text-gray-400">Total Kupon Diterima</p>
                                            <p className="text-lg font-black text-white">{summary?.couponBalance?.totalEarned ?? 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 text-right">Total Digunakan</p>
                                            <p className="text-lg font-black text-red-300 text-right">{summary?.couponBalance?.totalUsed ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-xs text-slate-600">Sisa Kupon</p>
                                            <p className="text-2xl font-semibold text-slate-900">
                                                {summary?.couponBalance?.balance ?? 0}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-slate-600">
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
                    className="p-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 border border-amber-400 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex flex-wrap justify-between items-start mb-3 relative z-10 gap-3">
                            <div className="space-y-1.5">
                                <h1 className="text-lg md:text-xl font-semibold text-slate-900 leading-tight">
                                    {summary?.user?.storeName || summary?.user?.name || 'Toko Pemenang'}
                                </h1>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-sm font-semibold border border-slate-800 leading-none">
                                    <span className="leading-none">Kupon</span>
                                    <span className="text-base font-bold leading-none">{summary?.couponBalance?.balance || 0}</span>
                                </div>
                            </div>
                            <div className="text-right space-y-1 self-start">
                                <div className="text-[11px] uppercase tracking-[0.14em] text-amber-700 font-semibold leading-tight">Program</div>
                                <div className="text-base font-semibold text-slate-900 leading-tight">Magic Box</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative z-10 space-y-2">
                            <div className="text-xs text-slate-600">Kupon dipakai</div>
                            <div
                                className="h-5 rounded-full overflow-hidden bg-amber-50 border border-amber-200"
                                style={{ boxShadow: `0 0 0 ${progressPalette.track}` }}
                            >
                                <motion.div
                                    className="h-full flex items-center px-2 text-[11px] font-semibold text-slate-900"
                                    style={{
                                        background: `linear-gradient(90deg, ${progressPalette.start}, ${progressPalette.end})`,
                                        boxShadow: `0 0 12px ${progressPalette.glow}`,
                                        color: '#0f172a'
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${couponProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                >
                                    {couponsUsed}/{totalCouponsEarned || 0}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Button */}
                <div className="px-4 mb-6">
                    <motion.button
                        onClick={() => navigate('/my-prizes')}
                        className="w-full py-3.5 bg-amber-500 rounded-xl text-white font-semibold text-base shadow-sm hover:bg-amber-600 transition"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                        <span className="relative z-10">Hadiah Saya</span>
                    </motion.button>
                    <div className="h-[2px] bg-amber-200 mt-6 w-full"></div>
                </div>

                {/* Main Content */}
                <div className="px-4 flex-1 pb-6">
                    {isCampaignInactive ? (
                        <div className="text-center p-8 space-y-3 bg-white border border-amber-200 rounded-2xl shadow-sm">
                            <p className="text-lg font-semibold text-amber-900">Program tidak aktif</p>
                            <p className="text-sm text-slate-700">{campaignInactiveReason}</p>
                            <p className="text-xs text-slate-600">Riwayat hadiah tetap bisa dilihat lewat tombol di atas.</p>
                        </div>
                    ) : isLoadingBoxes ? (
                        <div className="text-center p-10">
                            <motion.div
                                className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p className="text-slate-700">Loading boxes...</p>
                        </div>
                    ) : (
                        !selectedRoom ? (
                            <div className="flex flex-col space-y-4 pb-6">
                                {unlockedRooms.length === 0 ? (
                                    <div className="text-center py-12 text-sm text-slate-600">
                                        Room belum tersedia. Buka box yang ada untuk membuka room berikutnya.
                                    </div>
                                ) : (
                                    unlockedRooms.map((room) => (
                                        <RoomCard
                                            key={room.roomNumber}
                                            roomNumber={room.roomNumber}
                                            startBox={room.startBox}
                                            endBox={room.endBox}
                                            remainingBoxes={room.remainingBoxes}
                                            totalBoxes={room.totalBoxes}
                                            onClick={() => handleSelectRoom(room.roomNumber)}
                                        />
                                    ))
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="px-1 mb-3">
                                    <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2 shadow-sm">
                                        <motion.button
                                            type="button"
                                            onClick={handleBackToRooms}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.96 }}
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Kembali ke Room</span>
                                        </motion.button>
                                        <div className="flex-1 text-right ml-auto">
                                            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 leading-tight whitespace-nowrap truncate max-w-[180px]">
                                                Magic Box {selectedRoom}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {displayedBoxes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No boxes in this room.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2.5">
                                        {displayedBoxes.map((box, idx) => {
                                            const roomMeta = roomsMeta.find(r => r.roomNumber === selectedRoom);
                                            const boxIndex = (roomMeta?.startBox ?? 1) + idx;
                                            return (
                                                <MysteryBox
                                                    key={box.id}
                                                    box={box}
                                                    index={boxIndex}
                                                    onClick={handleOpenBox}
                                                    isOpenedByMe={box.openedBy?.userId === currentUserId}
                                                    isOpening={openingBoxId === box.id}
                                                    brandLogo={brandLogo}
                                                    openedBrandLogo={openedBrandLogo}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>

                {/* Bottom Navigation minimized for safer taps */}
                <div className="fixed bottom-0 inset-x-0 z-40 pb-[max(12px,env(safe-area-inset-bottom))] flex justify-center">
                    <div className="w-full max-w-md px-3">
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white border border-amber-200 shadow-sm px-3 py-2">
                            <motion.button
                                onClick={openInfo}
                                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-700 hover:text-amber-900 px-3 py-2 rounded-xl hover:bg-amber-100"
                                whileTap={{ scale: 0.95 }}
                            >
                                <Menu className="w-4 h-4" />
                                <span>Info</span>
                            </motion.button>
                        <motion.button
                            onClick={() => {
                                setSelectedRoom(null);
                                setCurrentPage(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-2 rounded-xl border transition-colors ${
                                isOnRoomList
                                    ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'bg-white border-amber-200 text-amber-800'
                            }`}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </motion.button>
                            <motion.button
                                onClick={openProfile}
                                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-700 hover:text-amber-900 px-3 py-2 rounded-xl hover:bg-amber-100"
                                whileTap={{ scale: 0.95 }}
                            >
                                <User className="w-4 h-4" />
                                <span>Profil</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
