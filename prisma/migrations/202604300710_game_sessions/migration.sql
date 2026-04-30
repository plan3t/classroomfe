-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('NORMAL', 'WITH_GOALS');

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayer" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "goals" TEXT[],
    "done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameCartLine" (
    "id" TEXT NOT NULL,
    "gamePlayerId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "GameCartLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameSession_teacherId_createdAt_idx" ON "GameSession"("teacherId", "createdAt");

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameCartLine" ADD CONSTRAINT "GameCartLine_gamePlayerId_fkey" FOREIGN KEY ("gamePlayerId") REFERENCES "GamePlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
