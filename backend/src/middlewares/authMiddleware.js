import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

/**
 * @desc    Middleware untuk melindungi rute PENGGUNA (USER).
 *          Memverifikasi JWT user dan melampirkan data user ke request.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Cari di tabel User berdasarkan userId dari payload token
      req.user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.userId) }, // Konversi kembali ke BigInt
        select: {
          id: true,
          name: true,
          storeCode: true,
          status: true,
        },
      });
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error('User token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};


// ==========================================================
// --- FUNGSI BARU DITAMBAHKAN DI SINI ---
// ==========================================================

/**
 * @desc    Middleware untuk melindungi rute ADMIN.
 *          Memverifikasi JWT admin dan melampirkan data admin ke request.
 */
export const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Perbedaan utama: Cari di tabel Admin berdasarkan adminId
      req.admin = await prisma.admin.findUnique({
        where: { id: BigInt(decoded.adminId) }, // Konversi kembali ke BigInt
        select: { id: true, email: true, name: true, role: true },
      });
      
      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }
      next();
    } catch (error) {
      console.error('Admin token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * @desc    Middleware untuk otorisasi berdasarkan peran (role).
 *          Hanya izinkan jika peran admin ada di dalam daftar yang diizinkan.
 *          Harus digunakan SETELAH protectAdmin.
 * @usage   authorize('superadmin', 'manager')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Cek apakah data admin sudah dilampirkan dan rolenya cocok
    if (!req.admin || !roles.includes(req.admin.role)) {
      // 403 Forbidden: Anda terautentikasi, tetapi tidak punya izin.
      return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
    }
    next();
  };
};