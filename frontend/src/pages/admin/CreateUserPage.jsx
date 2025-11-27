import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const CreateUserPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [campaignError, setCampaignError] = useState('');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    storeCode: '',
    password: '',
    campaignId: '',
    initialCoupons: '0',
  });

  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoadingCampaigns(true);
      setCampaignError('');
      const response = await apiClient.get('/admin/campaigns');
      const activeCampaigns = (response.data || []).filter((campaign) => campaign.isActive);
      setCampaigns(activeCampaigns);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setCampaignError(err.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.campaignId) {
      setFormError('Please choose a campaign to assign the store to.');
      return;
    }

    const couponsValue = Number(formData.initialCoupons);
    if (Number.isNaN(couponsValue)) {
      setFormError('Initial coupons must be a valid number.');
      return;
    }
    if (couponsValue < 0) {
      setFormError('Initial coupons cannot be negative.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/admin/users', {
        name: formData.name.trim(),
        storeCode: formData.storeCode.trim().toUpperCase(),
        password: formData.password,
        campaignId: formData.campaignId,
        initialCoupons: couponsValue,
      });

      navigate('/admin/users');
    } catch (err) {
      console.error('Failed to create user:', err);
      setFormError(err.response?.data?.message || 'Failed to create distributor store.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Register New Distributor Store</h1>
            <p className="text-gray-400 mt-2">
              Create a store account and assign it to a campaign with an initial coupon balance.
            </p>
          </div>
          <Link
            to="/admin/users"
            className="text-sm text-blue-300 hover:text-blue-200 transition underline"
          >
            Back to user list
          </Link>
        </div>

        {formError && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Store Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Toko Bahagia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Store Code</label>
            <input
              type="text"
              name="storeCode"
              value={formData.storeCode}
              onChange={handleChange}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 focus:outline-none focus:border-blue-500 uppercase"
              placeholder="e.g. TOKO-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Assign to Campaign</label>
            <div className="flex flex-col gap-3">
              <select
                name="campaignId"
                value={formData.campaignId}
                onChange={handleChange}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 focus:outline-none focus:border-blue-500"
                disabled={isLoadingCampaigns || campaigns.length === 0}
                required
              >
                <option value="">
                  {isLoadingCampaigns ? 'Loading campaigns...' : 'Select a campaign'}
                </option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              {campaignError && (
                <div className="flex items-center justify-between rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-yellow-100">
                  <p className="text-sm">{campaignError}</p>
                  <button
                    type="button"
                    onClick={loadCampaigns}
                    className="text-sm underline hover:text-white ml-4"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!campaignError && !isLoadingCampaigns && campaigns.length === 0 && (
                <p className="text-sm text-yellow-200">
                  There are no active campaigns available right now.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Initial Coupons</label>
            <input
              type="number"
              min="0"
              step="1"
              name="initialCoupons"
              value={formData.initialCoupons}
              onChange={handleChange}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;
