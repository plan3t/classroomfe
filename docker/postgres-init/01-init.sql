CREATE TYPE "UserRole" AS ENUM ('TEACHER');
CREATE TYPE "RoomTopic" AS ENUM ('SUPERMARKET');
CREATE TYPE "Language" AS ENUM ('DE', 'EN', 'FR', 'ES');
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED', 'EXPIRED');
CREATE TYPE "ParticipantStatus" AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Room" (
  "id" TEXT PRIMARY KEY,
  "teacherId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "topic" "RoomTopic" NOT NULL DEFAULT 'SUPERMARKET',
  "language" "Language" NOT NULL,
  "languageHelp" BOOLEAN NOT NULL DEFAULT false,
  "joinId" CHAR(8) NOT NULL UNIQUE,
  "joinUrl" TEXT NOT NULL,
  "qrCodeDataUrl" TEXT NOT NULL,
  "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Participant" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE CASCADE,
  "displayName" TEXT NOT NULL,
  "socketId" TEXT,
  "accessToken" TEXT UNIQUE,
  "status" "ParticipantStatus" NOT NULL DEFAULT 'WAITING',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Participant_roomId_displayName_key" UNIQUE ("roomId", "displayName")
);

CREATE TABLE "Item" (
  "id" TEXT PRIMARY KEY,
  "topic" "RoomTopic" NOT NULL DEFAULT 'SUPERMARKET',
  "imageUrl" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT "Item_topic_order_key" UNIQUE ("topic", "order")
);

CREATE TABLE "ItemTranslation" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "language" "Language" NOT NULL,
  "label" TEXT NOT NULL,
  "alternatives" TEXT[] NOT NULL,
  CONSTRAINT "ItemTranslation_itemId_language_key" UNIQUE ("itemId", "language")
);

CREATE TABLE "StudentAnswer" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE CASCADE,
  "participantId" TEXT NOT NULL REFERENCES "Participant"("id") ON DELETE CASCADE,
  "itemId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "language" "Language" NOT NULL,
  "submittedText" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentAnswer_participantId_itemId_key" UNIQUE ("participantId", "itemId")
);

CREATE TABLE "Account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId")
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
);

CREATE INDEX "Room_teacherId_status_idx" ON "Room"("teacherId", "status");
CREATE INDEX "Room_joinId_status_idx" ON "Room"("joinId", "status");
CREATE INDEX "StudentAnswer_roomId_participantId_idx" ON "StudentAnswer"("roomId", "participantId");

INSERT INTO "Item" ("id", "topic", "imageUrl", "order") VALUES
  ('item_apple', 'SUPERMARKET', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80', 1),
  ('item_bread', 'SUPERMARKET', 'https://images.unsplash.com/photo-1576186726115-4d51596775d1?auto=format&fit=crop&w=600&q=80', 2),
  ('item_milk', 'SUPERMARKET', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', 3);

INSERT INTO "ItemTranslation" ("id", "itemId", "language", "label", "alternatives") VALUES
  ('item_apple_de', 'item_apple', 'DE', 'Apfel', ARRAY['Äpfel']),
  ('item_apple_en', 'item_apple', 'EN', 'Apple', ARRAY['Apples']),
  ('item_apple_fr', 'item_apple', 'FR', 'Pomme', ARRAY['Pommes']),
  ('item_apple_es', 'item_apple', 'ES', 'Manzana', ARRAY['Manzanas']),
  ('item_bread_de', 'item_bread', 'DE', 'Brot', ARRAY['Laib Brot']),
  ('item_bread_en', 'item_bread', 'EN', 'Bread', ARRAY['Loaf of bread']),
  ('item_bread_fr', 'item_bread', 'FR', 'Pain', ARRAY['Baguette']),
  ('item_bread_es', 'item_bread', 'ES', 'Pan', ARRAY['Barra de pan']),
  ('item_milk_de', 'item_milk', 'DE', 'Milch', ARRAY[]::TEXT[]),
  ('item_milk_en', 'item_milk', 'EN', 'Milk', ARRAY[]::TEXT[]),
  ('item_milk_fr', 'item_milk', 'FR', 'Lait', ARRAY[]::TEXT[]),
  ('item_milk_es', 'item_milk', 'ES', 'Leche', ARRAY[]::TEXT[]);
