import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import campaignApi from '../../services/campaignApi';

const CampaignListPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    adminWhatsappNumber: '',
    isActive: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [generateAmount, setGenerateAmount] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCampaigns();
    if (location.state?.message) {
      setSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await campaignApi.getAllCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;
    try {
      await campaignApi.deleteCampaign(campaignId);
      await fetchCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      alert(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const handleEdit = (campaignId) => navigate(`/admin/campaigns/${campaignId}/edit`);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      await campaignApi.createCampaign({
        ...createForm,
        adminWhatsappNumber: (createForm.adminWhatsappNumber || '').trim() || null,
        minPurchasePerCoupon: 0,
      });
      setSuccess('Campaign created successfully');
      setShowCreate(false);
      setCreateForm({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        adminWhatsappNumber: '',
        isActive: true,
      });
      await fetchCampaigns();
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setError(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateQuick = async (campaignId) => {
    const amount = Number(generateAmount[campaignId] || 0);
    if (!amount || amount <= 0) {
      alert('Masukkan jumlah box yang valid.');
      return;
    }
    try {
      await campaignApi.generateBoxes(campaignId, amount);
      setSuccess(`Generated ${amount} boxes for campaign ${campaignId}`);
      await fetchCampaigns();
    } catch (err) {
      console.error('Failed to generate boxes:', err);
      alert(err.response?.data?.message || 'Failed to generate boxes');
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-CA');

  const getStatusBadge = (isActive) =>
    `${'px-2 py-1 rounded-full text-xs font-bold'} ${isActive ? 'bg-green-500 text-green-900' : 'bg-red-500 text-white'}`;

  return (
    <div className="min-h-screen bg-gray-800 text-white p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-400 hover:text-blue-300 mt-2 text-sm"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
        <button
          onClick={() => setShowCreate((prev) => !prev)}
          className="py-2 px-4 bg-green-600 rounded-lg hover:bg-green-700 font-semibold"
        >
          {showCreate ? 'Close Form' : '+ Create New Campaign'}
        </button>
      </header>

      {showCreate && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Create Campaign</h2>
          <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <input
                type="text"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Admin WhatsApp Number</label>
              <input
                type="tel"
                value={createForm.adminWhatsappNumber}
                onChange={(e) => setCreateForm({ ...createForm, adminWhatsappNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Contoh: 62812xxxxxxx (opsional)"
              />
              <p className="text-xs text-gray-400 mt-1">
                Nomor ini dipakai untuk tombol kirim ringkasan hadiah (WhatsApp) di aplikasi user.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createForm.isActive}
                onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
              />
              <span className="text-sm text-gray-300">Active</span>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold disabled:opacity-60"
              >
                {isCreating ? 'Creating...' : 'Save Campaign'}
              </button>
            </div>
          </form>
        </div>
      )}

      <main>
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
          {success && (
            <div className="bg-green-500 text-white p-3 rounded mb-4">
              {success}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-xl">Loading campaigns...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 text-xl">{error}</div>
              <button 
                onClick={fetchCampaigns}
                className="mt-4 py-2 px-4 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Start Date</th>
                      <th className="py-3 px-4 text-left">End Date</th>
                      <th className="py-3 px-4 text-left">Boxes</th>
                      <th className="py-3 px-4 text-left">Prizes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-8 text-gray-400">
                          No campaigns found
                        </td>
                      </tr>
                    ) : (
                      campaigns.map(campaign => (
                        <tr key={campaign.id} className="hover:bg-gray-700">
                          <td className="py-4 px-4 font-medium">{campaign.name}</td>
                          <td className="py-4 px-4 text-gray-300">
                            {campaign.description ? 
                              (campaign.description.length > 50 ? 
                                `${campaign.description.substring(0, 50)}...` : 
                                campaign.description
                              ) : 
                              '-'
                            }
                          </td>
                          <td className="py-4 px-4">
                            <span className={getStatusBadge(campaign.isActive)}>
                              {campaign.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4">{formatDate(campaign.startDate)}</td>
                          <td className="py-4 px-4">{formatDate(campaign.endDate)}</td>
                          <td className="py-4 px-4">{campaign.totalBoxes || 0}</td>
                          <td className="py-4 px-4">{campaign.totalPrizes || 0}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Boxes"
                                  value={generateAmount[campaign.id] || ''}
                                  onChange={(e) => setGenerateAmount({ ...generateAmount, [campaign.id]: e.target.value })}
                                  className="w-24 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                                />
                                <button
                                  onClick={() => handleGenerateQuick(campaign.id)}
                                  className="text-green-400 hover:text-green-300 px-2 py-1 rounded border border-green-400 text-sm"
                                >
                                  Generate
                                </button>
                              </div>
                              <button
                                onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                                className="text-yellow-300 hover:text-yellow-200 px-2 py-1 rounded border border-yellow-400 text-sm"
                              >
                                Manage
                              </button>
                              <button
                                onClick={() => handleEdit(campaign.id)}
                                className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(campaign.id)}
                                className="text-red-400 hover:text-red-300 px-2 py-1 rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CampaignListPage;
