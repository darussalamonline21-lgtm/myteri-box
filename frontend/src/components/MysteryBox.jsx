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
      className={`relative aspect-square rounded-xl overflow-hidden border transition-all duration-150 select-none
        ${isOpened
          ? 'bg-slate-800 border-slate-700'
          : 'bg-amber-400 border-amber-500 hover:border-amber-600 shadow-sm hover:shadow-md'
        }
        ${isAvailable && !isOpening ? 'cursor-pointer' : ''}
      `}
      onClick={isAvailable && !isOpening ? () => onClick(id) : null}
      whileTap={isAvailable && !isOpening ? { scale: 0.97, opacity: 0.95 } : {}}
      animate={clickShake}
      transition={
        isOpening && !prefersReducedMotion
          ? { duration: 0.28, ease: "easeInOut" }
          : { type: "spring", stiffness: 260, damping: 22 }
      }
    >
      {/* Index Number */}
      <div
        className={`absolute top-1 left-1 text-[10px] font-semibold z-25 ${isOpened ? 'text-slate-200' : 'text-amber-950'}`}
      >
        #{index}
      </div>

      {/* Brand logo (optional) */}
      {brandLogo && !isOpened && (
        <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-200/35 blur-sm scale-110" />
            <img
              src={brandLogo}
              alt="Brand"
              className="relative w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}

      {/* Secondary logo when opened */}
      {openedBrandLogo && isOpened && (
        <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
          <div className="w-12 h-12 overflow-hidden flex items-center justify-center opacity-90 -translate-y-1.5">
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

      {isOpened ? (
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-end z-10 space-y-[0.1px]">
          <span className="text-[9px] font-normal uppercase tracking-wide text-slate-100 leading-tight">
            TERBUKA
          </span>
          <span className="text-[9px] font-normal text-slate-300 text-center leading-tight">
            {isOpenedByMe ? 'Oleh Anda' : `Oleh ${openedBy?.name?.split(' ')[0] || 'User'}`}
          </span>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-1 flex items-center justify-center z-3">
          <span className="text-[10px] font-semibold uppercase text-amber-950 leading-none">
            KLIK BUKA
          </span>
        </div>
      )}

    </motion.div>
  );
};

export default React.memo(MysteryBox);
