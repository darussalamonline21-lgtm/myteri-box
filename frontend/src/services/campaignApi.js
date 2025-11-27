import apiClient from './apiClient.js';

const campaignApi = {
  // Get all campaigns
  getAllCampaigns: async () => {
    try {
      const response = await apiClient.get('/admin/campaigns');
      return response.data;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  // Get campaign by ID
  getCampaignById: async (id) => {
    try {
      const response = await apiClient.get(`/admin/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    try {
      const response = await apiClient.post('/admin/campaigns', campaignData);
      return response.data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  // Update campaign
  updateCampaign: async (id, campaignData) => {
    try {
      const response = await apiClient.put(`/admin/campaigns/${id}`, campaignData);
      return response.data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    try {
      const response = await apiClient.delete(`/admin/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  // Get boxes for a campaign (admin)
  getCampaignBoxes: async (id, params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/admin/campaigns/${id}/boxes${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign boxes:', error);
      throw error;
    }
  },

  // Generate boxes for a campaign (admin)
  generateBoxes: async (id, amount) => {
    try {
      const response = await apiClient.post(`/admin/campaigns/${id}/boxes/generate`, { amount });
      return response.data;
    } catch (error) {
      console.error('Error generating boxes:', error);
      throw error;
    }
  },
};

export default campaignApi;
