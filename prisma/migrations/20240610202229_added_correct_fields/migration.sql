/*
  Warnings:

  - The `phoneNumber` column on the `Contact` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phoneNumbers` column on the `Customer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "phoneNumber",
ADD COLUMN     "phoneNumber" INTEGER;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "phoneNumbers",
ADD COLUMN     "phoneNumbers" INTEGER[];
