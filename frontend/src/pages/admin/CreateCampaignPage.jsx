import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/admin/campaigns', {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        minPurchasePerCoupon: 0,
        isActive: formData.isActive,
      });
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Failed to create campaign:', err);
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
            <p className="text-gray-400 mt-1">
              Configure the essential details for your next mystery box campaign.
            </p>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            {'<- Back to Dashboard'}
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-500/20 text-red-200 px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="name">
              Campaign Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Magic Box Bonanza"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Tell your users more about this campaign..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="startDate">
                Start Date *
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="endDate">
                End Date *
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                value={formData.endDate}
                onChange={handleChange}
                className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-green-500 focus:ring-green-500"
            />
            <label htmlFor="isActive" className="ml-3 text-sm font-semibold">
              Campaign is active on creation
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
