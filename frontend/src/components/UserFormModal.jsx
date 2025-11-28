import React, { useState, useEffect } from 'react';
import { createUser, updateUser, getUserById } from '../services/adminUserApi';

const UserFormModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    storeCode: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
    status: 'active'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (user) {
      setIsEdit(true);
      // Load user data jika dalam mode edit
      loadUserData();
    } else {
      setIsEdit(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userData = await getUserById(user.id);
      setFormData({
        name: userData.name || '',
        ownerName: userData.ownerName || '',
        storeCode: userData.storeCode || '',
        email: userData.email || '',
        phone: userData.phone || '',
        password: '', // Don't prefill password for security
        role: userData.role || 'USER',
        status: userData.status || 'active'
      });
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validasi input
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.ownerName.trim()) {
        throw new Error('Owner name is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone is required');
      }
      if (!isEdit && !formData.password.trim()) {
        throw new Error('Password is required for new users');
      }

      const payload = {
        name: formData.name.trim(),
        ownerName: formData.ownerName.trim(),
        storeCode: formData.storeCode.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        role: formData.role,
        status: formData.status
      };

      // Hanya tambahkan password jika ada dan tidak kosong
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (isEdit) {
        await updateUser(user.id, payload);
      } else {
        await createUser(payload);
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-white">Loading user data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
          Name *
        </label>
        <input
          type="text"
          name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Owner Name *
        </label>
        <input
          type="text"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Store Code
            </label>
            <input
              type="text"
              name="storeCode"
              value={formData.storeCode}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password {!isEdit && '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder={isEdit ? "Leave blank to keep current password" : ""}
              required={!isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="USER">USER</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
