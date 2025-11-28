import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const RoomCard = ({ roomNumber, startBox, endBox, remainingBoxes, totalBoxes, onClick }) => {
    return (
        <motion.div
            onClick={onClick}
            className="relative w-full min-h-[150px] rounded-xl overflow-hidden border-2 border-amber-400 bg-white shadow-sm cursor-pointer"
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            whileTap={{ scale: 0.98, opacity: 0.96 }}
            whileHover={{ scale: 1.01 }}
        >
            <div className="absolute inset-0 p-4 flex flex-col justify-between bg-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="w-full">
                        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 rounded-lg px-3 py-2 border border-amber-400">
                            <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight whitespace-nowrap">
                                Magic Box {roomNumber}
                            </h3>
                            <ChevronRight className="w-5 h-5 text-amber-800" />
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 mt-2 whitespace-nowrap">
                            Box {startBox} - {endBox}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 text-[11px] md:text-sm font-medium border border-amber-200 whitespace-nowrap">
                        <span>{remainingBoxes} tersisa dari {totalBoxes} box</span>
                    </div>
                    <span className="text-[11px] md:text-xs font-semibold text-white bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 shadow-sm whitespace-nowrap">
                        Masuk untuk memilih box
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default React.memo(RoomCard);
