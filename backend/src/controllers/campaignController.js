import prisma from '../utils/prisma.js';
import { openBoxForUser } from '../services/boxService.js';

// Impor semua class error yang kita butuhkan dari file errors.js
import { 
    CampaignInactiveError, 
    NoCouponsLeftError, 
    NoPrizesAvailableError, 
    PrizeSelectionError,
    BoxAlreadyOpenedError,
} from '../utils/errors.js';

// --- FUNGSI 1: GET CAMPAIGN SUMMARY ---
export const getCampaignSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const campaignId = parseInt(req.params.campaignId, 10);

    if (isNaN(campaignId)) {
      return res.status(400).json({ message: 'Invalid Campaign ID format.' });
    }

    const [campaign, couponBalance, prizesWonCount] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true, name: true, startDate: true, endDate: true, isActive: true },
      }),
      prisma.userCouponBalance.findFirst({
        where: { userId, campaignId },
        select: { totalEarned: true, totalUsed: true },
      }),
      prisma.userPrize.count({
        where: { userId, campaignId },
      }),
    ]);
    
    if (!campaign) {
      return res.status(404).json({ message: `Campaign with id ${campaignId} not found` });
    }

    const balanceDetails = {
      totalEarned: couponBalance?.totalEarned || 0,
      totalUsed: couponBalance?.totalUsed || 0,
      balance: (couponBalance?.totalEarned || 0) - (couponBalance?.totalUsed || 0),
    };

    res.status(200).json({
      campaign: {
        id: campaign.id.toString(),
        name: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        isActive: campaign.isActive,
      },
      couponBalance: balanceDetails,
      stats: {
        totalPrizesWon: prizesWonCount,
      },
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
    const boxId = parseInt(req.params.boxId, 10);

    if (isNaN(boxId)) {
      return res.status(400).json({ message: 'Valid boxId is required.' });
    }
    
    const box = await prisma.box.findUnique({ where: { id: boxId } });
    if (!box) {
        return res.status(404).json({ message: 'Box not found.' });
    }

    const result = await openBoxForUser(userId, box.campaignId, box.id);
    
    return res.status(200).json({
      prize: {
        id: result.prize.id.toString(),
        name: result.prize.name,
        tier: result.prize.tier,
        type: result.prize.type,
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
    const campaignId = parseInt(req.params.campaignId, 10);
    if (isNaN(campaignId)) {
        return res.status(400).json({ message: 'Invalid Campaign ID format.' });
    }

    const userPrizes = await prisma.userPrize.findMany({
      where: { userId, campaignId },
      select: {
        id: true,
        createdAt: true,
        status: true,
        prize: { select: { name: true, tier: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPrizes = userPrizes.map(p => ({
      id: p.id.toString(),
      createdAt: p.createdAt,
      name: p.prize.name,
      tier: p.prize.tier,
      type: p.prize.type,
      status: p.status,
    }));

    res.status(200).json(formattedPrizes);
  } catch (error) {
    console.error('Get my prizes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// --- FUNGSI 4: GET CAMPAIGN BOXES ---
export const getCampaignBoxes = async (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId, 10);
    if (isNaN(campaignId)) {
      return res.status(400).json({ message: 'Invalid Campaign ID format.' });
    }

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

    const formattedBoxes = boxes.map(box => ({
        id: box.id.toString(),
        name: box.name,
        status: box.status,
        openedBy: box.openLog ? {
            userId: box.openLog.userId.toString(),
            name: box.openLog.user.name
        } : null
    }));

    res.status(200).json(formattedBoxes);

  } catch (error) {
    console.error('Get campaign boxes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};