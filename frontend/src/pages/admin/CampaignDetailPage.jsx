import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import campaignApi from '../../services/campaignApi';
import { resolveImageUrl } from '../../utils/imageUrl';

const emptyPrizeForm = {
  name: '',
  tier: 'A',
  type: '',
  stockTotal: '',
  baseProbability: '',
  imageUrl: '',
  description: '',
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isGeneratingBoxes, setIsGeneratingBoxes] = useState(false);
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [prizeForm, setPrizeForm] = useState(emptyPrizeForm);
  const [prizeImageFile, setPrizeImageFile] = useState(null);
  const [isSubmittingPrize, setIsSubmittingPrize] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [editPrizeForm, setEditPrizeForm] = useState(emptyPrizeForm);
  const [editPrizeImageFile, setEditPrizeImageFile] = useState(null);
  const [isUpdatingPrize, setIsUpdatingPrize] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [pointsTemplate, setPointsTemplate] = useState(5);
  const probabilityPresets = [1, 0.5, 0.1, 0.01, 0.001];
  const [activeTab, setActiveTab] = useState('overview');
  const [boxes, setBoxes] = useState([]);
  const [boxMeta, setBoxMeta] = useState(null);
  const [boxError, setBoxError] = useState('');
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [room, setRoom] = useState(1);

  // Derive probability info for Tier S
  const totalCouponsEarned = campaign?.totalCouponsEarned || 0;
  const totalCouponsUsed = campaign?.totalCouponsUsed || 0;
  const totalCouponsBalance = campaign?.totalCouponsBalance || 0;
  const remainingOpens = Math.max(0, totalCouponsEarned - totalCouponsUsed);
  const tierSPrizes = (campaign?.prizes || []).filter(
    (p) => (p.tier || '').toUpperCase() === 'S' && p.isActive
  );
  const remainingMain = tierSPrizes.reduce((sum, p) => sum + (p.stockRemaining || 0), 0);
  const pTierS = remainingOpens > 0 ? Math.min(1, remainingMain / remainingOpens) : 0;
  // baseProbability disimpan sebagai bobot 0-1; untuk tampilan, kalikan 100 agar mudah dibaca
  const tierSWeightSum = tierSPrizes.reduce(
    (sum, p) => sum + (Number(p.baseProbability) * 100 || 0),
    0
  );

  useEffect(() => {
    fetchCampaignDetail();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'boxes') {
      fetchBoxes(room);
    }
  }, [activeTab, room]);

  const fetchCampaignDetail = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/admin/campaigns/${id}`);
      setCampaign(response.data);
    } catch (err) {
      console.error('Failed to load campaign detail:', err);
      setError(err.response?.data?.message || 'Failed to load campaign detail');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBoxes = async (amount = 100) => {
    if (!window.confirm(`Generate ${amount} boxes? Tindakan ini tidak bisa di-undo.`)) return;
    setIsGeneratingBoxes(true);
    setError('');
    setInfoMessage('');
    try {
      await apiClient.post(`/admin/campaigns/${id}/boxes/generate`, { amount });
      setInfoMessage(`Successfully generated ${amount} boxes.`);
      await fetchCampaignDetail();
    } catch (err) {
      console.error('Failed to generate boxes:', err);
      setError(err.response?.data?.message || 'Failed to generate boxes');
    } finally {
      setIsGeneratingBoxes(false);
    }
  };

  const handlePrizeInputChange = (event) => {
    const { name, value } = event.target;
    setPrizeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePrizeFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setPrizeImageFile(file);
  };

  const handleEditPrizeFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setEditPrizeImageFile(file);
  };

  const handlePrizeSubmit = async (event) => {
    event.preventDefault();
    setIsSubmittingPrize(true);
    setError('');
    setInfoMessage('');
    try {
      const formData = new FormData();
      formData.append('name', prizeForm.name.trim());
      formData.append('tier', prizeForm.tier);
      formData.append('type', prizeForm.type.trim());
      formData.append('stockTotal', Number(prizeForm.stockTotal));
      // Input di UI dianggap persen (0-100), backend disimpan sebagai bobot 0-1
      formData.append('baseProbability', Number(prizeForm.baseProbability) / 100);
      formData.append('description', prizeForm.description?.trim() || '');
      if (prizeImageFile) {
        formData.append('image', prizeImageFile);
      } else if (prizeForm.imageUrl.trim()) {
        formData.append('imageUrl', prizeForm.imageUrl.trim());
      }

      await apiClient.post(`/admin/campaigns/${id}/prizes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPrizeForm(emptyPrizeForm);
      setPrizeImageFile(null);
      setShowPrizeForm(false);
      setInfoMessage('Prize added successfully.');
      await fetchCampaignDetail();
    } catch (err) {
      console.error('Failed to add prize:', err);
      setError(err.response?.data?.message || 'Failed to add prize');
    } finally {
      setIsSubmittingPrize(false);
    }
  };

  const openEditPrize = (prize) => {
    setEditingPrize(prize);
    setEditPrizeForm({
      name: prize.name || '',
      tier: prize.tier || 'A',
      type: prize.type || '',
      stockTotal: prize.stockTotal || '',
      // Tampilkan kembali sebagai persen di UI
      baseProbability: prize.baseProbability ? (Number(prize.baseProbability) * 100).toString() : '',
      imageUrl: prize.imageUrl || '',
      description: prize.description || '',
    });
    setEditPrizeImageFile(null);
  };

  const handleEditPrizeInputChange = (event) => {
    const { name, value } = event.target;
    setEditPrizeForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTogglePrizeStatus = async (prize, nextActive) => {
    if (!prize?.id) return;
    const confirmMsg = nextActive
      ? `Aktifkan kembali "${prize.name}"?`
      : `Nonaktifkan "${prize.name}"? Hadiah tidak akan ikut undian.`;
    if (!window.confirm(confirmMsg)) return;
    setIsTogglingStatus(true);
    setError('');
    setInfoMessage('');
    try {
      await apiClient.put(`/admin/prizes/${prize.id}`, { isActive: nextActive });
      setInfoMessage(`Prize ${nextActive ? 'activated' : 'deactivated'} successfully.`);
      await fetchCampaignDetail();
    } catch (err) {
      console.error('Failed to toggle prize status:', err);
      setError(err.response?.data?.message || 'Failed to update prize status');
    } finally {
      setIsTogglingStatus(false);
    }
  };


  const handleUpdatePrize = async (event) => {
    event.preventDefault();
    if (!editingPrize) return;
    setIsUpdatingPrize(true);
    setError('');
    setInfoMessage('');
    try {
      const formData = new FormData();
      formData.append('name', editPrizeForm.name.trim());
      formData.append('tier', editPrizeForm.tier);
      formData.append('type', editPrizeForm.type.trim());
      formData.append('stockTotal', Number(editPrizeForm.stockTotal));
      // Simpan sebagai bobot 0-1
      formData.append('baseProbability', Number(editPrizeForm.baseProbability) / 100);
      formData.append('description', editPrizeForm.description?.trim() || '');
      if (editPrizeImageFile) {
        formData.append('image', editPrizeImageFile);
      } else if (editPrizeForm.imageUrl?.trim()) {
        formData.append('imageUrl', editPrizeForm.imageUrl.trim());
      }

      await apiClient.put(`/admin/prizes/${editingPrize.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditPrizeImageFile(null);
      setEditingPrize(null);
      setInfoMessage('Prize updated successfully.');
      await fetchCampaignDetail();
    } catch (err) {
      console.error('Failed to update prize:', err);
      setError(err.response?.data?.message || 'Failed to update prize');
    } finally {
      setIsUpdatingPrize(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  const fetchBoxes = async (roomNumber = room) => {
    setIsLoadingBoxes(true);
    setBoxError('');
    try {
      const data = await campaignApi.getCampaignBoxes(id, { room: roomNumber });
      setBoxes(data.items || []);
      setBoxMeta(data.meta || null);
    } catch (err) {
      console.error('Failed to load boxes:', err);
      setBoxError(err.response?.data?.message || 'Failed to load boxes');
    } finally {
      setIsLoadingBoxes(false);
    }
  };

  const totalPrizeUnits = campaign?.prizes?.reduce((sum, p) => sum + (p.stockTotal || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-lg">Loading campaign...</p>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 px-6 py-4 rounded-lg border border-red-500">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex gap-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'overview' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('boxes')}
            className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'boxes' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Boxes (room size: 100)
          </button>
        </div>

        {activeTab === 'overview' && (
        <>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">
              Campaign #{campaign?.id}
            </p>
            <h1 className="text-3xl font-bold">{campaign?.name}</h1>
            <div className="flex items-center gap-4 mt-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  campaign?.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-600/30 text-gray-300'
                }`}
              >
                {campaign?.isActive ? 'Active' : 'Inactive'}
              </span>
              <p className="text-gray-400">
                {formatDate(campaign?.startDate)} - {formatDate(campaign?.endDate)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/admin/campaigns"
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              {'<- Back to Campaigns'}
            </Link>
            <Link
              to={`/admin/campaigns/${campaign?.id}/edit`}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold"
            >
              Edit Campaign
            </Link>
          </div>
        </div>

        {(error || infoMessage) && (
          <div className={`px-4 py-3 rounded-lg ${error ? 'bg-red-500/20 border border-red-500 text-red-200' : 'bg-green-500/20 border border-green-500 text-green-200'}`}>
            {error || infoMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400">Total Boxes Generated</p>
            <p className="text-3xl font-bold mt-2">{campaign?.totalBoxes || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400">Total Prize Units</p>
            <p className="text-3xl font-bold mt-2">{totalPrizeUnits}</p>
            <p className="text-xs text-gray-500 mt-1">{campaign?.prizes?.length || 0} jenis</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400">Coupons (All Users)</p>
            <p className="text-2xl font-bold mt-2">{totalCouponsEarned}</p>
            <p className="text-xs text-gray-500">Used: {totalCouponsUsed} | Balance: {totalCouponsBalance}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400">Peluang hadiah Tier S (klik berikutnya)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-amber-300">{(pTierS * 100).toFixed(2)}%</p>
              <span className="text-xs text-gray-400">≈ {remainingMain} stok S tersisa</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kupon yang belum dipakai: {remainingOpens || 0} • Total bobot Tier S: {tierSWeightSum || 0}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Actions</h2>
            <p className="text-gray-400 text-sm">Generate boxes atau kelola hadiah.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowPrizeForm((prev) => !prev)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500"
            >
              {showPrizeForm ? 'Close Prize Form' : '+ Add Prize'}
            </button>
            <button
              onClick={() => fetchCampaignDetail()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
            >
              Save (Refresh)
            </button>
            <button
              onClick={() => navigate(`/admin/campaigns/${id}/audit`)}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              View Audit Log
            </button>
          </div>
        </div>

        {showPrizeForm && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">New Prize</h3>
            <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 mb-4 text-sm text-gray-300">
              <p className="font-semibold text-white mb-1">Guideline gambar hadiah</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Rasio 1:1 (square), direkomendasikan 640×640 (minimal 512×512).</li>
                <li>Format WebP/JPG; ukuran berkas ideal ≤ 500KB (maksimal 5MB diterima).</li>
                <li>Fokus ke produk, latar bersih; hindari teks kecil yang sulit dibaca.</li>
                <li>Pilih salah satu: upload file atau isi URL gambar.</li>
              </ul>
            </div>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Template: Points Unlimited</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={pointsTemplate}
                    onChange={(e) => setPointsTemplate(Number(e.target.value) || 1)}
                    className="w-24 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                  />
                  <button
                    onClick={() => setPrizeForm({
                      name: `Points ${pointsTemplate}`,
                      tier: 'C',
                      type: 'points',
                      stockTotal: 1000000000,
                      baseProbability: 1,
                      imageUrl: '',
                      description: `Points ${pointsTemplate}`,
                    })}
                    className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-sm font-semibold"
                  >
                    Apply Template
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Stok sangat besar, minimal hadiah poin sesuai input.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Prob. Preset</label>
                <select
                  onChange={(e) => setPrizeForm(prev => ({ ...prev, baseProbability: e.target.value }))}
                  value={prizeForm.baseProbability}
                  className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Custom</option>
                  {probabilityPresets.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <form onSubmit={handlePrizeSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="name">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={prizeForm.name}
                  onChange={handlePrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="description">Description</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={prizeForm.description}
                  onChange={handlePrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Points 5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="tier">Tier *</label>
                <select
                  id="tier"
                  name="tier"
                  value={prizeForm.tier}
                  onChange={handlePrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="type">Type *</label>
                <input
                  id="type"
                  name="type"
                  type="text"
                  required
                  value={prizeForm.type}
                  onChange={handlePrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="stockTotal">Stock Total *</label>
                <input
                  id="stockTotal"
                  name="stockTotal"
                  type="number"
                  min="1"
                  required
                  value={prizeForm.stockTotal}
                  onChange={handlePrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="baseProbability">Base Probability (%) *</label>
                <input
                  id="baseProbability"
                  name="baseProbability"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={prizeForm.baseProbability}
                  onChange={handlePrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="image">Upload Image</label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handlePrizeFileChange}
                  className="w-full text-sm text-gray-200 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Opsional: jika tidak upload, isi URL di bawah.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="imageUrl">Image URL (opsional)</label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={prizeForm.imageUrl}
                  onChange={handlePrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPrize}
                  className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 font-semibold"
                >
                  {isSubmittingPrize ? 'Saving...' : 'Save Prize'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Generate Boxes</h3>
              <p className="text-sm text-gray-400">Gunakan dengan hati-hati. Tidak dapat di-undo.</p>
            </div>
            <button
              onClick={() => handleGenerateBoxes(100)}
              disabled={isGeneratingBoxes}
              className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-60"
            >
              {isGeneratingBoxes ? 'Generating...' : 'Generate 100 Boxes'}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h3 className="text-xl font-semibold">Prizes</h3>
            <span className="text-sm text-gray-400">
              {campaign?.prizes?.length || 0} items · {totalPrizeUnits} unit
            </span>
          </div>
          {campaign?.prizes?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Prize</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Tier</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Probability</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {campaign.prizes.map((prize) => (
                    <tr key={prize.id} className="hover:bg-gray-700/40">
                      <td className="px-6 py-4 flex items-center gap-4">
                        {prize.imageUrl ? (
                          <img src={resolveImageUrl(prize.imageUrl)} alt={prize.name} className="w-12 h-12 rounded-lg object-cover border border-gray-600" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                            N/A
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{prize.name}</p>
                          <p className="text-sm text-gray-400">#{prize.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{prize.tier}</td>
                      <td className="px-6 py-4">{prize.type}</td>
                      <td className="px-6 py-4">
                        {prize.stockRemaining}/{prize.stockTotal}
                      </td>
                      <td className="px-6 py-4">
                        {(Number(prize.baseProbability) * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${prize.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {prize.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditPrize(prize)}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold"
                          >
                            Edit
                          </button>
                          {prize.isActive ? (
                            <button
                              onClick={() => handleTogglePrizeStatus(prize, false)}
                              disabled={isTogglingStatus}
                              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60 text-sm font-semibold"
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTogglePrizeStatus(prize, true)}
                              disabled={isTogglingStatus}
                              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 text-sm font-semibold"
                            >
                              Aktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-gray-400">
              No prizes added yet.
            </div>
          )}
        </div>
        </>
        )}

        {editingPrize && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Prize: {editingPrize.name}</h3>
              <button
                onClick={() => { setEditingPrize(null); setEditPrizeImageFile(null); }}
                className="text-sm text-gray-300 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 mb-4 text-sm text-gray-300">
              <p className="font-semibold text-white mb-1">Guideline gambar hadiah</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Rasio 1:1 (square), rekomendasi 640×640 (min 512×512).</li>
                <li>Format WebP/JPG; ideal ≤ 500KB (maks 5MB).</li>
                <li>Latar bersih, fokus produk; pilih upload atau URL.</li>
              </ul>
            </div>
            <form onSubmit={handleUpdatePrize} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-name">Name *</label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  required
                  value={editPrizeForm.name}
                  onChange={handleEditPrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-description">Description</label>
                <input
                  id="edit-description"
                  name="description"
                  type="text"
                  value={editPrizeForm.description}
                  onChange={handleEditPrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Points 5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-tier">Tier *</label>
                <select
                  id="edit-tier"
                  name="tier"
                  value={editPrizeForm.tier}
                  onChange={handleEditPrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-type">Type *</label>
                <input
                  id="edit-type"
                  name="type"
                  type="text"
                  required
                  value={editPrizeForm.type}
                  onChange={handleEditPrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-stockTotal">Stock Total *</label>
                <input
                  id="edit-stockTotal"
                  name="stockTotal"
                  type="number"
                  min="1"
                  required
                  value={editPrizeForm.stockTotal}
                  onChange={handleEditPrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-baseProbability">Base Probability (%) *</label>
                <input
                  id="edit-baseProbability"
                  name="baseProbability"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={editPrizeForm.baseProbability}
                  onChange={handleEditPrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-image">Upload Image</label>
                <input
                  id="edit-image"
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleEditPrizeFileChange}
                  className="w-full text-sm text-gray-200 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Opsional: jika tidak upload, gunakan URL.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="edit-imageUrl">Image URL (opsional)</label>
                <input
                  id="edit-imageUrl"
                  name="imageUrl"
                  type="text"
                  value={editPrizeForm.imageUrl}
                  onChange={handleEditPrizeInputChange}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg atau /uploads/prizes/file.webp"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingPrize(null); setEditPrizeImageFile(null); }}
                  className="px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPrize}
                  className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 font-semibold"
                >
                  {isUpdatingPrize ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'boxes' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Boxes</h3>
                <p className="text-sm text-gray-400">Filter per room (room size mengikuti setting campaign).</p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Room</label>
                  <input
                    type="number"
                    min="1"
                    value={room}
                    onChange={(e) => setRoom(Number(e.target.value) || 1)}
                    className="w-24 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => fetchBoxes(room)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
                  disabled={isLoadingBoxes}
                >
                  {isLoadingBoxes ? 'Loading...' : 'Apply'}
                </button>
              </div>
            </div>

            {boxError && (
              <div className="px-4 py-3 rounded-lg bg-red-500/20 border border-red-500 text-red-200">
                {boxError}
              </div>
            )}

            {isLoadingBoxes ? (
              <div className="py-8 text-center text-gray-400">Loading boxes...</div>
            ) : boxes.length === 0 ? (
              <div className="py-8 text-center text-gray-400">No boxes found for this room.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Room</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Opened By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {boxes.map((box) => (
                      <tr key={box.id} className="hover:bg-gray-700/40">
                        <td className="px-4 py-3 font-mono text-gray-200">#{box.id}</td>
                        <td className="px-4 py-3 text-white">{box.name}</td>
                        <td className="px-4 py-3 text-gray-200">{box.roomNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            box.status === 'opened'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-green-500/20 text-green-300 border border-green-500/40'
                          }`}>
                            {box.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-200">
                          {box.openedBy ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold">{box.openedBy.name}</div>
                              <div className="text-xs text-gray-400">{box.openedBy.storeCode}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {boxMeta && (
              <div className="text-sm text-gray-400">
                Total boxes: {boxMeta.total} | Page {boxMeta.page} / {boxMeta.totalPages} (room size {boxMeta.roomSize})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetailPage;
