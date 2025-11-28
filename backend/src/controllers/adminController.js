import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { Parser as Json2CsvParser } from 'json2csv';
import { logAudit, readAudit } from '../utils/auditLogger.js';

/**
 * @desc    Login an admin user
 * @route   POST /api/v1/admin/login
 * @access  Public
 */
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Buat JWT dengan payload yang berbeda untuk admin
    const tokenPayload = {
      adminId: admin.id.toString(), // Gunakan nama yang berbeda (adminId)
      email: admin.email,
      role: admin.role, // Ambil role dari database
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Beri admin sesi yang lebih lama
    );

    res.status(200).json({
      message: 'Admin login successful',
      token: token,
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const campaignUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
  // Min purchase per coupon dinonaktifkan; tetap izinkan angka non-negatif agar kompatibel
  minPurchasePerCoupon: z.number().nonnegative('Minimum purchase per coupon must be >= 0').optional(),
  isActive: z.boolean().optional(),
});

// Helper function to convert BigInt and Decimal to strings
const formatCampaignResponse = (campaign) => ({
  ...campaign,
  id: campaign.id.toString(),
  minPurchasePerCoupon: campaign.minPurchasePerCoupon.toString(),
  roomSize: 100,
});

const formatPrizeResponse = (prize) => ({
  ...prize,
  id: prize.id.toString(),
  campaignId: prize.campaignId.toString(),
  baseProbability: prize.baseProbability.toString(),
});

const formatBalanceResponse = (balance) => {
  if (!balance) return balance;

  const formatted = {
    ...balance,
    id: balance.id.toString(),
    userId: balance.userId.toString(),
    campaignId: balance.campaignId.toString(),
  };

  if (balance.campaign) {
    formatted.campaign = {
      ...balance.campaign,
      id: balance.campaign.id.toString(),
    };
  }

  return formatted;
};

const formatUserResponse = (user) => {
  if (!user) return user;

  const formatted = {
    ...user,
    id: user.id.toString(),
  };

  if (user.couponBalances) {
    formatted.couponBalances = user.couponBalances.map(formatBalanceResponse);
  }

  return formatted;
};

