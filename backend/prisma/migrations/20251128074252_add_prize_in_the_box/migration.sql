-- AlterTable
ALTER TABLE "Box" ADD COLUMN     "prizeId" BIGINT;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
