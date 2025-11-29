import prisma from './src/utils/prisma.js';

async function main() {
  console.log('User:', await prisma.user.count());
  console.log('Box:', await prisma.box.count());
  console.log('Prize:', await prisma.prize.count());
  console.log('Campaign:', await prisma.campaign.count());
  console.log('Transaction:', await prisma.transaction.count());
  console.log('UserPrize:', await prisma.userPrize.count());
  console.log('UserBoxOpenLog:', await prisma.userBoxOpenLog.count());
  console.log('UserCouponBalance:', await prisma.userCouponBalance.count());
  console.log('UserAchievement:', await prisma.userAchievement.count());
  console.log('Admin:', await prisma.admin.count());
  await prisma.$disconnect();
}

main().catch(console.error);
