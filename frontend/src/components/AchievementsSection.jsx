import React from 'react';
import AchievementBadge from './AchievementBadge';
import ProgressBar from './ProgressBar';

const AchievementsSection = ({ achievements }) => {
    if (!achievements) return null;

    const { unlocked = [], inProgress = [], total = 0, unlockedCount = 0 } = achievements;

    // Combine and sort achievements
    const allAchievements = [...unlocked, ...inProgress];

    // Group by tier
    const groupedByTier = {
        platinum: [],
        gold: [],
        silver: [],
        bronze: []
    };

    allAchievements.forEach(achievement => {
        const isUnlocked = unlocked.some(a => a.id === achievement.id);
        groupedByTier[achievement.tier]?.push({
            ...achievement,
            unlocked: isUnlocked
        });
    });

    const TierSection = ({ tier, tierName, achievements }) => {
        if (achievements.length === 0) return null;

        const tierEmojis = {
            platinum: '💎',
            gold: '🥇',
            silver: '🥈',
            bronze: '🥉'
        };

        return (
            <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="mr-2">{tierEmojis[tier]}</span>
                    {tierName} Tier
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {achievements.map(achievement => (
                        <AchievementBadge
                            key={achievement.id || achievement.code}
                            achievement={achievement}
                            unlocked={achievement.unlocked}
                            progress={achievement.progress}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <span className="text-2xl mr-2">🏆</span>
                    Achievements
                </h2>
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {unlockedCount}/{total} Unlocked
                </span>
            </div>

            {/* Overall Progress */}
            <div className="mb-6">
                <ProgressBar
                    current={unlockedCount}
                    total={total}
                    label="Overall Progress"
                />
            </div>

            {/* Achievements by Tier */}
            <TierSection
                tier="platinum"
                tierName="Platinum"
                achievements={groupedByTier.platinum}
            />
            <TierSection
                tier="gold"
                tierName="Gold"
                achievements={groupedByTier.gold}
            />
            <TierSection
                tier="silver"
                tierName="Silver"
                achievements={groupedByTier.silver}
            />
            <TierSection
                tier="bronze"
                tierName="Bronze"
                achievements={groupedByTier.bronze}
            />

            {/* Empty State */}
            {allAchievements.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-gray-500">Start opening boxes to unlock achievements!</p>
                </div>
            )}
        </div>
    );
};

export default AchievementsSection;
