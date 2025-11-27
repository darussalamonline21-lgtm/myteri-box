import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { exportWinnersReport } from '../../services/adminReportsApi';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchCampaigns = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await apiClient.get('/admin/campaigns');
                setCampaigns(response.data);
            } catch (err) {
                console.error("Failed to fetch campaigns:", err);
                setError(err.response?.data?.message || err.message || "Could not load campaigns.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        navigate('/admin/login');
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportWinnersReport();
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export report: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-CA');

    return (
        <div className="min-h-screen bg-gray-800 text-white p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="py-2 px-4 bg-red-600 rounded-lg hover:bg-red-700 font-semibold"
                >
                    Logout
                </button>
            </header>

            <main>
                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-900 p-6 rounded-lg shadow-xl hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => navigate('/admin/campaigns')}>
                        <h3 className="text-xl font-semibold mb-2">Campaign Management</h3>
                        <p className="text-gray-400">Manage your mystery box campaigns</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-lg shadow-xl hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => navigate('/admin/users')}>
                        <h3 className="text-xl font-semibold mb-2">User Management</h3>
                        <p className="text-gray-400">Manage user accounts and permissions</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-lg shadow-xl hover:bg-gray-800 transition-colors">
                        <h3 className="text-xl font-semibold mb-2">Reports & Analytics</h3>
                        <p className="text-gray-400 mb-4">Export data and generate reports</p>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition w-full justify-center
                                ${isExporting
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }
                            `}
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Export Winners Report
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Campaign Management</h2>
                        <Link
                            to="/admin/campaigns/new"
                            className="py-2 px-4 bg-green-600 rounded-lg hover:bg-green-700 font-semibold"
                        >
                            + Create New Campaign
                        </Link>
                    </div>

                    {isLoading ? (
                        <p>Loading campaigns...</p>
                    ) : error ? (
                        <p className="text-red-400">{error}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Name</th>
                                        <th className="py-3 px-4 text-left">Status</th>
                                        <th className="py-3 px-4 text-left">Start Date</th>
                                        <th className="py-3 px-4 text-left">End Date</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {campaigns.map(campaign => (
                                        <tr key={campaign.id} className="hover:bg-gray-700">
                                            <td className="py-4 px-4">{campaign.name}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${campaign.isActive ? 'bg-green-500 text-green-900' : 'bg-gray-500 text-gray-900'}`}>
                                                    {campaign.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">{formatDate(campaign.startDate)}</td>
                                            <td className="py-4 px-4">{formatDate(campaign.endDate)}</td>
                                            <td className="py-4 px-4 text-right">
                                                <Link
                                                    to={`/admin/campaigns/${campaign.id}`}
                                                    className="text-blue-400 hover:underline"
                                                >
                                                    Manage
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;