const userBaseSelect = {
  id: true,
  name: true,
  ownerName: true,
  storeCode: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const userWithBalancesSelect = {
  ...userBaseSelect,
  couponBalances: {
    select: {
      id: true,
      userId: true,
      campaignId: true,
      totalEarned: true,
      totalUsed: true,
      updatedAt: true,
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

const campaignIdSchema = z.preprocess((value) => {
  if (typeof value === 'bigint') return value;
  if ((typeof value === 'string' && value.trim() !== '') || typeof value === 'number') {
    try {
      return BigInt(value);
    } catch {
      return value;
    }
  }
  return value;
}, z.bigint({
  required_error: 'campaignId is required',
  invalid_type_error: 'campaignId must be a valid id',
}));

const initialCouponsSchema = z.preprocess((value) => {
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return value;
}, z.number({
  required_error: 'initialCoupons is required',
  invalid_type_error: 'initialCoupons must be a number',
}).int('initialCoupons must be an integer').min(0, 'initialCoupons cannot be negative'));

// Helper function to generate boxes for a campaign
const bulkCreateBoxesForCampaign = async (campaignId, boxCount, startIndex = 1) => {
  const campaignIdBigInt = typeof campaignId === 'bigint' ? campaignId : BigInt(campaignId);
  const boxes = [];
  for (let i = 0; i < boxCount; i++) {
    boxes.push({
      campaignId: campaignIdBigInt,
      name: `Mystery Box #${startIndex + i}`,
      status: 'available',
    });
  }

  // Insert boxes in batches to avoid potential issues with large numbers
  const batchSize = 100;
  for (let i = 0; i < boxes.length; i += batchSize) {
    const batch = boxes.slice(i, i + batchSize);
    await prisma.box.createMany({
      data: batch,
    });
  }
};

/**
 * @desc    Get all campaigns (for admin panel)
 * @route   GET /api/v1/admin/campaigns
 * @access  Private (Superadmin)
 */
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc', // Tampilkan yang terbaru dulu
      },
      include: {
        _count: {
          select: {
            boxes: true,
            prizes: true,
          }
        }
      }
    });

    // Konversi semua nilai BigInt dan Decimal ke string sebelum dikirim
    const formattedCampaigns = campaigns.map((c) => ({
      ...formatCampaignResponse(c),
      roomSize: c.roomSize,
      totalBoxes: c._count?.boxes || 0,
      totalPrizes: c._count?.prizes || 0,
    }));

    res.status(200).json(formattedCampaigns);
  } catch (error) {
    console.error("Get all campaigns error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Get detailed campaign info (prizes + box count)
 * @route   GET /api/v1/admin/campaigns/:id
 * @access  Private (Superadmin)
 */
export const getCampaignDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: BigInt(id) },
      include: {
        prizes: true,
        _count: {
          select: {
            boxes: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const couponAgg = await prisma.userCouponBalance.aggregate({
      _sum: { totalEarned: true, totalUsed: true },
      where: { campaignId: BigInt(id) },
    });
    const totalCouponsEarned = couponAgg._sum.totalEarned || 0;
    const totalCouponsUsed = couponAgg._sum.totalUsed || 0;
    const totalCouponsBalance = totalCouponsEarned - totalCouponsUsed;

    const { prizes, _count, ...campaignData } = campaign;
    const formattedCampaign = formatCampaignResponse(campaignData);

    res.status(200).json({
      ...formattedCampaign,
      prizes: prizes.map(formatPrizeResponse),
      totalBoxes: _count.boxes,
      roomSize: campaign.roomSize,
      totalCouponsEarned,
      totalCouponsUsed,
      totalCouponsBalance,
    });
  } catch (error) {
    console.error("Get campaign detail error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Add a prize to a campaign
 * @route   POST /api/v1/admin/campaigns/:id/prizes
 * @access  Private (Superadmin)
 */
export const addPrizeToCampaign = async (req, res) => {
  const { id } = req.params;
  const { name, tier, type, stockTotal, baseProbability, description } = req.body;

  // Handle file upload
  const imageUrl = req.file ? `/uploads/prizes/${req.file.filename}` : req.body.imageUrl;

  if (!name || !tier || !type || stockTotal === undefined || baseProbability === undefined) {
    return res.status(400).json({
      message: 'Name, tier, type, stockTotal, and baseProbability are required',
    });
  }

  const parsedStock = Number(stockTotal);
  const parsedProbability = Number(baseProbability);
  if (!Number.isFinite(parsedStock) || parsedStock <= 0) {
    return res.status(400).json({ message: 'stockTotal must be a positive number' });
  }
  if (!Number.isFinite(parsedProbability) || parsedProbability <= 0) {
    return res.status(400).json({ message: 'baseProbability must be a positive number' });
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const prize = await prisma.prize.create({
      data: {
        campaignId: campaign.id,
        name: name.trim(),
        description: description?.trim() || null,
        tier: tier.trim(),
        type: type.trim(),
        stockTotal: parsedStock,
        stockRemaining: parsedStock,
        baseProbability: parsedProbability.toString(),
        imageUrl: imageUrl || null,
        isActive: true,
      },
    });

    await logAudit({
      actorType: 'admin',
      actorId: req.admin?.id?.toString() || null,
      action: 'PRIZE_CREATE',
      entityType: 'prize',
      entityId: prize.id.toString(),
      campaignId: campaign.id.toString(),
      details: {
        name: prize.name,
        tier: prize.tier,
        type: prize.type,
        stockTotal: prize.stockTotal,
        baseProbability: prize.baseProbability,
      },
    });

    res.status(201).json(formatPrizeResponse(prize));
  } catch (error) {
    console.error('Add prize error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Update a prize
 * @route   PUT /api/v1/admin/prizes/:id
 * @access  Private (Superadmin)
 */
export const updatePrize = async (req, res) => {
  const { id } = req.params;
  const { name, tier, type, stockTotal, baseProbability, isActive, description } = req.body;

  // Handle file upload or existing imageUrl
  const uploadedImageUrl = req.file ? `/uploads/prizes/${req.file.filename}` : undefined;
  const bodyImageUrl = req.body?.imageUrl;

  try {
    const existing = await prisma.prize.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, campaignId: true, stockTotal: true, stockRemaining: true },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Prize not found' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (tier) updateData.tier = tier.trim();
    if (type) updateData.type = type.trim();

    // Reconcile stockTotal and stockRemaining when stockTotal changes
    if (stockTotal !== undefined) {
      const parsedStock = Number(stockTotal);
      if (Number.isFinite(parsedStock) && parsedStock > 0) {
        const delta = parsedStock - existing.stockTotal;
        updateData.stockTotal = parsedStock;
        updateData.stockRemaining = Math.max(
          0,
          Math.min(parsedStock, (existing.stockRemaining || 0) + delta)
        );
      }
    }

    if (baseProbability !== undefined) {
      const parsedProb = Number(baseProbability);
      if (Number.isFinite(parsedProb) && parsedProb > 0) {
        updateData.baseProbability = parsedProb.toString();
      }
    }
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (uploadedImageUrl) {
      updateData.imageUrl = uploadedImageUrl;
    } else if (bodyImageUrl) {
      updateData.imageUrl = bodyImageUrl.trim();
    }

    const prize = await prisma.prize.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    await logAudit({
      actorType: 'admin',
      actorId: req.admin?.id?.toString() || null,
      action: 'PRIZE_UPDATE',
      entityType: 'prize',
      entityId: prize.id.toString(),
      campaignId: existing.campaignId.toString(),
      details: updateData,
    });

    res.status(200).json(formatPrizeResponse(prize));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Prize not found' });
    }
    console.error('Update prize error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Update a box (e.g. set skin image)
 * @route   PUT /api/v1/admin/boxes/:id
 * @access  Private (Superadmin)
 */
export const updateBox = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  // Handle file upload
  const imageUrl = req.file ? `/uploads/boxes/${req.file.filename}` : undefined;

  try {
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (status) updateData.status = status;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const box = await prisma.box.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    res.status(200).json({
      ...box,
      id: box.id.toString(),
      campaignId: box.campaignId.toString(),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Box not found' });
    }
    console.error('Update box error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get audit logs (optional filter by campaignId)
 * @route   GET /api/v1/admin/audit
 * @access  Private (Superadmin)
 */
export const getAuditLogs = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const campaignId = req.query.campaignId || null;
  try {
    const logs = await readAudit({ limit, campaignId });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Generate boxes for a campaign
 * @route   POST /api/v1/admin/campaigns/:id/boxes/generate
 * @access  Private (Superadmin)
 */
export const generateBoxesForCampaign = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const parsedAmount = Number(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'amount must be a positive integer' });
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const existingBoxCount = await prisma.box.count({
      where: { campaignId: campaign.id },
    });

    await bulkCreateBoxesForCampaign(campaign.id.toString(), parsedAmount, existingBoxCount + 1);

    // Setelah membuat box, lakukan pre-assign hadiah yang stoknya masih ada
    await assignPrizesToEmptyBoxes(campaign.id.toString());

    res.status(201).json({
      message: 'Boxes generated successfully',
      totalBoxes: existingBoxCount + parsedAmount,
    });
  } catch (error) {
    console.error('Generate boxes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Re-assign prizes to available boxes (pre-assign)
 * @route   POST /api/v1/admin/campaigns/:id/boxes/reassign
 * @access  Private (Superadmin)
 */
export const reassignPrizesForCampaign = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Kosongkan prizeId pada box yang masih available
    const cleared = await prisma.box.updateMany({
      where: { campaignId: campaign.id, status: 'available' },
      data: { prizeId: null },
    });

    // Assign ulang berdasarkan stok remaining hadiah aktif
    await assignPrizesToEmptyBoxes(campaign.id.toString());

    // Hitung berapa box available yang kini terisi prizeId
    const assignedCount = await prisma.box.count({
      where: { campaignId: campaign.id, status: 'available', prizeId: { not: null } },
    });

    res.status(200).json({
      message: 'Prizes reassigned to available boxes',
      cleared: cleared.count,
      assigned: assignedCount,
    });
  } catch (error) {
    console.error('Reassign prizes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Create a new campaign
 * @route   POST /api/v1/admin/campaigns
 * @access  Private (Superadmin)
 */
export const createCampaign = async (req, res) => {
  const { name, description, startDate, endDate, minPurchasePerCoupon, isActive } = req.body;

  if (!name || !startDate || !endDate) {
    return res.status(400).json({ message: 'Name, startDate, and endDate are required.' });
  }

  const parsedMinPurchase = Number.isFinite(Number(minPurchasePerCoupon))
    ? Number(minPurchasePerCoupon)
    : 0;

  try {
    const newCampaign = await prisma.campaign.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minPurchasePerCoupon: parsedMinPurchase,
        roomSize: 100, // default room size
        isActive: isActive || false,
      }
    });

    // --- PERBAIKAN: Pastikan BigInt dikonversi ke String ---
    const responseCampaign = {
      ...newCampaign,
      id: newCampaign.id.toString(), // <-- INI PENTING
      minPurchasePerCoupon: newCampaign.minPurchasePerCoupon.toString(),
      // Konversi tanggal ke string ISO juga praktik yang baik
      startDate: newCampaign.startDate.toISOString(),
      endDate: newCampaign.endDate.toISOString(),
      createdAt: newCampaign.createdAt.toISOString(),
      updatedAt: newCampaign.updatedAt.toISOString(),
    };
    // -------------------------------------------------------

    res.status(201).json(responseCampaign);

  } catch (error) {
    console.error("Create campaign error:", error); // <-- LIHAT TERMINAL UNTUK DETAIL
    res.status(500).json({ message: "Internal server error: " + error.message }); // Kirim pesan error ke frontend untuk debugging
  }
};

/**
 * @desc    Update an existing campaign
 * @route   PUT /api/v1/admin/campaigns/:id
 * @access  Private (Superadmin)
 */
export const updateCampaign = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate request body
    const validatedData = campaignUpdateSchema.parse(req.body);

    // Prepare update data
    const updateData = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.minPurchasePerCoupon !== undefined) updateData.minPurchasePerCoupon = validatedData.minPurchasePerCoupon;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    // Update the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        boxes: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        prizes: {
          select: {
            id: true,
            name: true,
            tier: true,
            type: true,
            stockTotal: true,
            stockRemaining: true,
            isActive: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            boxes: true,
            prizes: true,
          },
        },
      },
    });

    // Format the response
    const formattedCampaign = {
      ...formatCampaignResponse(updatedCampaign),
      boxes: updatedCampaign.boxes.map(box => ({
        ...box,
        id: box.id.toString(),
      })),
      prizes: updatedCampaign.prizes.map(prize => ({
        ...prize,
        id: prize.id.toString(),
      })),
    };

    res.status(200).json({
      message: 'Campaign updated successfully',
      campaign: formattedCampaign,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    console.error("Update campaign error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Delete a campaign
 * @route   DELETE /api/v1/admin/campaigns/:id
 * @access  Private (Superadmin)
 */
export const deleteCampaign = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: {
            boxes: true,
            prizes: true,
            userCouponBalances: true,
            transactions: true,
            boxOpenLogs: true,
            userPrizes: true,
          },
        },
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Hard-delete all related records, then delete campaign
    await prisma.$transaction(async (tx) => {
      await tx.userPrize.deleteMany({ where: { campaignId: BigInt(id) } });
      await tx.userBoxOpenLog.deleteMany({ where: { campaignId: BigInt(id) } });
      await tx.userCouponBalance.deleteMany({ where: { campaignId: BigInt(id) } });
      await tx.transaction.deleteMany({ where: { campaignId: BigInt(id) } });
      await tx.prize.deleteMany({ where: { campaignId: BigInt(id) } });
      await tx.box.deleteMany({ where: { campaignId: BigInt(id) } });
      await tx.campaign.delete({ where: { id: BigInt(id) } });
    });

    res.status(200).json({ message: 'Campaign deleted successfully' });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    console.error("Delete campaign error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createUserAndAssignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  storeCode: z.string().min(1, 'storeCode is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  campaignId: campaignIdSchema,
  initialCoupons: initialCouponsSchema,
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  ownerName: z.string().min(1, 'Owner name is required').optional(),
  storeCode: z.string().min(1, 'storeCode is required').optional(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional(),
  status: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  campaignId: campaignIdSchema.optional(),
  initialCoupons: initialCouponsSchema.optional(),
});

// helper generate password: huruf kecil + angka agar mudah diketik
const generatePassword = (length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
};

// helper password yang lebih mudah: slug dari nama/store + 4 digit
const slugify = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const generateReadablePassword = (base, digits = 4) => {
  const cleaned = slugify(base) || 'user';
  const prefix = cleaned.slice(0, 8) || 'user';
  const min = 10 ** (digits - 1);
  const max = 10 ** digits;
  const rand = crypto.randomInt(min, max).toString().padStart(digits, '0');
  return `${prefix}${rand}`;
};

const BOXES_PER_ROOM = 100;

// Shuffle array in-place with crypto-based randomness
const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Assign prizes to boxes (pre-assign) based on available stock
const assignPrizesToEmptyBoxes = async (campaignId) => {
  // Fetch prizes with remaining stock
  const prizes = await prisma.prize.findMany({
    where: { campaignId: BigInt(campaignId), isActive: true, stockRemaining: { gt: 0 } },
    select: { id: true, stockRemaining: true },
  });
  if (!prizes.length) return;

  // Build prize pool
  const prizePool = [];
  prizes.forEach((p) => {
    const count = Math.max(0, p.stockRemaining || 0);
    for (let i = 0; i < count; i++) {
      prizePool.push(p.id);
    }
  });
  if (!prizePool.length) return;

  // Fetch empty boxes
  const emptyBoxes = await prisma.box.findMany({
    where: { campaignId: BigInt(campaignId), prizeId: null },
    select: { id: true },
  });
  if (!emptyBoxes.length) return;

  // Shuffle prizes and cap to number of boxes
  shuffleArray(prizePool);
  const assignCount = Math.min(prizePool.length, emptyBoxes.length);

  // Assign sequentially
  const updates = [];
  for (let i = 0; i < assignCount; i++) {
    updates.push(
      prisma.box.update({
        where: { id: emptyBoxes[i].id },
        data: { prizeId: prizePool[i] },
      })
    );
  }

  if (updates.length) {
    await prisma.$transaction(updates, { timeout: 60000 });
  }
};

/**
 * @desc    Create a user and immediately assign coupon balance for a campaign
 * @route   POST /api/v1/admin/users
 * @access  Private (Superadmin)
 */
export const createUserAndAssignCampaign = async (req, res) => {
  try {
    const { name, ownerName, storeCode, password, campaignId, initialCoupons, phone } =
      createUserAndAssignSchema.parse(req.body);

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, name: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { newUser, balance } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: name.trim(),
          ownerName: ownerName.trim(),
          storeCode: storeCode.trim(),
          phone: phone?.trim() || 'N/A',
          status: 'active',
          passwordHash,
        },
        select: userBaseSelect,
      });

      const createdBalance = await tx.userCouponBalance.create({
        data: {
          userId: createdUser.id,
          campaignId,
          totalEarned: initialCoupons,
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { newUser: createdUser, balance: createdBalance };
    });

    const formattedBalance = formatBalanceResponse(balance);
    const formattedUser = formatUserResponse({
      ...newUser,
      couponBalances: [balance],
    });

    res.status(201).json({
      message: 'User created and assigned to campaign successfully',
      user: formattedUser,
      balance: formattedBalance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }

    if (error.code === 'P2002' && error.meta?.target?.includes('storeCode')) {
      return res.status(409).json({ message: 'Store code already exists' });
    }

    console.error('Create user and assign campaign error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get single user with balances
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (Superadmin)
 */
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(req.params.id) },
      select: userWithBalancesSelect,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    List all users with their coupon balances
 * @route   GET /api/v1/admin/users
 * @access  Private (Superadmin)
 */
export const getUsersWithBalances = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: userWithBalancesSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedUsers = users.map(formatUserResponse);

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Update user data and optionally reset coupon balance for a campaign
 * @route   PATCH /api/v1/admin/users/:id
 * @access  Private (Superadmin)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateUserSchema.parse(req.body);

    const updateData = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.ownerName !== undefined) updateData.ownerName = validated.ownerName;
    if (validated.storeCode !== undefined) updateData.storeCode = validated.storeCode;
    if (validated.email !== undefined) updateData.email = validated.email;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(validated.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(id) },
      data: updateData,
      select: userBaseSelect,
    });

    // Optionally upsert coupon balance for a campaign
    if (validated.campaignId !== undefined) {
      const couponData = {};
      if (validated.initialCoupons !== undefined) {
        couponData.totalEarned = validated.initialCoupons;
        couponData.totalUsed = 0;
      }

      await prisma.userCouponBalance.upsert({
        where: {
          userId_campaignId: {
            userId: updatedUser.id,
            campaignId: validated.campaignId,
          }
        },
        update: couponData,
        create: {
          userId: updatedUser.id,
          campaignId: validated.campaignId,
          totalEarned: validated.initialCoupons ?? 0,
        },
      });
    }

    // Fetch with balances for response
    const userWithBalances = await prisma.user.findUnique({
      where: { id: updatedUser.id },
      select: userWithBalancesSelect,
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: formatUserResponse(userWithBalances),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('storeCode')) {
      return res.status(409).json({ message: 'Store code already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Soft delete user (mark inactive)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Superadmin)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    let userId;
    try {
      userId = BigInt(id);
    } catch (_) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    // Hard delete: hapus seluruh relasi sebelum user dihapus
    await prisma.$transaction(async (tx) => {
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.userPrize.deleteMany({ where: { userId } });
      await tx.userBoxOpenLog.deleteMany({ where: { userId } });
      await tx.userCouponBalance.deleteMany({ where: { userId } });
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    res.status(200).json({
      message: 'User deleted successfully',
      userId: id,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Reset user password and return new plaintext once
 * @route   POST /api/v1/admin/users/:id/reset-password
 * @access  Private (Superadmin)
 */
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const userRecord = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: { name: true, ownerName: true, storeCode: true }
    });
    if (!userRecord) {
      return res.status(404).json({ message: 'User not found' });
    }
    const baseForPwd = userRecord.storeCode || userRecord.name || userRecord.ownerName || 'user';
    const newPassword = generateReadablePassword(baseForPwd, 4);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { passwordHash },
      select: userBaseSelect,
    });

    res.status(200).json({
      message: 'Password reset successfully. Please share this password securely.',
      user: formatUserResponse(user),
      password: newPassword, // only returned once
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Delete ALL users and related records (use with extreme caution)
 * @route   DELETE /api/v1/admin/users/purge
 * @access  Private (Superadmin)
 */
export const deleteAllUsers = async (_req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.userAchievement.deleteMany({});
      await tx.userPrize.deleteMany({});
      await tx.userBoxOpenLog.deleteMany({});
      await tx.userCouponBalance.deleteMany({});
      await tx.transaction.deleteMany({});
      await tx.user.deleteMany({});
    });
    res.status(200).json({ message: 'All users and related data deleted' });
  } catch (error) {
    console.error('Delete all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Bulk reset user passwords and return credentials (JSON or CSV)
 * @route   POST /api/v1/admin/users/export-credentials
 * @access  Private (Superadmin)
 */
export const exportUserCredentials = async (req, res) => {
  try {
    const { campaignId, format } = req.body || {};

    const where = {};
    if (campaignId) {
      where.couponBalances = {
        some: { campaignId: BigInt(campaignId) }
      };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        couponBalances: {
          include: {
            campaign: { select: { id: true, name: true } }
          }
        }
      }
    });

    const credentials = [];
    for (const user of users) {
      const baseForPwd = user.storeCode || user.name || user.ownerName || 'user';
      const newPassword = generateReadablePassword(baseForPwd, 4);
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      const balances = user.couponBalances || [];
      const targetBalances = campaignId
        ? balances.filter(b => b.campaignId.toString() === campaignId.toString())
        : balances;

      const totalCoupons = targetBalances.reduce((sum, b) => sum + (b.totalEarned || 0), 0);
      const campaigns = targetBalances.map(b => b.campaign?.name || b.campaignId.toString()).join('; ');

      credentials.push({
        storeName: user.name || '',
        storeCode: user.storeCode || '',
        password: newPassword,
        campaigns,
        coupons: totalCoupons
      });
    }

    if (format === 'csv') {
      const parser = new Json2CsvParser({ fields: ['storeName', 'storeCode', 'password', 'campaigns', 'coupons'] });
      const csv = parser.parse(credentials);
      const filename = `user-credentials-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      message: 'Passwords reset and credentials generated',
      count: credentials.length,
      credentials,
    });
  } catch (error) {
    console.error('Export credentials error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    List boxes for a campaign (admin) with paging/room filter
 * @route   GET /api/v1/admin/campaigns/:id/boxes
 * @access  Private (Superadmin)
 */
export const getCampaignBoxesAdmin = async (req, res) => {
  try {
    const campaignId = BigInt(req.params.id);
    let { skip, take, room } = req.query;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, roomSize: true },
    });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const roomSize = campaign.roomSize || 20;

    const total = await prisma.box.count({ where: { campaignId } });

    let pageSize = Number(take) || roomSize;
    if (Number.isNaN(pageSize) || pageSize <= 0) pageSize = roomSize;

    let page = Number(skip) && !room ? Math.floor(Number(skip) / pageSize) + 1 : 1;

    let computedSkip = Number(skip) || 0;
    if (room) {
      const roomNumber = Number(room);
      if (Number.isNaN(roomNumber) || roomNumber <= 0) {
        return res.status(400).json({ message: 'Invalid room number' });
      }
      page = roomNumber;
      computedSkip = (roomNumber - 1) * roomSize;
      pageSize = roomSize;
    }

    const boxes = await prisma.box.findMany({
      where: { campaignId },
      include: {
        openLog: {
          include: {
            user: { select: { id: true, name: true, storeCode: true } }
          }
        }
      },
      orderBy: { id: 'asc' },
      skip: computedSkip,
      take: pageSize,
    });

    const formatted = boxes.map((b) => ({
      id: b.id.toString(),
      name: b.name,
      status: b.status,
      roomNumber: Math.ceil(Number(b.id) / roomSize),
      openedBy: b.openLog ? {
        userId: b.openLog.userId.toString(),
        name: b.openLog.user?.name || '-',
        storeCode: b.openLog.user?.storeCode || '-',
      } : null,
    }));

    return res.status(200).json({
      items: formatted,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        roomSize,
      },
    });
  } catch (error) {
    console.error('Get campaign boxes admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
