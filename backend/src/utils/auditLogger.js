import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

const ensureLogFile = () => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '');
  }
};

export const logAudit = async (entry) => {
  try {
    ensureLogFile();
    const payload = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(payload)}\n`, { encoding: 'utf-8' });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

export const readAudit = async ({ limit = 100, campaignId } = {}) => {
  try {
    ensureLogFile();
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const parsed = [];
    for (let i = lines.length - 1; i >= 0 && parsed.length < limit; i -= 1) {
      try {
        const item = JSON.parse(lines[i]);
        if (campaignId && item.campaignId && item.campaignId.toString() !== campaignId.toString()) {
          continue;
        }
        parsed.push(item);
      } catch (err) {
        // skip malformed line
      }
    }
    return parsed;
  } catch (err) {
    console.error('Failed to read audit log:', err);
    return [];
  }
};

