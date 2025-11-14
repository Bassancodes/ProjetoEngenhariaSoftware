-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "enderecoEntrega" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "cor" TEXT,
ADD COLUMN     "tamanhos" TEXT;
