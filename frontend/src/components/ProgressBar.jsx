import React from 'react';

const ProgressBar = ({ current, total, label, showPercentage = true, className = '' }) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {showPercentage && (
                        <span className="text-sm text-gray-500">
                            {percentage.toFixed(1)}%
                        </span>
                    )}
                </div>
            )}
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <div className="text-xs text-gray-500 mt-1">
                {current.toLocaleString()} / {total.toLocaleString()}
            </div>
        </div>
    );
};

export default ProgressBar;
