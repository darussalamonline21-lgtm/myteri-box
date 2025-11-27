import prisma from '../utils/prisma.js';
import { Parser } from 'json2csv';

/**
 * @desc    Export winners/activity logs as CSV
 * @route   GET /api/v1/admin/reports/export-winners
 * @access  Private (Superadmin)
 */
export const exportWinnersReport = async (req, res) => {
    try {
        // Query all box open logs with relations
        const logs = await prisma.userBoxOpenLog.findMany({
            orderBy: {
                openedAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        storeCode: true,
                    }
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                prize: {
                    select: {
                        id: true,
                        name: true,
                        tier: true,
                        type: true,
                    }
                }
            }
        });

        // Flatten data for CSV
        const flattenedData = logs.map(log => ({
            'Date': log.openedAt ? new Date(log.openedAt).toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) : '-',
            'User Name': log.user?.name || '-',
            'Store Code': log.user?.storeCode || '-',
            'Campaign Name': log.campaign?.name || '-',
            'Prize Name': log.prize?.name || 'No Prize',
            'Prize Tier': log.prize?.tier || '-',
            'Prize Type': log.prize?.type || '-',
            'Box ID': log.boxId?.toString() || '-',
            'User ID': log.userId?.toString() || '-',
            'Campaign ID': log.campaignId?.toString() || '-',
        }));

        // Convert to CSV
        const parser = new Parser({
            fields: [
                'Date',
                'User Name',
                'Store Code',
                'Campaign Name',
                'Prize Name',
                'Prize Tier',
                'Prize Type',
                'Box ID',
                'User ID',
                'Campaign ID'
            ]
        });

        const csv = parser.parse(flattenedData);

        // Set response headers for file download
        const filename = `winners-report-${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Send CSV with UTF-8 BOM to avoid encoding issues on some platforms/browsers
        const csvWithBom = '\uFEFF' + csv;
        return res.status(200).send(csvWithBom);

    } catch (error) {
        console.error('Export Winners Report Error:', error);
        return res.status(500).json({
            message: 'Failed to generate report',
            error: error.message
        });
    }
};
