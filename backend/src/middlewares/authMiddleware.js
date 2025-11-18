import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

/**
 * @desc    Middleware untuk melindungi route. Memverifikasi JWT dan melampirkan data user ke request.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Cek header Authorization, cari token 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Ekstrak token dari header (hapus "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verifikasi token menggunakan secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Ambil data user dari database berdasarkan id di dalam token
      // Kita tidak menyertakan passwordHash dalam data yang dilampirkan
      req.user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          storeCode: true,
          status: true,
        },
      });
      
      // Jika user tidak ditemukan di DB (misalnya sudah dihapus), tolak akses
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // 5. Lanjutkan ke fungsi (controller) selanjutnya
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // Jika tidak ada token sama sekali
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};