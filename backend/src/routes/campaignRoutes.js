import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
    getCampaignSummary, 
    openBoxController, 
    getMyPrizes,
    getCampaignBoxes
} from '../controllers/campaignController.js';

const router = express.Router();

// Rute untuk mengambil data
router.get('/:campaignId/summary', protect, getCampaignSummary);
router.get('/:campaignId/boxes', protect, getCampaignBoxes);
router.get('/:campaignId/my-prizes', protect, getMyPrizes);

// --- PASTIKAN BARIS INI ADA DAN SUDAH BENAR ---
// Ini adalah rute untuk AKSI membuka kotak
// Metodenya POST, dan path-nya '/boxes/:boxId/open'

export default router;