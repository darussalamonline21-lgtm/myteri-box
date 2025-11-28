import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * @desc    Login a distributor user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res) => {

  const storeCodeRaw = req.body?.storeCode;
  const passwordRaw = req.body?.password;

  // Normalize inputs to avoid trivial casing/whitespace mismatches
  const storeCode = typeof storeCodeRaw === 'string' ? storeCodeRaw.trim() : '';
  const password = typeof passwordRaw === 'string' ? passwordRaw.trim() : '';

  if (!storeCode || !password) {
    return res.status(400).json({ message: 'Store code and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        storeCode: {
          equals: storeCode,
          mode: 'insensitive',
        },
      },
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
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
      { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '8h' }
    );

    // Find the most recent campaign assigned to this user
    const latestBalance = await prisma.userCouponBalance.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    const activeCampaignId = latestBalance ? latestBalance.campaignId.toString() : null;

    res.status(200).json({
      message: 'Login successful',
      token: token,
      activeCampaignId: activeCampaignId,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
