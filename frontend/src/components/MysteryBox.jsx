import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const MysteryBox = ({ box, onClick, isOpenedByMe, isOpening, index, brandLogo, openedBrandLogo }) => {
  const { id, status, openedBy } = box;
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const isAvailable = status === 'available';
  const isOpened = status === 'opened';

  // Animasi klik dibuat ringan dan selalu reset agar tidak ada sisa rotasi miring.
  const clickShake = isOpening && !prefersReducedMotion
    ? {
        scale: [1, 0.97, 1.03, 1],
        rotate: [0, -1.5, 1.5, 0],
        x: [0, -2, 2, 0],
      }
    : { rotate: 0, x: 0, y: 0, scale: 1 };

  return (
    <motion.div
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-120 select-none
        ${isAvailable && !isOpening
          ? 'cursor-pointer border-yellow-500/40'
          : 'border-gray-600/30'
        }
        ${isOpened
          ? 'bg-black/40'
          : 'bg-gradient-to-br from-yellow-400 to-yellow-600'
        }
      `}
      onClick={isAvailable && !isOpening ? () => onClick(id) : null}
      whileTap={isAvailable && !isOpening ? { scale: 0.94, opacity: 0.9 } : {}}
      animate={clickShake}
      transition={
        isOpening && !prefersReducedMotion
          ? { duration: 0.28, ease: "easeInOut" }
          : { type: "spring", stiffness: 260, damping: 22 }
      }
    >
      {/* Glossy overlay for available boxes */}
      {!isOpened && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></div>
      )}

      {/* Index Number - Top Left (lebih ringkas agar pas di 5 kolom) */}
      <div
        className={`absolute top-1 left-1 text-[9px] font-bold z-25 ${isOpened ? 'text-yellow-300' : 'text-purple-950/80'}`}
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
      >
        #{index}
      </div>

      {/* Brand logo (optional), tucked under text */}
      {brandLogo && !isOpened && (
        <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
          <div className="w-9 h-9 rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.16)] overflow-hidden flex items-center justify-center opacity-75 bg-transparent border-0">
            <img
              src={brandLogo}
              alt="Brand"
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}

      {/* Secondary logo when opened */}
      {openedBrandLogo && isOpened && (
        <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
          <div className="w-10 h-10 rounded-md shadow-[0_4px_8px_rgba(0,0,0,0.18)] overflow-hidden flex items-center justify-center opacity-85 bg-transparent border-0">
            <img
              src={openedBrandLogo}
              alt="Brand"
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}

      {/* Text Group moved to bottom for clarity; brand tetap di tengah */}
      {isOpened ? (
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-end z-10 space-y-[0.5px]">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
            TERBUKA
          </span>
          <span className="text-[9px] text-gray-500 text-center leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {isOpenedByMe ? 'Oleh Anda' : `Oleh ${openedBy?.name?.split(' ')[0] || 'User'}`}
          </span>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-1 flex items-center justify-center z-3">
          <span className="text-[10px] font-bold uppercase text-purple-950 leading-none" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>
            KLIK BUKA
          </span>
        </div>
      )}

      {/* Opening overlay dihapus untuk menjaga kesan ringan */}
    </motion.div>
  );
};

export default React.memo(MysteryBox);
