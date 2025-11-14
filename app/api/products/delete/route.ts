import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

// DELETE /api/products/delete - Excluir produto (apenas do próprio lojista)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId, produtoId } = body as {
      usuarioId?: string
      produtoId?: number | string
    }

    if (!usuarioId || !produtoId) {
      return NextResponse.json(
        { error: 'usuarioId e produtoId são obrigatórios' },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { lojista: true },
    })
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (usuario.tipoUsuario !== 'LOJISTA' || !usuario.lojista) {
      return NextResponse.json(
        { error: 'Apenas lojistas podem excluir produtos' },
        { status: 403 }
      )
    }

    const produtoIdNum =
      typeof produtoId === 'number'
        ? produtoId
        : typeof produtoId === 'string'
          ? Number(produtoId.trim())
          : Number.NaN

    if (!Number.isInteger(produtoIdNum) || produtoIdNum <= 0) {
      return NextResponse.json(
        { error: 'ID do produto deve ser um número válido' },
        { status: 400 }
      )
    }

    // Checar ownership
    const produto = await prisma.produto.findUnique({
      where: { id: produtoIdNum },
      select: {
        id: true,
        lojistaId: true,
        ativo: true,
        _count: {
          select: {
            itensPedido: true,
            itensCarrinho: true,
          },
        },
      },
    })
    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }
    if (produto.lojistaId !== usuario.lojista.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para excluir este produto' },
        { status: 403 }
      )
    }

    if (!produto.ativo) {
      // Já está inativo; ainda remover itens de carrinho por garantia
      await prisma.itemCarrinho.deleteMany({ where: { produtoId: produtoIdNum } })
      return NextResponse.json(
        { message: 'Produto já estava inativo. Itens em carrinho removidos.' },
        { status: 200 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Remover itens do carrinho relacionados ao produto
      await tx.itemCarrinho.deleteMany({ where: { produtoId: produtoIdNum as number } })
      // Marcar produto como inativo e zerar estoque
      await tx.produto.update({
        where: { id: produtoIdNum },
        data: {
          ativo: false,
          estoque: 0,
        },
      })
    })

    return NextResponse.json(
      { message: 'Produto marcado como inativo e removido dos carrinhos.' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Erro ao excluir produto:', error)
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
      // Violação de restrição de chave estrangeira
      return NextResponse.json(
        { error: 'Produto não pode ser excluído devido a vínculos existentes.' },
        { status: 409 }
      )
    }
    const isDev = process.env.NODE_ENV === 'development'
    const errorMessage =
      isDev && typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message || 'Erro ao excluir produto.'
        : 'Erro ao excluir produto. Tente novamente.'
    return NextResponse.json({ error: errorMessage, ...(isDev && { details: error }) }, { status: 500 })
  }
}


