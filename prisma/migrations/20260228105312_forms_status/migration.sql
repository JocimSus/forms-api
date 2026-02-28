-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "status" "FormStatus" NOT NULL DEFAULT 'DRAFT';
