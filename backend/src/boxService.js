import prisma from '../utils/prisma.js';
import {
  CampaignInactiveError,
  NoCouponsLeftError,
  NoPrizesAvailableError,
  PrizeSelectionError,
} from '../utils/errors.js'; // Pastikan file errors.js sudah ada

/**
 * Melakukan seluruh proses pembukaan mystery box untuk seorang pengguna
 * dalam satu transaksi database yang aman.
 * @param {BigInt} userId - ID dari pengguna yang membuka kotak.
 * @param {BigInt} campaignId - ID dari kampanye.
 * @param {BigInt} boxId - ID dari kotak yang dibuka.
 * @returns {Promise<{prize: object, updatedBalance: object}>} - Hadiah yang dimenangkan dan saldo kupon terbaru.
 */
export const openBoxForUser = async (userId, campaignId, boxId) => {
  // --- Validasi Pra-Transaksi ---
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  const now = new Date();

  if (!campaign || !campaign.isActive || now < campaign.startDate || now > campaign.endDate) {
    throw new CampaignInactiveError();
  }

  // --- Transaksi Atomik Database ---
  return prisma.$transaction(async (tx) => {
    // 1. Dapatkan dan kunci saldo kupon pengguna
    const balance = await tx.userCouponBalance.findFirst({
      where: { userId, campaignId },
    });

    const currentBalance = (balance?.totalEarned || 0) - (balance?.totalUsed || 0);
    if (currentBalance <= 0) {
      throw new NoCouponsLeftError();
    }

    // 2. Dapatkan semua hadiah yang aktif dan tersedia
    const availablePrizes = await tx.prize.findMany({
      where: { campaignId, isActive: true, stockRemaining: { gt: 0 } },
    });

    if (availablePrizes.length === 0) {
      throw new NoPrizesAvailableError();
    }

    // 3. Logika Pemilihan Hadiah (Weighted Random)
    let totalWeight = 0;
    availablePrizes.forEach(p => totalWeight += parseFloat(p.baseProbability));
    
    const randomNum = Math.random() * totalWeight;
    
    let weightSum = 0;
    let selectedPrize = null;
    for (const prize of availablePrizes) {
      weightSum += parseFloat(p.baseProbability);
      if (randomNum <= weightSum) {
        selectedPrize = prize;
        break;
      }
    }
    
    // Fallback jika tidak ada hadiah terpilih (sangat jarang terjadi)
    if (!selectedPrize) {
        selectedPrize = availablePrizes[0];
    }
    
    // 4. Update Stok Hadiah (dengan pencegahan race condition)
    const updatedPrizeResult = await tx.prize.updateMany({
      where: {
        id: selectedPrize.id,
        stockRemaining: { gt: 0 } // Pastikan stok masih ada saat kita update
      },
      data: {
        stockRemaining: { decrement: 1 },
      },
    });
    
    // Jika updatedPrizeResult.count adalah 0, berarti orang lain mendapatkan stok terakhir.
    if (updatedPrizeResult.count === 0) {
      // Melempar error ini akan otomatis me-rollback seluruh transaksi.
      throw new PrizeSelectionError();
    }

    // 5. Update Saldo Kupon Pengguna
    const updatedBalance = await tx.userCouponBalance.update({
      where: { id: balance.id },
      data: { totalUsed: { increment: 1 } },
      select: { totalEarned: true, totalUsed: true }
    });

    // 6. Buat Log Pembukaan Kotak
    const openLog = await tx.userBoxOpenLog.create({
      data: {
        userId,
        campaignId,
        boxId,
        prizeId: selectedPrize.id,
        clientIp: '::1', // Placeholder, akan kita perbaiki di controller
        userAgent: 'unknown', // Placeholder
      },
      select: { id: true },
    });

    // 7. Buat Entri Hadiah Pengguna
    await tx.userPrize.create({
      data: {
        userId,
        campaignId,
        prizeId: selectedPrize.id,
        userBoxOpenLogId: openLog.id,
        status: 'unclaimed',
      },
    });

    // 8. Kembalikan data yang relevan
    return {
      prize: selectedPrize,
      updatedBalance: {
        totalEarned: updatedBalance.totalEarned,
        totalUsed: updatedBalance.totalUsed,
        balance: updatedBalance.totalEarned - updatedBalance.totalUsed
      }
    };
  }); // Akhir dari $transaction
};