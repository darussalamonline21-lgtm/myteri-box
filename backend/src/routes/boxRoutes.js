import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { openBoxController } from '../controllers/campaignController.js'; // Kita masih bisa pakai controller yang sama

const router = express.Router();

// Rute ini sekarang HANYA bertanggung jawab untuk membuka kotak
router.post('/:boxId/open', protect, openBoxController);

export default router;