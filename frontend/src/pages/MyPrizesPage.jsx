import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { resolveImageUrl } from '../utils/imageUrl';

const MyPrizesPage = () => {
    const currentCampaignId = typeof window !== 'undefined' ? localStorage.getItem('activeCampaignId') : null;

    // State
    const [prizes, setPrizes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchMyPrizes = useCallback(async () => {
        if (!currentCampaignId) return;
        try {
            setIsLoading(true);
            setError('');
            const response = await apiClient.get(`/campaigns/${currentCampaignId}/my-prizes`);
            const prizesData = response.data.items || response.data || [];
            setPrizes(Array.isArray(prizesData) ? prizesData : []);
        } catch (err) {
            console.error('Failed to fetch prizes:', err);
            setError(err.response?.data?.message || 'Riwayat hadiah tidak bisa dimuat');
        } finally {
            setIsLoading(false);
        }
    }, [currentCampaignId]);

    useEffect(() => {
        if (!currentCampaignId) {
            setPrizes([]);
            return;
        }
        fetchMyPrizes();
    }, [currentCampaignId, fetchMyPrizes]);

    const isPointPrize = (prize) => {
        const type = (prize?.type || '').toLowerCase();
        const text = `${prize?.name || ''} ${prize?.description || ''}`.toLowerCase();
        return type.includes('point') || text.includes('point') || text.includes('poin');
    };

    const extractPointValue = (prize) => {
        const text = `${prize?.name || ''} ${prize?.description || ''}`;
        const digits = text.replace(/[^\d]/g, '');
        const parsed = Number(digits);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    // Ringkasan prize (pastikan hook dipanggil sebelum return lain)
    const prizeSummary = useMemo(() => {
        let totalPoints = 0;
        let pointRewards = 0;
        const itemCounts = {};

        prizes.forEach((p, idx) => {
            if (isPointPrize(p)) {
                totalPoints += extractPointValue(p);
                pointRewards += 1;
            }
            const nameKey = String(p?.name || p?.description || `Hadiah-${idx}`);
            if (!isPointPrize(p)) {
                itemCounts[nameKey] = (itemCounts[nameKey] || 0) + 1;
            }
        });

        const itemsArray = Object.entries(itemCounts).map(([name, count]) => ({
            name,
            count: Number(count) || 0
        }));
        return { totalPoints, pointRewards, itemsArray, totalCount: prizes.length };
    }, [prizes]);

    const buildSummaryMessage = useCallback(() => {
        const storeCode = localStorage.getItem('storeCode') || 'ISI_KODE_TOKO';
        const storeName = localStorage.getItem('storeName') || '';
        const lines = [
            'Halo Admin, berikut ringkasan hadiah saya:',
            storeName ? `Toko: ${storeName}` : '',
            `Store Code: ${storeCode}`,
            `Total Hadiah: ${prizeSummary.totalCount || 0}`,
        ];

        if (prizeSummary.itemsArray.length > 0) {
            lines.push('Hadiah Barang:');
            prizeSummary.itemsArray.forEach(item => {
                lines.push(`- ${item.name}: ${item.count}x`);
            });
        }

        if (prizeSummary.totalPoints > 0) {
            const suffix = prizeSummary.pointRewards
                ? ` (dari ${prizeSummary.pointRewards} hadiah poin)`
                : '';
            lines.push(`Total Poin: ${prizeSummary.totalPoints}${suffix}`);
        }

        lines.push('Dikirim otomatis dari halaman Hadiah Saya.');

        return lines.filter(Boolean).join('\n');
    }, [prizeSummary]);

    const summaryMessage = useMemo(() => buildSummaryMessage(), [buildSummaryMessage]);

    const handleSendWhatsapp = () => {
        const ADMIN_WA_NUMBER = import.meta.env.VITE_ADMIN_WA_NUMBER || '';
        if (!ADMIN_WA_NUMBER) {
            alert('Nomor WhatsApp admin belum diset. Tambahkan VITE_ADMIN_WA_NUMBER di env frontend.');
            return;
        }
        const msg = summaryMessage;
        const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    };


    const tierClasses = {
        S: 'bg-purple-400 text-purple-900',
        A: 'bg-yellow-400 text-yellow-900',
        B: 'bg-blue-400 text-blue-900',
        C: 'bg-green-400 text-green-900',
    };

    const tierPriority = { S: 0, A: 1, B: 2, C: 3 };
    const sortedPrizes = useMemo(() => {
        return [...prizes].sort((a, b) => {
            const tierA = (a.tier || '').toUpperCase();
            const tierB = (b.tier || '').toUpperCase();
            const orderDiff = (tierPriority[tierA] ?? 99) - (tierPriority[tierB] ?? 99);
            if (orderDiff !== 0) return orderDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [prizes]);

    // Tampilan jika tidak ada campaign aktif
    if (!currentCampaignId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-8 text-slate-100">
                <div className="bg-slate-900/60 border border-slate-700 p-8 rounded-lg shadow-lg text-center max-w-md w-full">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-slate-300 text-lg">!</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Program Aktif Tidak Ada</h1>
                    <p className="text-slate-300 mb-6">
                        Anda belum terdaftar pada program aktif. Silakan hubungi admin untuk penugasan program.
                    </p>
                    <div className="space-y-3">
                        <Link
                            to="/dashboard"
                            className="block w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors text-center"
                        >
                            Ke Dashboard
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-2 px-4 bg-slate-800 text-slate-200 font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Muat Ulang Halaman
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Tampilan loading
    if (isLoading && prizes.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                    <p className="text-slate-300">Memuat hadiah Anda...</p>
                </div>
            </div>
        );
    }

    // Tampilan error
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 p-8 text-slate-100">
                <div className="bg-slate-900/60 border border-red-500/40 text-red-100 px-6 py-8 rounded-lg text-center max-w-md w-full">
                    <div className="text-4xl mb-4">:(</div>
                    <h2 className="text-xl font-bold mb-4">Riwayat Hadiah Gagal Dimuat</h2>
                    <p className="mb-6 text-slate-200">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setError('');
                                fetchMyPrizes();
                            }}
                            className="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                        >
                            Coba Lagi
                        </button>
                        <Link
                            to="/dashboard"
                            className="block w-full py-2 px-4 bg-slate-800 text-slate-200 font-semibold rounded-lg hover:bg-slate-700 transition-colors text-center"
                        >
                            Kembali ke Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-slate-400 tracking-[0.18em]">Riwayat Hadiah</p>
                    <h1 className="text-3xl font-extrabold text-white">Hadiah Saya</h1>
                    <p className="text-slate-300">
                        {prizes.length > 0
                            ? `Anda telah memperoleh ${prizes.length} hadiah di program ini`
                            : 'Lihat semua hadiah yang sudah Anda menangkan'
                        }
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {prizes.length > 0 && (
                        <button
                            onClick={handleSendWhatsapp}
                            className="py-2.5 px-4 rounded-lg bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors whitespace-nowrap"
                        >
                            Kirim Ringkasan (WA)
                        </button>
                    )}
                    <Link
                        to="/dashboard"
                        className="py-2.5 px-4 rounded-lg bg-slate-800 text-slate-100 font-semibold border border-slate-700 shadow-sm hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                        Kembali ke Dashboard
                    </Link>
                </div>
            </div>

            {/* Ringkasan hadiah singkat */}
            {prizes.length > 0 && (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
                    <div className="rounded-xl p-5 shadow-lg shadow-amber-500/20 bg-slate-800 border border-amber-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase text-amber-200 font-semibold">Total Hadiah</p>
                            <span className="text-amber-300 text-sm font-bold">Semua jenis</span>
                        </div>
                        <p className="text-3xl font-black text-white">{prizeSummary.totalCount}</p>
                        <p className="text-sm text-amber-100/80 mt-1">Total hadiah yang sudah Anda menangkan.</p>
                    </div>
                    <div className="rounded-xl p-5 shadow-lg shadow-emerald-500/20 bg-slate-800 border border-emerald-400/40">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase text-emerald-200 font-semibold">Hadiah Poin</p>
                            <span className="text-emerald-200 text-sm font-bold">Akumulasi</span>
                        </div>
                        <p className="text-3xl font-black text-white">{prizeSummary.pointRewards}</p>
                        <p className="text-sm text-emerald-100/80 mt-1">Total poin: <span className="font-semibold text-white">{prizeSummary.totalPoints}</span></p>
                    </div>
                    <div className="rounded-xl p-5 shadow-lg shadow-sky-500/20 bg-slate-800 border border-sky-400/40">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase text-sky-200 font-semibold">Rincian Hadiah</p>
                            <span className="text-sky-200 text-sm font-bold">Per jenis</span>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {prizeSummary.totalPoints > 0 && (
                                <div className="flex items-center justify-between text-sm text-sky-100 font-semibold bg-sky-900/30 border border-sky-700/40 rounded-lg px-3 py-1">
                                    <span className="truncate text-white">Poin</span>
                                    <span className="ml-2 text-sky-200">{prizeSummary.totalPoints}</span>
                                </div>
                            )}
                            {prizeSummary.itemsArray.map((item, idx) => (
                                <div key={`${item.name}-${idx}`} className="flex items-center justify-between text-sm text-sky-100 font-semibold bg-sky-900/30 border border-sky-700/40 rounded-lg px-3 py-1">
                                    <span className="truncate text-white">{item.name}</span>
                                    <span className="ml-2 text-sky-200">{item.count}x</span>
                                </div>
                            ))}
                            {prizeSummary.itemsArray.length === 0 && prizeSummary.totalPoints === 0 && (
                                <div className="text-sm text-sky-200">Belum ada hadiah.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {prizes.length === 0 && !isLoading ? (
                <div className="bg-slate-900/60 border border-slate-700 rounded-lg shadow-xl p-8 text-center">
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M9 7V5a3 3 0 016 0v2M9 12h6m-6 4h3" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Belum Ada Hadiah</h2>
                    <p className="text-slate-300 mb-6">
                        Anda belum memenangkan hadiah di program ini. Terus buka kotak untuk mendapatkan hadiah menarik!
                    </p>
                    <Link
                        to="/dashboard"
                        className="inline-block py-3 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors"
                    >
                        Mulai Buka Kotak
                    </Link>
                </div>
            ) : (
                <div className="bg-slate-900/60 border border-slate-800 shadow-xl rounded-lg overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-800 text-slate-100">
                            <thead className="bg-slate-900/80">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Tanggal Menang
                                    </th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Hadiah
                            </th>
                            <th className="py-4 px-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider w-28">
                                Tier
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-950/60 divide-y divide-slate-900">
                                {sortedPrizes.map((prize) => (
                                    <tr key={prize.id} className="hover:bg-slate-900 transition-colors">
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-300">
                                            {new Date(prize.createdAt).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12">
                                                    <img
                                                        className="h-12 w-12 object-contain rounded-lg bg-slate-800 border border-slate-700"
                                                        src={prize.imageUrl ? resolveImageUrl(prize.imageUrl) : 'https://via.placeholder.com/48'}
                                                        alt={prize.name}
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/48';
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">
                                                        {prize.name}
                                                    </div>
                                                    <div className="text-sm text-slate-300">
                                                        {prize.type || prize.description || 'Hadiah Misteri'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-center">
                                            <span
                                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tierClasses[prize.tier] || 'bg-gray-400 text-gray-900'
                                                    }`}
                                            >
                                                {prize.tier || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {sortedPrizes.map((prize) => (
                            <div key={prize.id} className="p-4 border-b border-slate-800 last:border-b-0 bg-slate-900/60">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <img
                                            className="h-16 w-16 object-contain rounded-lg bg-slate-800 border border-slate-700"
                                            src={prize.imageUrl ? resolveImageUrl(prize.imageUrl) : 'https://via.placeholder.com/64'}
                                            alt={prize.name}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/64';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-sm font-medium text-white truncate">
                                                {prize.name}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 text-xs leading-4 font-semibold rounded-full ${tierClasses[prize.tier] || 'bg-gray-400 text-gray-900'
                                                    }`}
                                            >
                                                {prize.tier || 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300 mb-2">
                                            {prize.type || prize.description || 'Hadiah Misteri'}
                                        </p>
                                        <div className="flex items-center text-xs text-slate-400">
                                            <span>
                                                {new Date(prize.createdAt).toLocaleDateString('id-ID', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading overlay for background updates */}
            {isLoading && prizes.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                            <span className="text-slate-200">Memperbarui...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPrizesPage;
