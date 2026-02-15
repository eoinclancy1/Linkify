-- AlterEnum
ALTER TYPE "ScrapeType" ADD VALUE 'MENTION_SEARCH';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "isExternalAuthor" BOOLEAN NOT NULL DEFAULT false;
