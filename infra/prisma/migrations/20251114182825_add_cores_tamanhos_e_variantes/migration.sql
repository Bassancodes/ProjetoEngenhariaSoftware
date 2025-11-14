/*
  Warnings:

  - You are about to drop the column `cor` on the `Produto` table. All the data in the column will be lost.
  - The `tamanhos` column on the `Produto` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ItemCarrinho" ADD COLUMN     "corSelecionada" TEXT,
ADD COLUMN     "tamanhoSelecionado" TEXT;

-- AlterTable
ALTER TABLE "ItemPedido" ADD COLUMN     "corSelecionada" TEXT,
ADD COLUMN     "tamanhoSelecionado" TEXT;

-- AlterTable
ALTER TABLE "Produto" DROP COLUMN "cor",
ADD COLUMN     "cores" JSONB,
ADD COLUMN     "estoquePorVariante" JSONB,
DROP COLUMN "tamanhos",
ADD COLUMN     "tamanhos" JSONB;
