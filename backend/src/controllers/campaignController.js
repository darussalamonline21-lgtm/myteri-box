import prisma from '../utils/prisma.js';
import { openBoxForUser } from '../services/boxService.js';
import { getUserAchievements, checkAndUnlockAchievements } from '../services/achievementService.js';
import { deriveRoomsMeta, getRoomUnlockThreshold } from '../utils/roomUtils.js';

// Impor semua class error yang kita butuhkan dari file errors.js
import {
  CampaignInactiveError,
  NoCouponsLeftError,
  NoPrizesAvailableError,
  PrizeSelectionError,
  BoxAlreadyOpenedError,
} from '../utils/errors.js';

// --- FUNGSI 1: GET CAMPAIGN SUMMARY (ENHANCED) ---
// Helper to safely parse IDs to BigInt while returning a readable error
const parseIdToBigInt = (raw, label = 'id') => {
  try {
    if (typeof raw === 'bigint') return raw;
    if (typeof raw === 'number' && Number.isInteger(raw)) return BigInt(raw);
    if (typeof raw === 'string' && raw.trim() !== '') return BigInt(raw);
  } catch (_) {
    /* fall through to error */
  }
  throw new Error(`INVALID_${label.toUpperCase()}`);
};

export const getCampaignSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    let campaignId;
    try {
      campaignId = parseIdToBigInt(req.params.campaignId, 'campaignId');
    } catch {
      return res.status(400).json({ message: 'Invalid Campaign ID format.' });
    }

    // Fetch basic campaign data
    const [
      campaign,
      couponBalance,
      totalBoxesInCampaign,
      availableBoxesGlobal,
      openedBoxesGlobal
    ] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true, name: true, startDate: true, endDate: true, isActive: true },
      }),
      prisma.userCouponBalance.findFirst({
        where: { userId, campaignId },
        select: { totalEarned: true, totalUsed: true },
      }),
      prisma.box.count({
        where: { campaignId }
      }),
      prisma.box.count({
        where: { campaignId, status: 'available' }
      }),
      prisma.box.count({
        where: { campaignId, status: 'opened' }
      })
    ]);

    if (!campaign) {
      return res.status(404).json({ message: `Campaign with id ${campaignId} not found` });
    }

    // Fetch user's box open logs for this campaign
    const userBoxLogs = await prisma.userBoxOpenLog.findMany({
      where: { userId, campaignId },
      select: {
        id: true,
        boxId: true,
        openedAt: true,
        prize: {
          select: { tier: true }
        }
      },
      orderBy: { openedAt: 'desc' }
    });

    const totalBoxesOpened = userBoxLogs.length;
    const totalPrizesWon = userBoxLogs.filter(log => log.prize).length;

    // Calculate completion percentage
    const completionPercentage = totalBoxesInCampaign > 0
      ? parseFloat(((totalBoxesOpened / totalBoxesInCampaign) * 100).toFixed(2))
      : 0;

    // Calculate prize distribution by tier
    const prizesByTier = { S: 0, A: 0, B: 0, C: 0 };
    userBoxLogs.forEach(log => {
      if (log.prize && log.prize.tier) {
        prizesByTier[log.prize.tier] = (prizesByTier[log.prize.tier] || 0) + 1;
      }
    });

    // Calculate win rate
    const winRate = totalBoxesOpened > 0
      ? parseFloat(((totalPrizesWon / totalBoxesOpened) * 100).toFixed(1))
      : 0;

    // Get last opened timestamp
    const lastOpenedAt = userBoxLogs.length > 0 ? userBoxLogs[0].openedAt : null;

    // Calculate streak (consecutive days)
    let streak = 0;
    if (userBoxLogs.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueDays = new Set();
      userBoxLogs.forEach(log => {
        const logDate = new Date(log.openedAt);
        logDate.setHours(0, 0, 0, 0);
        uniqueDays.add(logDate.getTime());
      });

      const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);

      let currentDate = today.getTime();
      for (const day of sortedDays) {
        if (day === currentDate || day === currentDate - 86400000) {
          streak++;
          currentDate = day - 86400000;
        } else {
          break;
        }
      }
    }

