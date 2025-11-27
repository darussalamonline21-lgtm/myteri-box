import apiClient from './apiClient.js';

// Get users dengan pagination dan filtering
export const getUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/admin/users${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

// Get user by ID
export const getUserById = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

// Create new user
export const createUser = async (userData) => {
  const response = await apiClient.post('/admin/users', userData);
  return response.data;
};

// Update user
export const updateUser = async (userId, userData) => {
  const response = await apiClient.patch(`/admin/users/${userId}`, userData);
  return response.data;
};

// Delete user (soft delete - update status)
export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

// Purge all users
export const purgeAllUsers = async () => {
  const response = await apiClient.delete('/admin/users/purge');
  return response.data;
};

// Suspend/Activate user
export const toggleUserStatus = async (userId, newStatus) => {
  const response = await apiClient.patch(`/admin/users/${userId}`, {
    status: newStatus
  });
  return response.data;
};

// Import users from CSV
export const importUsers = async (file, campaignId, defaultInitialCoupons) => {
  const formData = new FormData();
  formData.append('file', file);
  if (campaignId) formData.append('campaignId', campaignId);
  if (defaultInitialCoupons !== undefined && defaultInitialCoupons !== '') {
    formData.append('initialCoupons', defaultInitialCoupons);
  }

  const response = await apiClient.post('/admin/users/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Reset password and return new plaintext once
export const resetUserPassword = async (userId) => {
  const response = await apiClient.post(`/admin/users/${userId}/reset-password`);
  return response.data;
};

// Bulk reset and export credentials
export const exportUserCredentials = async (options = {}) => {
  const response = await apiClient.post('/admin/users/export-credentials', options, {
    responseType: options.format === 'csv' ? 'blob' : 'json',
  });
  return response.data;
};
