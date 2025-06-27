-- AlterTable
ALTER TABLE "_LinkToTag" ADD CONSTRAINT "_LinkToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_LinkToTag_AB_unique";

-- AlterTable
ALTER TABLE "_PinnedLinks" ADD CONSTRAINT "_PinnedLinks_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_PinnedLinks_AB_unique";
