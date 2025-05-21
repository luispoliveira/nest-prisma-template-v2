-- AlterTable
ALTER TABLE "api_key" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "otp" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "permission" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;
