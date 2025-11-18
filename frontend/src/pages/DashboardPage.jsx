import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import MysteryBox from '../components/MysteryBox.jsx';

// Konfigurasi
const CURRENT_CAMPAIGN_ID = 2;
const BOXES_PER_PAGE = 100;

const DashboardPage = () => {
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

    // Fungsi untuk mengambil data ringkasan
    const fetchCampaignSummary = useCallback(async () => {
        try {
            const response = await apiClient.get(`/campaigns/${CURRENT_CAMPAIGN_ID}/summary`);
            setSummary(response.data);
        } catch (err) {
            console.error("Failed to fetch campaign summary:", err);
            setError(err.response?.data?.message || "Could not load campaign data.");
        }
    }, []);

    // Fungsi untuk mengambil daftar semua kotak
    const fetchBoxes = useCallback(async () => {
        setIsLoadingBoxes(true);
        try {
            const response = await apiClient.get(`/campaigns/${CURRENT_CAMPAIGN_ID}/boxes`);
            setAllBoxes(response.data);
            setTotalPages(Math.ceil(response.data.length / BOXES_PER_PAGE));
        } catch (err) {
             console.error("Failed to fetch boxes:", err);
             setError("Could not load the mystery boxes.");
        } finally {
            setIsLoadingBoxes(false);
        }
    }, []);

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

    // Effect untuk mengelola paginasi
    useEffect(() => {
        if (allBoxes.length > 0) {
            const startIndex = (currentPage - 1) * BOXES_PER_PAGE;
            const endIndex = startIndex + BOXES_PER_PAGE;
            setDisplayedBoxes(allBoxes.slice(startIndex, endIndex));
        }
    }, [allBoxes, currentPage]);

    // Fungsi untuk menangani aksi membuka kotak
    const handleOpenBox = async (boxId) => {
        if (openingBoxId || (summary && summary.couponBalance.balance <= 0)) return;

        setOpeningBoxId(boxId); // Memulai animasi
        setOpenBoxError('');
        setWonPrize(null);

        try {
            const response = await apiClient.post(`/boxes/${boxId}/open`);
            
            // Tampilkan hadiah setelah jeda singkat untuk efek dramatis
            setTimeout(() => {
                setWonPrize(response.data.prize);
            }, 500); // Jeda 0.5 detik

            // Update UI secara optimis
            setSummary(prev => ({
                ...prev,
                couponBalance: response.data.couponBalance,
                stats: { ...prev.stats, totalPrizesWon: prev.stats.totalPrizesWon + 1 }
            }));
            setAllBoxes(prevBoxes => 
                prevBoxes.map(b => 
                    b.id === boxId 
                    ? { ...b, status: 'opened', openedBy: { userId: currentUserId, name: 'You' } } 
                    : b
                )
            );
        } catch (err) {
            console.error("Failed to open box:", err);
            setOpenBoxError(err.response?.data?.message || "An error occurred.");
            fetchCampaignSummary();
        } finally {
            // Hentikan animasi setelah jeda
            setTimeout(() => {
                setOpeningBoxId(null);
            }, 500);
        }
    };
    
    // Fungsi-fungsi pembantu lainnya
    const closeModal = () => { setWonPrize(null); setOpenBoxError(''); };
    const handleSelectRoom = (roomNumber) => {
        setCurrentPage(roomNumber);
        setSelectedRoom(roomNumber);
    };
    const handleBackToRooms = () => { setSelectedRoom(null); };

    const currentUserId = localStorage.getItem('userId');

    // Tampilan loading dan error
    if (isLoadingSummary && !summary) {
        return <div className="p-8 text-center"><p>Loading Dashboard...</p></div>;
    }
    if (error) {
        return <div className="p-8 text-center bg-red-100 text-red-700 p-4 rounded-lg"><p>{error}</p></div>;
    }

    return (
        <div className="p-8">
            {/* Modal untuk menampilkan hasil */}
            {(wonPrize || openBoxError) && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-2xl text-center w-full max-w-md">
                        {wonPrize ? (
                            <>
                                <h2 className="text-2xl font-bold text-green-500 mb-4">Congratulations!</h2>
                                <p className="text-lg text-gray-700">You won:</p>
                                <p className="text-3xl font-bold text-gray-900 my-4">{wonPrize.name}</p>
                                <p className="text-gray-500">Tier: {wonPrize.tier}</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-red-500 mb-4">Oops!</h2>
                                <p className="text-lg text-gray-700">{openBoxError}</p>
                            </>
                        )}
                        <button onClick={closeModal} className="mt-8 py-2 px-6 bg-blue-500 text-white rounded-lg">
                            Close
                        </button>
                    </div>
                </div>
            )}
            
            {/* Header dan Kartu Info */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{summary?.campaign.name}</h1>
            <p className="text-gray-600 mb-8">Welcome! You have {summary?.couponBalance.balance || 0} coupons.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Coupon Balance</h2>
                    <div className="text-4xl sm:text-5xl font-bold text-blue-500 mb-2">
                        {summary?.couponBalance.balance || 0}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Stats</h2>
                    <div className="text-4xl sm:text-5xl font-bold text-green-500 mb-2">
                        {summary?.stats.totalPrizesWon || 0}
                    </div>
                    <Link to="/my-prizes" className="text-blue-500 hover:underline mt-4 inline-block font-semibold">
                        View Prize History &rarr;
                    </Link>
                </div>
            </div>

            {/* Bagian Konten Utama dengan Render Kondisional */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                {isLoadingBoxes ? (
                    <div className="text-center p-10 text-gray-500">Loading data...</div>
                ) : (
                    !selectedRoom ? (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Choose a Room</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {Array.from({ length: totalPages }, (_, index) => {
                                    const roomNumber = index + 1;
                                    const startBox = (roomNumber - 1) * BOXES_PER_PAGE + 1;
                                    const endBox = Math.min(roomNumber * BOXES_PER_PAGE, allBoxes.length);
                                    return (
                                        <button
                                            key={roomNumber}
                                            onClick={() => handleSelectRoom(roomNumber)}
                                            className="bg-blue-500 text-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center aspect-square transition-transform duration-200 hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300"
                                        >
                                            <span className="text-4xl font-bold">{roomNumber}</span>
                                            <span className="text-sm mt-2 opacity-80">Boxes {startBox}-{endBox}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div>
                             <div className="flex items-center mb-4">
                                <button 
                                    onClick={handleBackToRooms}
                                    className="mr-4 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                >
                                    &larr; Back to Rooms
                                </button>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                    Room {selectedRoom}: Choose Your Mystery Box!
                                </h2>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 sm:gap-4">
                                {displayedBoxes.map(box => (
                                    <MysteryBox 
                                        key={box.id} 
                                        box={box} 
                                        onClick={handleOpenBox} 
                                        isOpenedByMe={box.openedBy?.userId === currentUserId}
                                        isOpening={openingBoxId === box.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default DashboardPage;