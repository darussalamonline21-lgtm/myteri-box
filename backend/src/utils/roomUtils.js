export const getRoomUnlockThreshold = () => {
  const parsed = parseInt(process.env.ROOM_UNLOCK_THRESHOLD || '50', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return parsed;
};

export const deriveRoomsMeta = (boxes, roomSize, unlockThreshold = getRoomUnlockThreshold()) => {
  if (!Array.isArray(boxes) || boxes.length === 0 || !roomSize) return [];
  const totalRooms = Math.ceil(boxes.length / roomSize);
  const rooms = [];

  for (let i = 0; i < totalRooms; i++) {
    const startIndex = i * roomSize;
    const roomBoxes = boxes.slice(startIndex, startIndex + roomSize);
    const openedCount = roomBoxes.filter(box => box.status === 'opened').length;
    const remainingBoxes = roomBoxes.length - openedCount;
    const isUnlocked = true; // Semua room selalu ditampilkan dan dianggap terbuka

    rooms.push({
      roomNumber: i + 1,
      startBox: startIndex + 1,
      endBox: startIndex + roomBoxes.length,
      totalBoxes: roomBoxes.length,
      openedCount,
      remainingBoxes,
      isUnlocked,
    });
  }

  return rooms;
};
