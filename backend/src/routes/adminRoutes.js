import express from 'express';
import {
  loginAdmin,
  getAllCampaigns,
  getCampaignDetail,
  getCampaignBoxesAdmin,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addPrizeToCampaign,
  generateBoxesForCampaign,
  createUserAndAssignCampaign,
  getUsersWithBalances,
  getUserById,
  updateUser,
  deleteUser,
  deleteAllUsers,
  resetUserPassword,
  exportUserCredentials,
  updatePrize,
  updateBox,
  getAuditLogs,
} from '../controllers/adminController.js';
import { importUsersFromCSV } from '../controllers/importController.js';
import { exportWinnersReport } from '../controllers/reportsController.js';
import { protectAdmin, authorize } from '../middlewares/authMiddleware.js';
import uploadImage from '../middlewares/imageUpload.js';
import uploadCsv from '../middlewares/upload.js';

const router = express.Router();

// Rute publik
router.post('/login', loginAdmin);

// Rute terproteksi untuk admin
// `protectAdmin` dijalankan dulu, lalu `authorize` memeriksa perannya.
router.get('/campaigns', protectAdmin, authorize('superadmin'), getAllCampaigns);
router.get('/campaigns/:id', protectAdmin, authorize('superadmin'), getCampaignDetail);
router.get('/campaigns/:id/boxes', protectAdmin, authorize('superadmin'), getCampaignBoxesAdmin);
router.post('/campaigns', protectAdmin, authorize('superadmin'), createCampaign);
router.post('/campaigns/:id/prizes', protectAdmin, authorize('superadmin'), uploadImage.single('image'), addPrizeToCampaign);
router.post('/campaigns/:id/boxes/generate', protectAdmin, authorize('superadmin'), generateBoxesForCampaign);
router.put('/campaigns/:id', protectAdmin, authorize('superadmin'), updateCampaign);
router.delete('/campaigns/:id', protectAdmin, authorize('superadmin'), deleteCampaign);

// Prize & Box management
router.put('/prizes/:id', protectAdmin, authorize('superadmin'), uploadImage.single('image'), updatePrize);
router.put('/boxes/:id', protectAdmin, authorize('superadmin'), uploadImage.single('image'), updateBox);
router.get('/audit', protectAdmin, authorize('superadmin'), getAuditLogs);

// User management routes
router.get('/users', protectAdmin, authorize('superadmin'), getUsersWithBalances);
router.delete('/users/purge', protectAdmin, authorize('superadmin'), deleteAllUsers);
router.get('/users/:id', protectAdmin, authorize('superadmin'), getUserById);
router.post('/users', protectAdmin, authorize('superadmin'), createUserAndAssignCampaign);
router.patch('/users/:id', protectAdmin, authorize('superadmin'), updateUser);
router.delete('/users/:id', protectAdmin, authorize('superadmin'), deleteUser);
router.post('/users/:id/reset-password', protectAdmin, authorize('superadmin'), resetUserPassword);
router.post('/users/import', protectAdmin, authorize('superadmin'), uploadCsv.single('file'), importUsersFromCSV);
router.post('/users/export-credentials', protectAdmin, authorize('superadmin'), exportUserCredentials);

// Reports routes
router.get('/reports/export-winners', protectAdmin, authorize('superadmin'), exportWinnersReport);

export default router;
