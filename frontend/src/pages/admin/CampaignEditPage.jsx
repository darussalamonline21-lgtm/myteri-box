import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import campaignApi from '../../services/campaignApi';

const CampaignEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    adminWhatsappNumber: '',
    isActive: false,
  });
  const [campaignData, setCampaignData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await campaignApi.getCampaignById(id);
      setCampaignData(data);
      
      // Pre-fill the form
      setFormData({
        name: data.name || '',
        description: data.description || '',
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        adminWhatsappNumber: data.adminWhatsappNumber || '',
        isActive: data.isActive || false,
      });
    } catch (err) {
      console.error('Failed to load campaign:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Campaign name is required');
      }
      if (!formData.startDate) {
        throw new Error('Start date is required');
      }
      if (!formData.endDate) {
        throw new Error('End date is required');
      }
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        throw new Error('End date must be after start date');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        minPurchasePerCoupon: 0,
        adminWhatsappNumber: formData.adminWhatsappNumber.trim() || null,
        isActive: formData.isActive
      };

      await campaignApi.updateCampaign(id, payload);
      
      // Redirect to campaign list on success
      navigate('/admin/campaigns', { 
        state: { message: 'Campaign updated successfully!' }
      });
    } catch (err) {
      console.error('Failed to update campaign:', err);
      if (err.response?.data?.errors) {
        // Handle Zod validation errors
        const errorMessages = err.response.data.errors.map(e => e.message).join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update campaign');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/campaigns');
  };

  const handleDelete = async () => {
    const first = window.confirm('Hapus campaign ini? Semua box dan hadiah terkait akan ikut terhapus. Lanjutkan?');
    if (!first) return;
    const second = window.prompt('Ketik DELETE CAMPAIGN untuk konfirmasi');
    if (second !== 'DELETE CAMPAIGN') return;
    setIsSaving(true);
    setError('');
    try {
      await campaignApi.deleteCampaign(id);
      navigate('/admin/campaigns', { state: { message: 'Campaign deleted' } });
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const getStatusBadge = (isActive) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-bold';
    if (isActive) {
      return `${baseClasses} bg-green-500 text-green-900`;
    }
    return `${baseClasses} bg-red-500 text-white`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 text-white p-8 flex items-center justify-center">
        <div className="text-xl">Loading campaign data...</div>
      </div>
    );
  }

  if (error && !campaignData) {
    return (
      <div className="min-h-screen bg-gray-800 text-white p-8">
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-md mx-auto text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button 
            onClick={() => navigate('/admin/campaigns')}
            className="py-2 px-4 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  // Get today's date for minimum date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-800 text-white p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Edit Campaign</h1>
        {campaignData && (
          <p className="text-gray-400 mt-2">Campaign ID: {campaignData.id}</p>
        )}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('/admin/campaigns')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to Campaign List
          </button>
          <button
            onClick={handleDelete}
            className="text-sm text-red-300 hover:text-red-200"
            disabled={isSaving}
          >
            Delete Campaign
          </button>
        </div>
      </header>

      <main className="space-y-8">
        {/* Edit Form */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Campaign Details</h2>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter campaign description (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin WhatsApp Number
              </label>
              <input
                type="tel"
                name="adminWhatsappNumber"
                value={formData.adminWhatsappNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Contoh: 62812xxxxxxx (opsional)"
              />
              <p className="text-xs text-gray-400 mt-1">
                Nomor ini dipakai untuk tombol kirim ringkasan hadiah (WhatsApp) di aplikasi user.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
                Activate campaign
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Updating...' : 'Update Campaign'}
              </button>
            </div>
          </form>
        </div>

        {/* Bonus: Campaign Statistics */}
        {campaignData && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-6">Campaign Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 uppercase">Status</h3>
                <div className="mt-2">
                  <span className={getStatusBadge(campaignData.isActive)}>
                    {campaignData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 uppercase">Total Boxes</h3>
                <div className="mt-2 text-2xl font-bold">{campaignData.boxes?.length || 0}</div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 uppercase">Total Prizes</h3>
                <div className="mt-2 text-2xl font-bold">{campaignData.prizes?.length || 0}</div>
              </div>
            </div>

            {/* Boxes List */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Magic Boxes</h3>
              {campaignData.boxes && campaignData.boxes.length > 0 ? (
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-3">
                    Showing first 10 boxes out of {campaignData.boxes.length} total
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {campaignData.boxes.slice(0, 10).map(box => (
                      <div key={box.id} className="flex justify-between items-center py-2 px-3 bg-gray-700 rounded">
                        <span className="text-sm">{box.name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          box.status === 'available' ? 'bg-green-500 text-green-900' : 'bg-gray-500 text-gray-900'
                        }`}>
                          {box.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No boxes found for this campaign</p>
              )}
            </div>

            {/* Prizes List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Prizes</h3>
              {campaignData.prizes && campaignData.prizes.length > 0 ? (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="py-2 px-4 text-left text-sm">Prize Name</th>
                          <th className="py-2 px-4 text-left text-sm">Tier</th>
                          <th className="py-2 px-4 text-left text-sm">Type</th>
                          <th className="py-2 px-4 text-left text-sm">Stock</th>
                          <th className="py-2 px-4 text-left text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {campaignData.prizes.map(prize => (
                          <tr key={prize.id} className="hover:bg-gray-700">
                            <td className="py-2 px-4 text-sm">{prize.name}</td>
                            <td className="py-2 px-4 text-sm">
                              <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                {prize.tier}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-sm">{prize.type}</td>
                            <td className="py-2 px-4 text-sm">
                              {prize.stockRemaining} / {prize.stockTotal}
                            </td>
                            <td className="py-2 px-4 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                prize.isActive ? 'bg-green-500 text-green-900' : 'bg-red-500 text-white'
                              }`}>
                                {prize.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No prizes found for this campaign</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CampaignEditPage;
