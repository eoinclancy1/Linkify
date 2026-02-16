-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "EmployeeRole" AS ENUM ('EMPLOYEE', 'ADVISOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: Add role column to Employee (idempotent)
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "role" "EmployeeRole" NOT NULL DEFAULT 'EMPLOYEE';

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Employee_role_idx" ON "Employee"("role");

-- AlterTable: Add inline external author fields to Post (idempotent)
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "externalAuthorName" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "externalAuthorUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "externalAuthorAvatarUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "externalAuthorHeadline" TEXT;

-- Step 1: Make columns nullable FIRST (before any NULL updates)
ALTER TABLE "Post" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "CompanyMention" ALTER COLUMN "authorId" DROP NOT NULL;

-- Step 2: Change foreign keys from Cascade to SetNull
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_authorId_fkey";
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompanyMention" DROP CONSTRAINT IF EXISTS "CompanyMention_authorId_fkey";
ALTER TABLE "CompanyMention" ADD CONSTRAINT "CompanyMention_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 3: Backfill inline fields from external Employee records (only if isExternalAuthor column still exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Employee' AND column_name = 'isExternalAuthor') THEN
    UPDATE "Post" p
    SET "externalAuthorName" = e."fullName",
        "externalAuthorUrl" = e."linkedinUrl",
        "externalAuthorAvatarUrl" = e."avatarUrl",
        "externalAuthorHeadline" = e."headline"
    FROM "Employee" e
    WHERE p."authorId" = e."id" AND e."isExternalAuthor" = true;

    -- Step 4: Null out authorIds for external posts/mentions
    UPDATE "CompanyMention" cm SET "authorId" = NULL
    FROM "Post" p WHERE cm."postId" = p."id" AND p."isExternal" = true;

    UPDATE "Post" SET "authorId" = NULL WHERE "isExternal" = true;

    -- Step 5: Delete PostingActivity for external authors
    DELETE FROM "PostingActivity" WHERE "employeeId" IN (SELECT "id" FROM "Employee" WHERE "isExternalAuthor" = true);

    -- Step 6: Delete external Employee records
    DELETE FROM "Employee" WHERE "isExternalAuthor" = true;

    -- Step 7: Drop isExternalAuthor column
    ALTER TABLE "Employee" DROP COLUMN "isExternalAuthor";
  END IF;
END $$;
