// ... (fungsi getCampaignSummary, openBoxController, dll. sudah ada)

/**
 * @desc    Get a list of all boxes for a campaign
 * @route   GET /api/v1/campaigns/:campaignId/boxes
 * @access  Private (User)
 */
export const getCampaignBoxes = async (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId, 10);
    if (isNaN(campaignId)) {
      return res.status(400).json({ message: 'Invalid Campaign ID format.' });
    }

    // Query untuk mengambil semua kotak dalam kampanye
    // Kita juga menyertakan data 'openLog' untuk mengetahui status kotak
    const boxes = await prisma.box.findMany({
      where: {
        campaignId: campaignId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        // Sertakan info siapa yang membuka kotak, jika sudah dibuka
        openLog: {
          select: {
            userId: true,
            user: {
              select: {
                name: true, // Ambil nama toko yang membuka
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc', // Urutkan berdasarkan ID agar konsisten
      },
      // Tambahkan paginasi di masa depan jika perlu
      // take: 100,
      // skip: 0,
    });

    // Format data agar lebih mudah digunakan oleh frontend
    const formattedBoxes = boxes.map(box => ({
        id: box.id.toString(),
        name: box.name,
        status: box.status,
        // Tambahkan info 'openedBy' agar frontend tahu siapa yang membuka
        openedBy: box.openLog ? {
            userId: box.openLog.userId.toString(),
            name: box.openLog.user.name
        } : null
    }));

    res.status(200).json(formattedBoxes);

  } catch (error) {
    console.error('Get campaign boxes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};