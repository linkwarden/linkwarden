-- CreateEnum
CREATE TYPE "AppMigrationStatus" AS ENUM ('APPLIED', 'PENDING', 'FAILED');

-- CreateTable
CREATE TABLE "AppMigration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AppMigrationStatus" NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppMigration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppMigration_name_key" ON "AppMigration"("name");
