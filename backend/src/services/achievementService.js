import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Achievement definitions
export const ACHIEVEMENTS = [
    // Bronze Tier - Beginner
    {
        code: 'FIRST_WIN',
        name: 'First Victory',
        description: 'Win your first prize',
        icon: '🎉',
        tier: 'bronze',
        requirement: 1,
        checkFn: (stats) => stats.totalPrizesWon >= 1
    },
    {
        code: 'BOX_OPENER_10',
        name: 'Box Opener',
        description: 'Open 10 mystery boxes',
        icon: '📦',
        tier: 'bronze',
        requirement: 10,
        checkFn: (stats) => stats.totalBoxesOpened >= 10
    },
    {
        code: 'PRIZE_COLLECTOR_5',
        name: 'Prize Collector',
        description: 'Collect 5 prizes',
        icon: '🎁',
        tier: 'bronze',
        requirement: 5,
        checkFn: (stats) => stats.totalPrizesWon >= 5
    },

    // Silver Tier - Intermediate
    {
        code: 'BOX_OPENER_50',
        name: 'Dedicated Opener',
        description: 'Open 50 mystery boxes',
        icon: '📦',
        tier: 'silver',
        requirement: 50,
        checkFn: (stats) => stats.totalBoxesOpened >= 50
    },
    {
        code: 'PRIZE_COLLECTOR_25',
        name: 'Prize Hunter',
        description: 'Collect 25 prizes',
        icon: '🎯',
        tier: 'silver',
        requirement: 25,
        checkFn: (stats) => stats.totalPrizesWon >= 25
    },
    {
        code: 'TIER_A_WIN',
        name: 'Rare Find',
        description: 'Win a Tier A prize',
        icon: '⭐',
        tier: 'silver',
        requirement: 1,
        checkFn: (stats) => (stats.prizesByTier?.A || 0) >= 1
    },
    {
        code: 'STREAK_7',
        name: 'Week Warrior',
        description: 'Open boxes for 7 consecutive days',
        icon: '🔥',
        tier: 'silver',
        requirement: 7,
        checkFn: (stats) => stats.streak >= 7
    },

    // Gold Tier - Advanced
    {
        code: 'BOX_OPENER_100',
        name: 'Century Opener',
        description: 'Open 100 mystery boxes',
        icon: '💯',
        tier: 'gold',
        requirement: 100,
        checkFn: (stats) => stats.totalBoxesOpened >= 100
    },
    {
        code: 'PRIZE_COLLECTOR_50',
        name: 'Master Collector',
        description: 'Collect 50 prizes',
        icon: '👑',
        tier: 'gold',
        requirement: 50,
        checkFn: (stats) => stats.totalPrizesWon >= 50
    },
    {
        code: 'TIER_S_WIN',
        name: 'Jackpot Master',
        description: 'Win a Tier S prize',
        icon: '💎',
        tier: 'gold',
        requirement: 1,
        checkFn: (stats) => (stats.prizesByTier?.S || 0) >= 1
    },
    {
        code: 'STREAK_30',
        name: 'Monthly Champion',
        description: 'Open boxes for 30 consecutive days',
        icon: '🏆',
        tier: 'gold',
        requirement: 30,
        checkFn: (stats) => stats.streak >= 30
    },

    // Platinum Tier - Expert
    {
        code: 'BOX_OPENER_500',
        name: 'Legend',
        description: 'Open 500 mystery boxes',
        icon: '🌟',
        tier: 'platinum',
        requirement: 500,
        checkFn: (stats) => stats.totalBoxesOpened >= 500
    },
    {
        code: 'ALL_ROOMS_VISITED',
        name: 'Explorer',
        description: 'Visit all 100 rooms',
        icon: '🗺️',
        tier: 'platinum',
        requirement: 100,
        checkFn: (stats) => stats.roomsVisited >= 100
    },
    {
        code: 'WIN_RATE_80',
        name: 'Lucky Star',
        description: 'Achieve 80% win rate (min 50 boxes)',
        icon: '✨',
        tier: 'platinum',
        requirement: 80,
        checkFn: (stats) => stats.totalBoxesOpened >= 50 && stats.winRate >= 80
    },
    {
        code: 'PRIZE_COLLECTOR_100',
        name: 'Ultimate Collector',
        description: 'Collect 100 prizes',
        icon: '🏅',
        tier: 'platinum',
        requirement: 100,
        checkFn: (stats) => stats.totalPrizesWon >= 100
    }
];

