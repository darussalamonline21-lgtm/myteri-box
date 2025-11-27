import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { z } from 'zod';

// Validation schema for each CSV row
const userRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').optional().nullable(),
  phone: z.string().min(1, 'Phone is required'),
  storeName: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});

const generateSimplePassword = (length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
};

/**
 * @desc    Import multiple users from CSV file
 * @route   POST /api/v1/admin/users/import
 * @access  Private (Superadmin)
 */
export const importUsersFromCSV = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded. Please upload a CSV file.'
      });
    }

    // campaignId wajib supaya kupon bisa langsung diberikan
    if (!req.body.campaignId) {
      return res.status(400).json({
        message: 'campaignId is required to import users with coupon balances'
      });
    }

    const campaignId = BigInt(req.body.campaignId);
    const defaultInitialCoupons = Number(req.body.initialCoupons ?? 0);

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, name: true },
    });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found for provided campaignId' });
    }

    const fileBuffer = req.file.buffer;
    const errors = [];
    const successfulUsers = [];
    let rowIndex = 0;

    // Parse CSV from buffer
    const stream = Readable.from(fileBuffer.toString());

    // Collect all rows first
    const rows = await new Promise((resolve, reject) => {
      const data = [];
      stream
        .pipe(csvParser({
          mapHeaders: ({ header }) => header.trim().toLowerCase()
        }))
        .on('data', (row) => data.push(row))
        .on('end', () => resolve(data))
        .on('error', (error) => reject(error));
    });

    // Process each row
    for (const row of rows) {
      rowIndex++;

      try {
        // Trim all values
        const trimmedRow = {
          name: row.name?.trim() || '',
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || '',
          storeName: row.storename?.trim() || row.name?.trim() || '',
          ownerName: row.ownername?.trim() || row.name?.trim() || '',
          password: row.password?.trim() || null,
          initialCoupons: row.initialcoupons ? Number(row.initialcoupons) : null,
        };

        // Validate row data
        const validatedData = userRowSchema.parse(trimmedRow);
        const rowInitialCoupons = Number.isFinite(trimmedRow.initialCoupons) ? trimmedRow.initialCoupons : defaultInitialCoupons;

        // Generate storeCode from name (remove spaces and special chars, lowercase)
        const storeCodeBase = (validatedData.storeName || validatedData.name || 'store')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        const storeCode = `${storeCodeBase}${Date.now().toString().slice(-4)}`;

        // Check for duplicate email if provided
        if (validatedData.email) {
          const existingUserByEmail = await prisma.user.findFirst({
            where: { email: validatedData.email }
          });

          if (existingUserByEmail) {
            errors.push({
              row: rowIndex,
              message: `Email '${validatedData.email}' already exists`
            });
            continue;
          }
        }

        // Check for duplicate storeCode
        const existingUserByCode = await prisma.user.findUnique({
          where: { storeCode }
        });

        if (existingUserByCode) {
          errors.push({
            row: rowIndex,
            message: `Store code '${storeCode}' already exists (derived from name)`
          });
          continue;
        }

        // Generate default password if not provided
        const rawPassword = validatedData.password || generateSimplePassword(10);
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        // Create user + coupon balance in a transaction
        const { newUser, balance } = await prisma.$transaction(async (tx) => {
          const createdUser = await tx.user.create({
            data: {
              name: validatedData.storeName || validatedData.name,
              ownerName: validatedData.ownerName || validatedData.name,
              phone: validatedData.phone,
              email: validatedData.email,
              storeCode,
              passwordHash,
              status: 'active',
            },
            select: {
              id: true,
              name: true,
              storeCode: true,
              email: true,
              status: true,
            }
          });

          const createdBalance = await tx.userCouponBalance.create({
            data: {
              userId: createdUser.id,
              campaignId: campaign.id,
              totalEarned: rowInitialCoupons,
            },
          });

          return { newUser: createdUser, balance: createdBalance };
        });

        successfulUsers.push({
          ...newUser,
          id: newUser.id.toString(),
          generatedPassword: validatedData.password ? null : rawPassword,
          campaignId: campaign.id.toString(),
          totalEarned: rowInitialCoupons,
          balanceId: balance.id.toString(),
        });

      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(e => e.message).join(', ');
          errors.push({
            row: rowIndex,
            message: `Validation failed: ${errorMessages}`
          });
        } else {
          errors.push({
            row: rowIndex,
            message: error.message || 'Unknown error occurred'
          });
        }
      }
    }

    // Return summary
    return res.status(200).json({
      message: 'Import process completed',
      successCount: successfulUsers.length,
      failedCount: errors.length,
      totalRows: rows.length,
      successfulUsers,
      errors,
    });

  } catch (error) {
    console.error('CSV Import Error:', error);
    return res.status(500).json({
      message: 'Failed to process CSV file',
      error: error.message
    });
  }
};
