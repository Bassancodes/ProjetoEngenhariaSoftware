/*
  Warnings:

  - Added the required column `lojistaId` to the `Produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "lojistaId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