/**
 * Seed achievements into database
 */
export async function seedAchievements() {
    console.log('Seeding achievements...');

    for (const achievement of ACHIEVEMENTS) {
        await prisma.achievement.upsert({
            where: { code: achievement.code },
            update: {
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                tier: achievement.tier,
                requirement: achievement.requirement
            },
            create: {
                code: achievement.code,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                tier: achievement.tier,
                requirement: achievement.requirement
            }
        });
    }

    console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
}

/**
 * Check and unlock achievements for a user based on their stats
 */
export async function checkAndUnlockAchievements(userId, stats) {
    const newlyUnlocked = [];

    for (const achievementDef of ACHIEVEMENTS) {
        // Get achievement from DB by code
        const achievement = await prisma.achievement.findUnique({
            where: { code: achievementDef.code }
        });

        if (!achievement) continue;

        const compositeKey = {
            userId: BigInt(userId),
            achievementId: achievement.id
        };

        // Check if achievement is already tracked/unlocked
        const existing = await prisma.userAchievement.findUnique({
            where: { userId_achievementId: compositeKey }
        });

        // Calculate progress
        let progress = 0;
        if (achievementDef.code.startsWith('BOX_OPENER')) {
            progress = stats.totalBoxesOpened;
        } else if (achievementDef.code.startsWith('PRIZE_COLLECTOR')) {
            progress = stats.totalPrizesWon;
        } else if (achievementDef.code.startsWith('STREAK')) {
            progress = stats.streak;
        } else if (achievementDef.code === 'TIER_A_WIN') {
            progress = stats.prizesByTier?.A || 0;
        } else if (achievementDef.code === 'TIER_S_WIN') {
            progress = stats.prizesByTier?.S || 0;
        } else if (achievementDef.code === 'ALL_ROOMS_VISITED') {
            progress = stats.roomsVisited || 0;
        } else if (achievementDef.code === 'WIN_RATE_80') {
            progress = stats.winRate || 0;
        }

        // Check if should be unlocked
        const shouldUnlock = achievementDef.checkFn(stats);

        if (shouldUnlock) {
            if (existing) {
                // Ensure progress is at least requirement and mark unlocked
                const updated = await prisma.userAchievement.update({
                    where: { id: existing.id },
                    data: {
                        progress: Math.max(existing.progress, achievementDef.requirement),
                        unlockedAt: existing.unlockedAt || new Date()
                    },
                    include: { achievement: true }
                });
                newlyUnlocked.push(updated);
            } else {
                // Unlock achievement
                const unlocked = await prisma.userAchievement.create({
                    data: {
                        userId: compositeKey.userId,
                        achievementId: compositeKey.achievementId,
                        progress: achievementDef.requirement
                    },
                    include: {
                        achievement: true
                    }
                });
                newlyUnlocked.push(unlocked);
            }
        } else if (existing && progress !== existing.progress) {
            // Update progress
            await prisma.userAchievement.update({
                where: { id: existing.id },
                data: { progress }
            });
        } else if (!existing && progress > 0) {
            // Create progress tracking
            await prisma.userAchievement.create({
                data: {
                    userId: compositeKey.userId,
                    achievementId: compositeKey.achievementId,
                    progress
                }
            });
        }
    }

    return newlyUnlocked;
}

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId) {
    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
        orderBy: [
            { tier: 'asc' },
            { requirement: 'asc' }
        ]
    });

    // Get user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: BigInt(userId) },
        include: { achievement: true }
    });

    const unlockedMap = new Map();
    userAchievements.forEach(ua => {
        unlockedMap.set(ua.achievementId.toString(), ua);
    });

    const unlocked = [];
    const inProgress = [];

    allAchievements.forEach(achievement => {
        const userAch = unlockedMap.get(achievement.id.toString());
        const base = {
            ...achievement,
            id: achievement.id.toString(),
        };

        if (userAch && userAch.progress >= achievement.requirement) {
            unlocked.push({
                ...base,
                unlockedAt: userAch.unlockedAt,
                progress: userAch.progress
            });
        } else if (userAch && userAch.progress > 0) {
            inProgress.push({
                ...base,
                progress: userAch.progress
            });
        }
    });

    return {
        unlocked,
        inProgress,
        total: allAchievements.length,
        unlockedCount: unlocked.length
    };
}

export default {
    seedAchievements,
    checkAndUnlockAchievements,
    getUserAchievements,
    ACHIEVEMENTS
};
