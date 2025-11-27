import { randomInt } from 'crypto';
import prisma from '../utils/prisma.js';
import {
  CampaignInactiveError,
  NoCouponsLeftError,
  NoPrizesAvailableError,
  PrizeSelectionError,
  ServiceError,
  BoxAlreadyOpenedError
} from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const openBoxForUser = async (userId, campaignId, boxId) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  const now = new Date();
  if (!campaign || !campaign.isActive || now < campaign.startDate || now > campaign.endDate) {
    throw new CampaignInactiveError();
  }

  return prisma.$transaction(async (tx) => {
    const boxToOpen = await tx.box.findUnique({ where: { id: boxId } });
    if (!boxToOpen) {
      throw new ServiceError('Box not found.', 'BOX_NOT_FOUND');
    }
    if (boxToOpen.status === 'opened') {
      throw new BoxAlreadyOpenedError();
    }

    const balance = await tx.userCouponBalance.upsert({
      where: { userId_campaignId: { userId, campaignId } },
      update: {},
      create: { userId, campaignId },
      select: { id: true, totalEarned: true, totalUsed: true }
    });
    const currentBalance = balance.totalEarned - balance.totalUsed;
    if (currentBalance <= 0) {
      throw new NoCouponsLeftError();
    }

    const availablePrizes = await tx.prize.findMany({
      where: { campaignId, isActive: true, stockRemaining: { gt: 0 } },
    });

    if (availablePrizes.length === 0) {
      throw new NoPrizesAvailableError();
    }

    // Pisahkan hadiah utama (tier 'S') dan hiburan
    const mainPrizes = availablePrizes.filter(p => (p.tier || '').toUpperCase() === 'S');
    const otherPrizes = availablePrizes.filter(p => (p.tier || '').toUpperCase() !== 'S');

    // Hitung remaining opens untuk kampanye (total kupon earned - used)
    const couponAgg = await tx.userCouponBalance.aggregate({
      _sum: { totalEarned: true, totalUsed: true },
      where: { campaignId }
    });
    const totalEarnedAll = couponAgg._sum.totalEarned || 0;
    const totalUsedAll = couponAgg._sum.totalUsed || 0;
    const remainingOpens = Math.max(0, totalEarnedAll - totalUsedAll);

    const remainingMain = mainPrizes.reduce((sum, p) => sum + (p.stockRemaining || 0), 0);

    const pickByWeight = (prizes) => {
      let totalWeight = 0;
      let hasPositiveWeight = false;
      prizes.forEach(prize => {
        const weight = parseFloat(prize.baseProbability);
        if (!Number.isFinite(weight) || weight < 0) {
          throw new PrizeSelectionError('Prize probabilities are misconfigured. Please try again later.');
        }
        if (weight > 0) hasPositiveWeight = true;
        totalWeight += weight;
      });
      if (!hasPositiveWeight || totalWeight <= 0) {
        throw new PrizeSelectionError('Prize probabilities are misconfigured. Please try again later.');
      }
      const precision = 1_000_000;
      const randomNum = (randomInt(precision) / precision) * totalWeight;
      let weightSum = 0;
      for (const prize of prizes) {
        weightSum += parseFloat(prize.baseProbability);
        if (randomNum <= weightSum) return prize;
      }
      return prizes[prizes.length - 1];
    };

    let selectedPrize = null;
    // Jika masih ada hadiah utama dan masih ada kupon tersisa, gunakan probabilitas dinamis
    if (remainingMain > 0 && remainingOpens > 0 && mainPrizes.length > 0) {
      const p = Math.min(1, remainingMain / remainingOpens);
      const roll = randomInt(1_000_000) / 1_000_000;
      if (roll <= p) {
        selectedPrize = pickByWeight(mainPrizes);
      } else if (otherPrizes.length > 0) {
        selectedPrize = pickByWeight(otherPrizes);
      } else {
        selectedPrize = pickByWeight(availablePrizes);
      }
    } else {
      // Fallback ke seleksi berbobot biasa
      selectedPrize = pickByWeight(availablePrizes);
    }

    const updatedPrizeResult = await tx.prize.updateMany({
      where: {
        id: selectedPrize.id,
        stockRemaining: { gt: 0 }
      },
      data: {
        stockRemaining: { decrement: 1 },
      },
    });
    if (updatedPrizeResult.count === 0) {
      throw new PrizeSelectionError();
    }

    const boxUpdateResult = await tx.box.updateMany({
      where: { id: boxId, status: { not: 'opened' } },
      data: { status: 'opened' }
    });
    if (boxUpdateResult.count === 0) {
      throw new BoxAlreadyOpenedError();
    }

    const couponUpdateResult = await tx.userCouponBalance.updateMany({
      where: { id: balance.id, totalUsed: balance.totalUsed },
      data: { totalUsed: { increment: 1 } }
    });
    if (couponUpdateResult.count === 0) {
      throw new NoCouponsLeftError();
    }

    const updatedBalance = await tx.userCouponBalance.findUnique({
      where: { id: balance.id },
      select: { totalEarned: true, totalUsed: true }
    });

    const openLog = await tx.userBoxOpenLog.create({
      data: {
        userId,
        campaignId,
        boxId,
        prizeId: selectedPrize.id, // Menggunakan selectedPrize
      },
      select: { id: true },
    });

    await tx.userPrize.create({
      data: {
        userId,
        campaignId,
        prizeId: selectedPrize.id, // Menggunakan selectedPrize
        userBoxOpenLogId: openLog.id,
        status: 'unclaimed',
      },
    });

    await logAudit({
      actorType: 'user',
      actorId: userId.toString(),
      action: 'BOX_OPEN',
      entityType: 'box',
      entityId: boxId.toString(),
      campaignId: campaignId.toString(),
      details: {
        prizeId: selectedPrize.id.toString(),
        prizeName: selectedPrize.name,
        prizeTier: selectedPrize.tier,
        prizeType: selectedPrize.type,
      },
    });

    return {
      prize: selectedPrize,
      updatedBalance: {
        totalEarned: updatedBalance.totalEarned,
        totalUsed: updatedBalance.totalUsed,
        balance: updatedBalance.totalEarned - updatedBalance.totalUsed
      }
    };
  });
};
