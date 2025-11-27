import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, KeyRound, Download } from 'lucide-react';
import apiClient from '../../services/apiClient';
import ImportUsersModal from '../../components/ImportUsersModal';
import { resetUserPassword, exportUserCredentials, toggleUserStatus, deleteUser, getUserById, purgeAllUsers } from '../../services/adminUserApi';

const AdminUserListPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [resetResult, setResetResult] = useState(null); // {storeName, storeCode, password}
  const [isResetting, setIsResetting] = useState(false);
  const [passwordMap, setPasswordMap] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPurging, setIsPurging] = useState(false);


  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiClient.get('/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const renderStatusBadge = (status) => {
    const normalized = status?.toLowerCase();
    const baseClass =
      'px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center justify-center';

    if (normalized === 'active') {
      return (
        <span className={`${baseClass} bg-green-500/20 border-green-400/50 text-green-300`}>
          Active
        </span>
      );
    }

    if (normalized === 'suspended') {
      return (
        <span className={`${baseClass} bg-yellow-500/20 border-yellow-400/50 text-yellow-200`}>
          Suspended
        </span>
      );
    }

    return (
      <span className={`${baseClass} bg-gray-600/20 border-gray-500 text-gray-200`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const renderBalanceBadges = (balances = []) => {
    if (!balances.length) {
      return <p className="text-sm text-gray-500 mt-2">No campaign assignment yet</p>;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {balances.map((balance) => {
          const available = Math.max(0, (balance.totalEarned || 0) - (balance.totalUsed || 0));
          return (
            <span
              key={balance.id}
              className="px-3 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/40 text-blue-100"
            >
              {balance.campaign?.name || `Campaign ${balance.campaignId}`}
              <span className="ml-2 text-gray-300">{available} coupons</span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Distributor Stores</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm text-gray-400 mt-1">
              Manage distributor stores and see their current coupon balances per campaign.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search store name/code..."
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white w-56"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 hover:border-gray-500 transition"
            >
              Refresh
            </button>
            <button
              onClick={async () => {
                setIsExporting(true);
                setError('');
                try {
                  const data = await exportUserCredentials({ format: 'json' });
                  // Update password map for display
                  const map = {};
                  (data.credentials || []).forEach((item) => {
                    map[item.storeCode] = item.password;
                  });
                  setPasswordMap(map);

                  // Create CSV for download
                  const rows = [
                    ['storeName', 'storeCode', 'password', 'campaigns', 'coupons'],
                    ...(data.credentials || []).map(c => [
                      c.storeName,
                      c.storeCode,
                      c.password,
                      c.campaigns,
                      c.coupons,
                    ])
                  ];
                  const csv = rows.map(r => r.map(val => `"${(val ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `store-credentials-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Export credentials failed:', err);
                  setError(err.response?.data?.message || 'Failed to export credentials');
                } finally {
                  setIsExporting(false);
                }
              }}
              className="px-4 py-2 rounded-lg border border-blue-600 bg-blue-600/10 hover:bg-blue-600/20 font-semibold transition text-blue-400 flex items-center gap-2 disabled:opacity-50"
              disabled={isExporting}
              title="Reset all passwords and download storeCode/password list"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Credentials'}
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 rounded-lg border border-blue-600 bg-blue-600/10 hover:bg-blue-600/20 font-semibold transition text-blue-400 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Users
            </button>
            <Link
              to="/admin/users/new"
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold transition"
            >
              + Register New Store
            </Link>
            <button
              onClick={async () => {
                const first = window.confirm('Peringatan: ini akan menghapus SEMUA user beserta saldo kuponnya. Lanjutkan?');
                if (!first) return;
                const second = window.prompt('Ketik DELETE ALL untuk konfirmasi');
                if (second !== 'DELETE ALL') return;
                setIsPurging(true);
                setError('');
                try {
                  await purgeAllUsers();
                  await fetchUsers();
                } catch (err) {
                  console.error('Purge users failed:', err);
                  setError(err.response?.data?.message || 'Failed to delete all users');
                } finally {
                  setIsPurging(false);
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 font-semibold transition disabled:opacity-60"
              disabled={isPurging}
              title="Hapus semua user beserta saldo kupon (superadmin only)"
            >
              {isPurging ? 'Deleting...' : 'Delete All Users'}
            </button>
          </div>
        </header>

        <main className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl p-6">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400">Loading users...</div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-400 font-semibold">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              No stores registered yet. Start by adding a new distributor store.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="py-3 px-4 font-semibold">Store Name</th>
                    <th className="py-3 px-4 font-semibold">Store Code</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created At</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users
                    .filter((u) => {
                      if (!searchTerm.trim()) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        (u.name || '').toLowerCase().includes(term) ||
                        (u.storeCode || '').toLowerCase().includes(term)
                      );
                    })
                    .map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/60">
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-white">{user.name || '-'}</div>
                        <div className="text-xs text-gray-400">Owner: {user.ownerName || '-'}</div>
                        {renderBalanceBadges(user.couponBalances || [])}
                      </td>
                      <td className="py-4 px-4 align-top text-gray-200">
                        <div className="font-mono">{user.storeCode || '-'}</div>
                        {passwordMap[user.storeCode] && (
                          <div className="text-xs text-yellow-300 mt-1">
                            Password: <span className="font-mono font-bold">{passwordMap[user.storeCode]}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top">{renderStatusBadge(user.status)}</td>
                      <td className="py-4 px-4 align-top text-gray-300">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex justify-end gap-2 mb-2">
                          <button
                            onClick={async () => {
                              setIsLoadingDetail(true);
                              setError('');
                              try {
                                const data = await getUserById(user.id);
                                setDetailUser(data);
                              } catch (err) {
                                console.error('Load user detail failed:', err);
                                setError(err.response?.data?.message || 'Failed to load user detail');
                              } finally {
                                setIsLoadingDetail(false);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:border-gray-500 transition"
                            disabled={isLoadingDetail}
                            title="View user details"
                          >
                            Details
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            setIsResetting(true);
                            setResetResult(null);
                            try {
                              const result = await resetUserPassword(user.id);
                              setResetResult({
                                storeName: user.name,
                                storeCode: user.storeCode,
                                password: result.password,
                              });
                            } catch (err) {
                              console.error('Reset password failed:', err);
                              setError(err.response?.data?.message || 'Failed to reset password');
                            } finally {
                              setIsResetting(false);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:border-gray-500 transition disabled:opacity-50"
                          disabled={isResetting}
                          title="Reset password and view the new password once"
                        >
                          <KeyRound className="w-4 h-4" />
                          Reset Password
                        </button>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={async () => {
                              setIsUpdatingStatus(true);
                              setError('');
                              try {
                                const nextStatus = user.status === 'inactive' ? 'active' : 'inactive';
                                await toggleUserStatus(user.id, nextStatus);
                                await fetchUsers();
                              } catch (err) {
                                console.error('Toggle status failed:', err);
                                setError(err.response?.data?.message || 'Failed to update status');
                              } finally {
                                setIsUpdatingStatus(false);
                              }
                            }}
                            className="px-3 py-1 rounded border text-sm"
                            disabled={isUpdatingStatus}
                          >
                            {user.status === 'inactive' ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete ${user.name}?`)) return;
                              setIsUpdatingStatus(true);
                              setError('');
                              try {
                                await deleteUser(user.id);
                                await fetchUsers();
                              } catch (err) {
                                console.error('Delete failed:', err);
                                setError(err.response?.data?.message || 'Failed to delete user');
                              } finally {
                                setIsUpdatingStatus(false);
                              }
                            }}
                            className="px-3 py-1 rounded border border-red-500 text-red-300 text-sm"
                            disabled={isUpdatingStatus}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <ImportUsersModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchUsers}
        />

        {resetResult && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-2">Password Reset</h3>
              <p className="text-sm text-gray-300 mb-4">
                Berikan password ini ke toko. Password hanya tampil sekali di sini.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Store</span>
                  <span className="font-semibold text-white">{resetResult.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Store Code</span>
                  <span className="font-semibold text-white">{resetResult.storeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Password</span>
                  <span className="font-mono font-bold text-green-300">{resetResult.password}</span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setResetResult(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {detailUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <h3 className="text-xl font-bold mb-2">User Detail</h3>
              <p className="text-sm text-gray-400 mb-4">Informasi lengkap distributor.</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span className="font-semibold text-white">{detailUser.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Store Code</span>
                  <span className="font-mono text-white">{detailUser.storeCode || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white">{detailUser.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-white">{detailUser.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-white">{detailUser.status || '-'}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Coupon Balances</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(detailUser.couponBalances || []).map((b) => {
                    const avail = (b.totalEarned || 0) - (b.totalUsed || 0);
                    return (
                      <div key={b.id} className="bg-gray-800 rounded-lg border border-gray-700 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">{b.campaign?.name || `Campaign ${b.campaignId}`}</span>
                          <span className="font-semibold text-white">{avail} coupons</span>
                        </div>
                        <div className="text-xs text-gray-400">Earned: {b.totalEarned} | Used: {b.totalUsed}</div>
                      </div>
                    );
                  })}
                  {(detailUser.couponBalances || []).length === 0 && (
                    <div className="text-xs text-gray-500">No balances.</div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDetailUser(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserListPage;
