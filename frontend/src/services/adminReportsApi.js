import apiClient from './apiClient.js';

// Parse Content-Disposition header safely and strip stray characters that break filenames (e.g., trailing quotes/underscores)
const extractFilename = (contentDisposition) => {
  if (!contentDisposition) return null;

  const parts = contentDisposition.split(';').map((p) => p.trim());

  // Prefer RFC 5987 filename*
  const filenameStar = parts.find((p) => p.toLowerCase().startsWith('filename*='));
  if (filenameStar) {
    const value = filenameStar.split('=').slice(1).join('=');
    const match = value.match(/utf-8''(.+)/i);
    const encoded = match ? match[1] : value;
    try {
      const decoded = decodeURIComponent(encoded);
      return decoded.replace(/^"+|"+$/g, '').replace(/_+$/g, '').trim();
    } catch (_) {
      return encoded.replace(/^"+|"+$/g, '').replace(/_+$/g, '').trim();
    }
  }

  // Fallback to filename=
  const filenamePart = parts.find((p) => p.toLowerCase().startsWith('filename='));
  if (filenamePart) {
    const raw = filenamePart.split('=').slice(1).join('=');
    const cleaned = raw.replace(/^"+|"+$/g, '').replace(/_+$/g, '').trim();
    return cleaned || null;
  }

  return null;
};

/**
 * Export winners/activity logs as CSV
 */
export const exportWinnersReport = async () => {
  try {
    const response = await apiClient.get('/admin/reports/export-winners', {
      responseType: 'blob', // Important for file downloads
    });

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header if available
    const headerFilename = extractFilename(response.headers['content-disposition']);
    const filename = headerFilename || 'winners-report.csv';

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};
