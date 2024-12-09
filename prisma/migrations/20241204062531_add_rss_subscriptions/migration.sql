-- CreateTable
CREATE TABLE "RssSubscription" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastBuildDate" TIMESTAMP(3),
    "collectionId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RssSubscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RssSubscription" ADD CONSTRAINT "RssSubscription_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
