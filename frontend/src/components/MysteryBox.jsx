import React from 'react';

// Tambahkan prop baru: isOpening
const MysteryBox = ({ box, onClick, isOpenedByMe, isOpening }) => {
  const { id, name, status, openedBy } = box;
  
  let boxClasses = "border-4 rounded-lg p-4 flex flex-col items-center justify-center aspect-square transition-all duration-300 ";
  let textClasses = "font-bold text-center";
  
  // --- PERUBAHAN DI SINI: Tambahkan logika untuk 'isOpening' ---
  if (isOpening) {
    boxClasses += " animate-shake cursor-wait"; // Terapkan animasi dan ubah cursor
  } else if (status === 'opened') {
    if (isOpenedByMe) {
      boxClasses += " bg-blue-200 border-blue-400";
      textClasses += " text-blue-800";
    } else {
      boxClasses += " bg-gray-200 border-gray-400 opacity-60";
      textClasses += " text-gray-600";
    }
  } else { // 'available'
    boxClasses += " bg-yellow-300 border-yellow-500 cursor-pointer hover:bg-yellow-400 hover:scale-105";
    textClasses += " text-yellow-800";
  }

  return (
    // Pastikan onClick dinonaktifkan saat sedang membuka
    <div className={boxClasses} onClick={status === 'available' && !isOpening ? () => onClick(id) : null}>
      <div className={textClasses}>
        <div className="text-2xl">?</div>
        <div className="text-xs mt-1">{name}</div>
        {status === 'opened' && (
          <div className="text-xs mt-2 text-gray-500">
            Opened by: {isOpenedByMe ? 'You' : openedBy?.name || '...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MysteryBox;