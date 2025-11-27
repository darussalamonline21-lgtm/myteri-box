import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedAchievements } from '../src/services/achievementService.js';

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding ...");

    // --- HAPUS DATA LAMA (OPSIONAL TAPI DIANJURKAN) ---
    // Hapus dalam urutan terbalik dari pembuatan untuk menghindari error relasi
    await prisma.userAchievement.deleteMany();
    await prisma.userCouponBalance.deleteMany();
    await prisma.userPrize.deleteMany();
    await prisma.userBoxOpenLog.deleteMany();
    await prisma.prize.deleteMany();
    await prisma.box.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
    await prisma.achievement.deleteMany();
    console.log("Old data deleted.");

    // --- SEED ADMIN DEFAULT ---
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123'; // mudah diingat; ganti setelah login
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.upsert({
        where: { email: adminEmail },
        update: { passwordHash: adminHash, role: 'superadmin', name: 'Default Admin' },
        create: {
            email: adminEmail,
            passwordHash: adminHash,
            role: 'superadmin',
            name: 'Default Admin',
        }
    });
    console.log(`Created default admin: ${adminEmail} / ${adminPassword}`);

    // --- SEED ACHIEVEMENTS ---
    await seedAchievements();

    // --- BUAT CAMPAIGN BARU ---
    const campaign = await prisma.campaign.create({
        data: {
            name: 'Mega Mystery Box 2025',
            description: 'Campaign besar dengan ribuan kotak misteri!',
            startDate: new Date('2025-11-01T00:00:00Z'),
            endDate: new Date('2026-01-31T23:59:59Z'),
            minPurchasePerCoupon: 100000.00,
            isActive: true,
        }
    });
    console.log(`Created campaign: ${campaign.name} (ID: ${campaign.id})`);

    // --- BUAT BANYAK KOTAK (BOX) ---
    const totalBoxes = 2000;
    const boxesToCreate = [];
    for (let i = 1; i <= totalBoxes; i++) {
        boxesToCreate.push({
            name: `Mystery Box #${i}`,
            campaignId: campaign.id,
        });
    }
    // Gunakan createMany untuk efisiensi
    await prisma.box.createMany({
        data: boxesToCreate,
    });
    console.log(`Created ${totalBoxes} boxes.`);

    // --- BUAT BEBERAPA HADIAH (PRIZE) ---
    await prisma.prize.createMany({
        data: [
            {
                name: 'Voucher Emas 1 Juta',
                tier: 'S',
                type: 'voucher',
                baseProbability: 0.01, // 1%
                stockTotal: 10,
                stockRemaining: 10,
                campaignId: campaign.id,
            },
            {
                name: 'Smartphone Keren',
                tier: 'A',
                type: 'physical',
                baseProbability: 0.09, // 9%
                stockTotal: 50,
                stockRemaining: 50,
                campaignId: campaign.id,
            },
            {
                name: 'T-Shirt Eksklusif',
                tier: 'B',
                type: 'physical',
                baseProbability: 0.40, // 40%
                stockTotal: 500,
                stockRemaining: 500,
                campaignId: campaign.id,
            },
            {
                name: 'Poin Bonus 1000',
                tier: 'C',
                type: 'points',
                baseProbability: 0.50, // 50%
                stockTotal: 10000,
                stockRemaining: 10000,
                campaignId: campaign.id,
            },
        ]
    });
    console.log("Created prizes.");

    // --- BUAT USER UNTUK TES ---
    const password = 'secret123';
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name: 'Toko Pemenang',
            phone: '081298765432',
            status: 'active',
            storeCode: 'PEMENANG-001',
            passwordHash: passwordHash,
        }
    });
    console.log(`Created user: ${user.name} (Gunakan storeCode: ${user.storeCode} dan password: ${password})`);

    // --- BERIKAN KUPON KEPADA USER ---
    await prisma.userCouponBalance.create({
        data: {
            userId: user.id,
            campaignId: campaign.id,
            totalEarned: 1500, // Beri banyak kupon untuk tes
        }
    });
    console.log(`Gave ${user.name} 1500 coupons.`);

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
