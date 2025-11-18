import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * @desc    Login a distributor user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { storeCode, password } = req.body;

  if (!storeCode || !password) {
    return res.status(400).json({ message: 'Store code and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { storeCode },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokenPayload = {
      userId: user.id.toString(),
      storeCode: user.storeCode,
      role: 'user',
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token: token,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};