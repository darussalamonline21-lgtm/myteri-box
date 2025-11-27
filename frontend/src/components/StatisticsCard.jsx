import React from 'react';
import ProgressBar from './ProgressBar';

const StatisticsCard = ({ stats }) => {
    if (!stats) return null;

    const StatItem = ({ icon, label, value, color = 'text-gray-900' }) => (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xl">{icon}</div>
            <div className="flex-1">
                <div className="text-xs text-gray-500">{label}</div>
                <div className={`text-lg font-bold ${color}`}>{value}</div>
            </div>
        </div>
    );

    const TierBadge = ({ tier, count }) => {
        const tierColors = {
            S: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
            A: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white',
            B: 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white',
            C: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
        };

        return (
            <div className={`px-3 py-2 rounded-lg ${tierColors[tier]} text-center`}>
                <div className="text-xs font-semibold">Tier {tier}</div>
                <div className="text-lg font-bold">{count}</div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Your Statistics
            </h2>

            {/* Campaign Progress */}
            <div className="mb-6">
                <ProgressBar
                    current={stats.totalBoxesOpened || 0}
                    total={stats.totalBoxesInCampaign || 1}
                    label="Campaign Progress"
                />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <StatItem
                    icon="🎁"
                    label="Prizes Won"
                    value={stats.totalPrizesWon || 0}
                    color="text-green-600"
                />
                <StatItem
                    icon="📦"
                    label="Boxes Opened"
                    value={stats.totalBoxesOpened || 0}
                    color="text-blue-600"
                />
                <StatItem
                    icon="🎯"
                    label="Win Rate"
                    value={`${stats.winRate || 0}%`}
                    color="text-purple-600"
                />
                <StatItem
                    icon="🔥"
                    label="Streak"
                    value={`${stats.streak || 0} days`}
                    color="text-orange-600"
                />
            </div>

            {/* Prize Distribution */}
            {stats.prizesByTier && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Prize Distribution by Tier</h3>
                    <div className="grid grid-cols-4 gap-2">
                        <TierBadge tier="S" count={stats.prizesByTier.S || 0} />
                        <TierBadge tier="A" count={stats.prizesByTier.A || 0} />
                        <TierBadge tier="B" count={stats.prizesByTier.B || 0} />
                        <TierBadge tier="C" count={stats.prizesByTier.C || 0} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatisticsCard;
