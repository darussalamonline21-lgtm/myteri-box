import prisma from '../utils/prisma.js';
import {
  CampaignInactiveError,
  NoCouponsLeftError,
  NoPrizesAvailableError,
  PrizeSelectionError,
  ServiceError,
  BoxAlreadyOpenedError
} from '../utils/errors.js';

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

    const balance = await tx.userCouponBalance.findFirst({
      where: { userId, campaignId },
    });
    const currentBalance = (balance?.totalEarned || 0) - (balance?.totalUsed || 0);
    if (currentBalance <= 0) {
      throw new NoCouponsLeftError();
    }

    const availablePrizes = await tx.prize.findMany({
      where: { campaignId, isActive: true, stockRemaining: { gt: 0 } },
    });
    if (availablePrizes.length === 0) {
      throw new NoPrizesAvailableError();
    }

    let totalWeight = 0;
    availablePrizes.forEach(prize => totalWeight += parseFloat(prize.baseProbability));
    const randomNum = Math.random() * totalWeight;
    let weightSum = 0;
    let selectedPrize = null;
    for (const prize of availablePrizes) {
      weightSum += parseFloat(prize.baseProbability);
      if (randomNum <= weightSum) {
        selectedPrize = prize;
        break;
      }
    }
    if (!selectedPrize) {
        selectedPrize = availablePrizes[0];
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

    await tx.box.update({
        where: { id: boxId },
        data: { status: 'opened' }
    });

    const updatedBalance = await tx.userCouponBalance.update({
      where: { id: balance.id },
      data: { totalUsed: { increment: 1 } },
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