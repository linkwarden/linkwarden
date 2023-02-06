-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAndCollection" (
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "UserAndCollection_pkey" PRIMARY KEY ("userId","collectionId")
);

-- AddForeignKey
ALTER TABLE "UserAndCollection" ADD CONSTRAINT "UserAndCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAndCollection" ADD CONSTRAINT "UserAndCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
