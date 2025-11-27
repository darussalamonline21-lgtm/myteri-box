import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const RoomCard = ({ roomNumber, startBox, endBox, remainingBoxes, totalBoxes, onClick }) => {
    return (
        <motion.div
            onClick={onClick}
            className="relative w-full h-48 rounded-2xl overflow-hidden shadow-[0_0_18px_rgba(251,191,36,0.28)] cursor-pointer border-2 border-yellow-400/35 bg-gradient-to-br from-[#FF4B1F] via-[#FF7A3D] to-[#FF9068]"
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            whileTap={{ scale: 0.97, opacity: 0.95 }}
        >
            {/* Subtle texture with pure CSS to replace image */}
            <div
                className="absolute inset-0 opacity-70"
                style={{
                    background:
                        'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.1), transparent 30%), radial-gradient(circle at 60% 80%, rgba(0,0,0,0.12), transparent 45%)'
                }}
            />

            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25"></div>

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                <div>
                    <h3 className="text-xl font-black bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-lg mb-1 leading-tight whitespace-nowrap truncate">
                        End Year Javamas {roomNumber}
                    </h3>
                    <div className="backdrop-blur-md bg-white/10 px-3 py-1 rounded-full inline-block">
                        <p className="text-white text-sm font-semibold">
                            Box {startBox} - {endBox}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <motion.div
                        className="relative bg-gradient-to-r from-yellow-400 to-yellow-600 text-purple-950 text-sm font-black px-4 py-2 rounded-full shadow-lg overflow-hidden"
                        animate={remainingBoxes < 5 ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        {/* Glossy highlight */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full"></div>
                        <span className="relative z-10">{remainingBoxes} Box Tersisa</span>
                    </motion.div>

                    <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <ChevronRight className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    </motion.div>
                </div>
            </div>

            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-purple-500/10 pointer-events-none"></div>
        </motion.div>
    );
};

export default React.memo(RoomCard);
