import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import campaignApi from '../../services/campaignApi';

const CampaignFormPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: false,
    boxCount: 1000
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
      if (formData.boxCount <= 0 || !Number.isInteger(Number(formData.boxCount))) {
        throw new Error('Box count must be a positive integer');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        minPurchasePerCoupon: 0,
        isActive: formData.isActive,
        boxCount: parseInt(formData.boxCount)
      };

      await campaignApi.createCampaign(payload);
      
      // Redirect to campaign list on success
      navigate('/admin/campaigns', { 
        state: { message: 'Campaign created successfully!' }
      });
    } catch (err) {
      console.error('Failed to create campaign:', err);
      if (err.response?.data?.errors) {
        // Handle Zod validation errors
        const errorMessages = err.response.data.errors.map(e => e.message).join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to create campaign');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/campaigns');
  };

  // Get today's date for minimum date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-800 text-white p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <button
          onClick={() => navigate('/admin/campaigns')}
          className="text-blue-400 hover:text-blue-300 mt-2 text-sm"
        >
          ← Back to Campaign List
        </button>
      </header>

      <main>
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-2xl">
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
                  min={today}
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
                  min={formData.startDate || today}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Magic Boxes to Generate *
              </label>
              <input
                type="number"
                name="boxCount"
                value={formData.boxCount}
                onChange={handleChange}
                min="1"
                max="10000"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="1000"
                required
              />
              <p className="text-sm text-gray-400 mt-1">
                This will generate that many mystery boxes automatically for this campaign
              </p>
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
                Activate campaign immediately
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CampaignFormPage;
