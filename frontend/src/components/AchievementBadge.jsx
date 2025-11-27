import React from 'react';
import ProgressBar from './ProgressBar';

const AchievementBadge = ({ achievement, unlocked, progress }) => {
    const tierColors = {
        bronze: 'from-amber-700 to-amber-900',
        silver: 'from-gray-400 to-gray-600',
        gold: 'from-yellow-400 to-yellow-600',
        platinum: 'from-cyan-400 to-blue-600'
    };

    const tierBorderColors = {
        bronze: 'border-amber-600',
        silver: 'border-gray-500',
        gold: 'border-yellow-500',
        platinum: 'border-cyan-500'
    };

    return (
        <div className={`
      relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105
      ${unlocked
                ? `bg-gradient-to-br ${tierColors[achievement.tier]} ${tierBorderColors[achievement.tier]} shadow-lg`
                : 'bg-gray-100 border-gray-300 opacity-60'
            }
    `}>
            {/* Unlock Checkmark */}
            {unlocked && (
                <div className="absolute top-2 right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                </div>
            )}

            {/* Achievement Icon */}
            <div className="text-4xl mb-2 text-center">{achievement.icon}</div>

            {/* Achievement Info */}
            <h3 className={`font-bold text-sm text-center mb-1 ${unlocked ? 'text-white' : 'text-gray-800'}`}>
                {achievement.name}
            </h3>
            <p className={`text-xs text-center ${unlocked ? 'text-gray-100' : 'text-gray-600'}`}>
                {achievement.description}
            </p>

            {/* Progress Bar for Locked Achievements */}
            {!unlocked && progress !== undefined && progress > 0 && (
                <div className="mt-3">
                    <div className="relative w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${Math.min((progress / achievement.requirement) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                        {progress}/{achievement.requirement}
                    </p>
                </div>
            )}

            {/* Tier Badge */}
            <div className={`
        mt-2 text-center text-xs font-semibold uppercase
        ${unlocked ? 'text-gray-200' : 'text-gray-500'}
      `}>
                {achievement.tier}
            </div>
        </div>
    );
};

export default AchievementBadge;
