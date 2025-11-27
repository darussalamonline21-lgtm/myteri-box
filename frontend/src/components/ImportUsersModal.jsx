import React, { useState, useEffect } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import apiClient from '../services/apiClient';

const ImportUsersModal = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [showErrors, setShowErrors] = useState(false);
    const [campaignId, setCampaignId] = useState('');
    const [defaultInitialCoupons, setDefaultInitialCoupons] = useState('');
    const [campaigns, setCampaigns] = useState([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [campaignError, setCampaignError] = useState('');

    useEffect(() => {
        const loadCampaigns = async () => {
            try {
                setIsLoadingCampaigns(true);
                setCampaignError('');
                const res = await apiClient.get('/admin/campaigns');
                setCampaigns(res.data || []);
                if (!campaignId && res.data?.length) {
                    setCampaignId(res.data[0].id);
                }
            } catch (err) {
                console.error('Failed to load campaigns:', err);
                setCampaignError(err.response?.data?.message || 'Failed to load campaigns');
            } finally {
                setIsLoadingCampaigns(false);
            }
        };
        loadCampaigns();
    }, [campaignId]);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            setFile(droppedFile);
            setResult(null);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const downloadTemplate = () => {
        const csvContent = 'name,ownerName,email,phone,storeName,password,initialCoupons\n'
            + 'John Doe,Owner John,john@example.com,081234567890,John\'s Store,password123,100\n'
            + 'Jane Smith,Owner Jane,jane@example.com,081234567891,Jane\'s Mart,,50';

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'user-import-template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) return;
        if (!campaignId) {
            setResult({
                successCount: 0,
                failedCount: 0,
                errors: [{ row: 0, message: 'campaignId is required. Pilih/isi campaignId dulu.' }]
            });
            return;
        }

        setIsUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('campaignId', campaignId);
            if (defaultInitialCoupons !== '') {
                formData.append('initialCoupons', defaultInitialCoupons);
            }

            const response = await apiClient.post('/admin/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = response.data;
            setResult(data);
            if (data.successCount > 0 && onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Upload error:', error);
            setResult({
                successCount: 0,
                failedCount: 0,
                errors: [{
                    row: 0,
                    message: error.response?.data?.message || ('Network error: ' + error.message)
                }]
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setShowErrors(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Upload className="w-6 h-6" />
                        Import Users from CSV
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Download Template */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-300 mb-1">Step 1: Download CSV Template</h3>
                                <p className="text-sm text-gray-300 mb-3">
                                    Template berisi kolom: name, ownerName, email, phone, storeName, password, initialCoupons.
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition text-white"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Template
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Campaign & Default Coupons */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Campaign (wajib)</label>
                            <select
                                value={campaignId}
                                onChange={(e) => setCampaignId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-500 outline-none"
                                disabled={isLoadingCampaigns}
                            >
                                <option value="">-- pilih campaign --</option>
                                {campaigns.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                User akan otomatis mendapat kupon di campaign ini.
                            </p>
                            {campaignError && (
                                <p className="text-xs text-red-400 mt-1">{campaignError}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Default Initial Coupons (opsional)</label>
                            <input
                                type="number"
                                value={defaultInitialCoupons}
                                onChange={(e) => setDefaultInitialCoupons(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-500 outline-none"
                                placeholder="contoh: 100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Jika kolom initialCoupons kosong di CSV, nilai ini dipakai.</p>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div>
                        <h3 className="font-semibold text-white mb-3">Step 2: Upload Your CSV File</h3>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                border-2 border-dashed rounded-lg p-8 text-center transition
                ${isDragging
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                }
              `}
                        >
                            {file ? (
                                <div className="space-y-3">
                                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                                    <p className="text-white font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-400">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                        Remove file
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Upload className="w-12 h-12 text-gray-500 mx-auto" />
                                    <p className="text-gray-300">
                                        Drag and drop your CSV file here, or
                                    </p>
                                    <label className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <span className="text-white font-medium">Browse Files</span>
                                    </label>
                                    <p className="text-xs text-gray-500">Only CSV files (max 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="space-y-3">
                            <div className="bg-gray-800 rounded-lg p-4">
                                <h3 className="font-semibold text-white mb-3">Import Results</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">Successful</p>
                                        <p className="text-2xl font-bold text-green-400">{result.successCount}</p>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">Failed</p>
                                        <p className="text-2xl font-bold text-red-400">{result.failedCount}</p>
                                    </div>
                                </div>

                                {result.successfulUsers && result.successfulUsers.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-400 mb-2">Successfully imported users:</p>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {result.successfulUsers.map((user, idx) => (
                                                <div key={idx} className="text-xs bg-gray-900 rounded p-2">
                                                    <span className="text-green-400">{user.name}</span>
                                                    {user.generatedPassword && (
                                                        <span className="text-yellow-400 ml-2">
                                                            (Password: {user.generatedPassword})
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.errors && result.errors.length > 0 && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setShowErrors(!showErrors)}
                                            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            {showErrors ? 'Hide' : 'Show'} Error Details ({result.errors.length})
                                        </button>
                                        {showErrors && (
                                            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                                {result.errors.map((error, idx) => (
                                                    <div key={idx} className="text-xs bg-red-900/20 border border-red-500/30 rounded p-2 text-red-300">
                                                        Row {error.row}: {error.message}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-700 rounded-lg hover:border-gray-600 transition text-white"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className={`
                px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2
                ${!file || isUploading
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-500 text-white'
                                }
              `}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload & Process
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportUsersModal;
