-- CreateEnum
CREATE TYPE "Department" AS ENUM ('ENGINEERING', 'MARKETING', 'SALES', 'PRODUCT', 'DESIGN', 'OTHER');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('ORIGINAL', 'RESHARE', 'ARTICLE', 'POLL');

-- CreateEnum
CREATE TYPE "ScrapeType" AS ENUM ('EMPLOYEE_DISCOVERY', 'PROFILE_SCRAPE', 'POST_SCRAPE', 'ENGAGEMENT_UPDATE');

-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "about" TEXT,
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "department" "Department" NOT NULL DEFAULT 'OTHER',
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "experience" JSONB,
    "education" JSONB,
    "skills" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isManuallyAdded" BOOLEAN NOT NULL DEFAULT false,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "linkedinPostId" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "PostType" NOT NULL DEFAULT 'ORIGINAL',
    "textContent" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "mentionsCompany" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrls" JSONB,
    "hashtags" JSONB,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMention" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementSnapshot" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingActivity" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "postCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeRun" (
    "id" TEXT NOT NULL,
    "type" "ScrapeType" NOT NULL,
    "status" "ScrapeStatus" NOT NULL DEFAULT 'PENDING',
    "apifyActorId" TEXT,
    "apifyRunId" TEXT,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ScrapeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyLinkedinUrl" TEXT NOT NULL DEFAULT '',
    "companyName" TEXT NOT NULL DEFAULT '',
    "scrapeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scrapeHistoryDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_linkedinUrl_key" ON "Employee"("linkedinUrl");

-- CreateIndex
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");

-- CreateIndex
CREATE INDEX "Employee_department_idx" ON "Employee"("department");

-- CreateIndex
CREATE UNIQUE INDEX "Post_linkedinPostId_key" ON "Post"("linkedinPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_linkedinUrl_key" ON "Post"("linkedinUrl");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_publishedAt_idx" ON "Post"("publishedAt");

-- CreateIndex
CREATE INDEX "Post_mentionsCompany_idx" ON "Post"("mentionsCompany");

-- CreateIndex
CREATE INDEX "Post_engagementScore_idx" ON "Post"("engagementScore");

-- CreateIndex
CREATE INDEX "CompanyMention_authorId_idx" ON "CompanyMention"("authorId");

-- CreateIndex
CREATE INDEX "CompanyMention_publishedAt_idx" ON "CompanyMention"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMention_postId_key" ON "CompanyMention"("postId");

-- CreateIndex
CREATE INDEX "EngagementSnapshot_postId_idx" ON "EngagementSnapshot"("postId");

-- CreateIndex
CREATE INDEX "EngagementSnapshot_snapshotAt_idx" ON "EngagementSnapshot"("snapshotAt");

-- CreateIndex
CREATE INDEX "PostingActivity_employeeId_idx" ON "PostingActivity"("employeeId");

-- CreateIndex
CREATE INDEX "PostingActivity_date_idx" ON "PostingActivity"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PostingActivity_employeeId_date_key" ON "PostingActivity"("employeeId", "date");

-- CreateIndex
CREATE INDEX "ScrapeRun_type_idx" ON "ScrapeRun"("type");

-- CreateIndex
CREATE INDEX "ScrapeRun_status_idx" ON "ScrapeRun"("status");

-- CreateIndex
CREATE INDEX "ScrapeRun_startedAt_idx" ON "ScrapeRun"("startedAt");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMention" ADD CONSTRAINT "CompanyMention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMention" ADD CONSTRAINT "CompanyMention_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementSnapshot" ADD CONSTRAINT "EngagementSnapshot_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingActivity" ADD CONSTRAINT "PostingActivity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
