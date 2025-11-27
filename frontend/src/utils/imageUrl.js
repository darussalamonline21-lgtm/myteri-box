// Resolve image URLs coming from backend.
// If path is relative (e.g. "/uploads/prizes/abc.jpg") pick an accessible host:
// 1) VITE_ASSET_BASE_URL (full host)
// 2) VITE_API_BASE_URL with /api stripped
// 3) window.location host with port 5000 (fallback for LAN/mobile preview)
export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const apiBaseEnv = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const assetBaseEnv = (import.meta.env.VITE_ASSET_BASE_URL || '').trim();

  let baseHost = '';
  if (assetBaseEnv) {
    baseHost = assetBaseEnv.replace(/\/$/, '');
  } else if (apiBaseEnv) {
    baseHost = apiBaseEnv.replace(/\/api(?:\/v1)?\/?$/i, '');
  } else if (typeof window !== 'undefined' && window.location?.hostname) {
    baseHost = `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  // If baseHost is localhost/127.*, but client hostname differs (e.g., mobile on LAN), swap to current hostname with port preserved.
  if (baseHost && typeof window !== 'undefined' && window.location?.hostname) {
    try {
      const u = new URL(baseHost);
      const isLocal = ['localhost', '127.0.0.1'].includes(u.hostname);
      if (isLocal && u.hostname !== window.location.hostname) {
        const port = u.port || '5000';
        u.hostname = window.location.hostname;
        u.port = port;
        baseHost = u.toString().replace(/\/$/, '');
      }
    } catch (_) {
      // ignore parse errors, fallback to original baseHost
    }
  }

  if (!baseHost) return url;

  const needsSlash = url.startsWith('/') ? '' : '/';
  return `${baseHost}${needsSlash}${url}`;
};