// Calculate rooms visited (campaign room size)
    const BOXES_PER_ROOM = campaign.roomSize || 100;
    const roomsVisited = new Set();
    userBoxLogs.forEach(log => {
      // Calculate room number from box ID
      const roomNumber = Math.ceil(Number(log.boxId) / BOXES_PER_ROOM);
      roomsVisited.add(roomNumber);
    });

    const balanceDetails = {
      totalEarned: couponBalance?.totalEarned || 0,
      totalUsed: couponBalance?.totalUsed || 0,
      balance: (couponBalance?.totalEarned || 0) - (couponBalance?.totalUsed || 0),
    };

    // Prepare stats for achievement checking
    const stats = {
      totalPrizesWon,
      totalBoxesOpened,
      totalBoxesInCampaign,
      availableBoxesGlobal,
      openedBoxesGlobal,
      completionPercentage,
      prizesByTier,
      winRate,
      lastOpenedAt,
      streak,
      roomsVisited: roomsVisited.size,
      roomSize: BOXES_PER_ROOM,
    };

    // Check and unlock new achievements
    await checkAndUnlockAchievements(userId, stats);

    // Get achievements
    const achievements = await getUserAchievements(userId);

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, storeCode: true, ownerName: true }
    });

  res.status(200).json({
    user: {
      name: user?.name || 'Unknown Store',
      storeCode: user?.storeCode || '-',
      ownerName: user?.ownerName || ''
    },
    campaign: {
      id: campaign.id.toString(),
      name: campaign.name,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      isActive: campaign.isActive,
      roomSize: campaign.roomSize,
    },
      couponBalance: balanceDetails,
      stats,
      achievements
    });

  } catch (error) {
    console.error('Get campaign summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// --- FUNGSI 2: OPEN BOX CONTROLLER ---
export const openBoxController = async (req, res) => {
  try {
    const userId = req.user.id;
    let boxId;
    try {
      boxId = parseIdToBigInt(req.params.boxId, 'boxId');
    } catch {
      return res.status(400).json({ message: 'Valid boxId is required.' });
    }

    const box = await prisma.box.findUnique({ where: { id: boxId } });
    if (!box) {
      return res.status(404).json({ message: 'Box not found.' });
    }

    // Enforce room unlock on backend side
    const campaign = await prisma.campaign.findUnique({
      where: { id: box.campaignId },
      select: { roomSize: true }
    });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found.' });
    }
    const roomSize = campaign.roomSize || 100;
    const unlockThreshold = getRoomUnlockThreshold();

    const campaignBoxes = await prisma.box.findMany({
      where: { campaignId: box.campaignId },
      select: { id: true, status: true },
      orderBy: { id: 'asc' }
    });
    const roomsMeta = deriveRoomsMeta(campaignBoxes, roomSize, unlockThreshold);
    const targetIndex = campaignBoxes.findIndex(b => b.id === box.id);
    const roomNumber = targetIndex >= 0 ? Math.floor(targetIndex / roomSize) + 1 : null;
    const roomMeta = roomsMeta.find(r => r.roomNumber === roomNumber);

    if (!roomMeta?.isUnlocked) {
      return res.status(403).json({
        message: `Room ${roomNumber} belum terbuka. Buka minimal ${unlockThreshold} box di room sebelumnya untuk melanjutkan.`
      });
    }

    const result = await openBoxForUser(userId, box.campaignId, box.id);

    return res.status(200).json({
      prize: {
        id: result.prize.id.toString(),
        name: result.prize.name,
        tier: result.prize.tier,
        type: result.prize.type,
        imageUrl: result.prize.imageUrl,
      },
      couponBalance: result.updatedBalance
    });

  } catch (error) {
    // Handling error dari service
    if (error instanceof BoxAlreadyOpenedError) {
      return res.status(409).json({ code: error.code, message: error.message });
    }
    if (error instanceof NoCouponsLeftError) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    if (error instanceof CampaignInactiveError) {
      return res.status(403).json({ code: error.code, message: error.message });
    }
    if (error instanceof NoPrizesAvailableError) {
      return res.status(503).json({ code: error.code, message: error.message });
    }
    if (error instanceof PrizeSelectionError) {
      return res.status(409).json({ code: error.code, message: error.message });
    }

    console.error('Open Box Controller Error:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};


// --- FUNGSI 3: GET MY PRIZES ---
export const getMyPrizes = async (req, res) => {
  try {
    const userId = req.user.id;
    const rawCampaignId = req.params.campaignId ?? req.query.campaignId ?? null;

    const whereClause = { userId };
    if (rawCampaignId !== null) {
      try {
        whereClause.campaignId = parseIdToBigInt(rawCampaignId, 'campaignId');
      } catch {
        return res.status(400).json({ message: 'Invalid Campaign ID format.' });
      }
    }

    const userPrizes = await prisma.userPrize.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        status: true,
        campaign: { select: { id: true, name: true, adminWhatsappNumber: true } },
        prize: { select: { name: true, tier: true, type: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPrizes = userPrizes.map((p) => ({
      id: p.id.toString(),
      createdAt: p.createdAt,
      name: p.prize?.name ?? 'Unknown Prize',
      tier: p.prize?.tier ?? '-',
      type: p.prize?.type ?? '-',
      status: p.status,
      imageUrl: p.prize?.imageUrl ?? null,
      campaign: {
        id: p.campaign.id.toString(),
        name: p.campaign.name,
      },
    }));

    const adminWhatsappNumber =
      userPrizes.length > 0 ? userPrizes[0].campaign.adminWhatsappNumber ?? null : null;

    res.status(200).json({
      items: formattedPrizes,
      adminWhatsappNumber,
    });
  } catch (error) {
    console.error('Get my prizes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// --- FUNGSI 4: GET CAMPAIGN BOXES ---
export const getCampaignBoxes = async (req, res) => {
  try {
    let campaignId;
    try {
      campaignId = parseIdToBigInt(req.params.campaignId, 'campaignId');
    } catch {
      return res.status(400).json({ message: 'Invalid Campaign ID format.' });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { roomSize: true }
    });
    if (!campaign) {
      return res.status(404).json({ message: `Campaign with id ${campaignId} not found` });
    }
    const roomSize = campaign.roomSize || 100;
    const unlockThreshold = getRoomUnlockThreshold();

    const boxes = await prisma.box.findMany({
      where: { campaignId: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        openLog: {
          select: {
            userId: true,
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const roomsMeta = deriveRoomsMeta(boxes, roomSize, unlockThreshold);
    const unlockedRoomNumbers = new Set(roomsMeta.filter(r => r.isUnlocked).map(r => r.roomNumber));

    const formattedBoxes = boxes
      .map((box, index) => {
        const roomNumber = Math.floor(index / roomSize) + 1;
        return {
          id: box.id.toString(),
          name: box.name,
          status: box.status,
          roomNumber,
          openedBy: box.openLog ? {
            userId: box.openLog.userId.toString(),
            name: box.openLog.user.name
          } : null
        };
      })
      .filter(box => unlockedRoomNumbers.has(box.roomNumber));

    res.status(200).json({
      boxes: formattedBoxes,
      rooms: roomsMeta
    });

  } catch (error) {
    console.error('Get campaign boxes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
