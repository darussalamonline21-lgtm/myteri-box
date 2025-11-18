import express from 'express';
import { login } from '../controllers/authController.js';

// Buat instance router dari Express
const router = express.Router();

// Definisikan route untuk POST /login
// Saat permintaan masuk ke URL ini, fungsi `login` akan dieksekusi
router.post('/login', login);

// Ekspor router agar bisa digunakan di app.js
export default router;