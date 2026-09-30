-- CreateEnum
CREATE TYPE "FileProcessingStatus" AS ENUM ('READY', 'NO_TEXT');

-- CreateTable
CREATE TABLE "ProjectFile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "data" BYTEA NOT NULL,
    "extractedText" TEXT,
    "processingStatus" "FileProcessingStatus" NOT NULL,
    "textTruncated" BOOLEAN NOT NULL DEFAULT false,
    "pageCount" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFileChunk" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectFileChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectFile_userId_createdAt_idx" ON "ProjectFile"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectFile_projectId_createdAt_idx" ON "ProjectFile"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFile_projectId_sha256_key" ON "ProjectFile"("projectId", "sha256");

-- CreateIndex
CREATE INDEX "ProjectFileChunk_userId_fileId_idx" ON "ProjectFileChunk"("userId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFileChunk_fileId_chunkIndex_key" ON "ProjectFileChunk"("fileId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFileChunk" ADD CONSTRAINT "ProjectFileChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFileChunk" ADD CONSTRAINT "ProjectFileChunk_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ProjectFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
