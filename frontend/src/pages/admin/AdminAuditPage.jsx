import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const formatDateTime = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch (_) {
    return value || '-';
  }
};

const summarizeDetails = (log) => {
  if (!log?.details) return '';
  const d = log.details;
  if (log.action === 'BOX_OPEN') {
    return `Box #${log.entityId} → ${d.prizeName || 'Prize'} (${d.prizeTier || '-'})`;
  }
  if (log.action === 'PRIZE_CREATE' || log.action === 'PRIZE_UPDATE') {
    return `${d.name || 'Prize'} | Tier ${d.tier || '-'} | Type ${d.type || '-'}`;
  }
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
};

const AdminAuditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/admin/audit', {
        params: { campaignId: id, limit: 200 },
      });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Campaign #{id}</p>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-gray-400">Aktivitas prize & box terbaru (limit 200)</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={fetchLogs}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => navigate(`/admin/campaigns/${id}`)}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold"
            >
              Back to Campaign
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Recent Activity</h3>
            <span className="text-sm text-gray-400">{logs.length} entries</span>
          </div>
          {isLoading && logs.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-300">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">Belum ada log untuk campaign ini.</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {logs.map((log, idx) => (
                <div key={idx} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="text-sm text-gray-300">
                    <div className="font-semibold text-white">{formatDateTime(log.timestamp)}</div>
                    <div className="text-xs text-gray-400">
                      Actor: {log.actorType} {log.actorId || '-'} | Campaign: {log.campaignId || '-'}
                    </div>
                    <div className="text-sm text-white mt-1">
                      {summarizeDetails(log) || `${log.entityType} #${log.entityId || '-'}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 font-semibold uppercase">
                      {log.action}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-200">
                      {log.entityType} #{log.entityId || '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditPage;

