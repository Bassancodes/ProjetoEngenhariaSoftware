import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

// PUT /api/products/update - Atualizar produto (apenas do próprio lojista)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      usuarioId,
      produtoId,
      nome,
      preco,
      categoriaId,
      descricao,
      imagens,
      estoque,
      ativo,
    } = body as {
      usuarioId?: string
      produtoId?: number | string
      nome?: string
      preco?: number | string
      categoriaId?: number | string
      descricao?: string | null
      imagens?: string[]
      estoque?: number | string
      ativo?: boolean | string | number
    }

    // Validações básicas
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!produtoId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar usuário e tipo
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { lojista: true },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (usuario.tipoUsuario !== 'LOJISTA' || !usuario.lojista) {
      return NextResponse.json(
        { error: 'Apenas lojistas podem atualizar produtos' },
        { status: 403 }
      )
    }

    const produtoIdNum = typeof produtoId === 'string' ? parseInt(produtoId) : produtoId
    if (isNaN(produtoIdNum as number)) {
      return NextResponse.json(
        { error: 'ID do produto deve ser um número válido' },
        { status: 400 }
      )
    }

    // Buscar produto e verificar ownership
    const produtoExistente = await prisma.produto.findUnique({
      where: { id: produtoIdNum as number },
      include: { imagens: true },
    })

    if (!produtoExistente) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    if (produtoExistente.lojistaId !== usuario.lojista.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para atualizar este produto' },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const dataToUpdate: any = {}
    if (typeof nome === 'string' && nome.trim()) dataToUpdate.nome = nome.trim()
    if (preco !== undefined) {
      const precoDecimal = typeof preco === 'string' ? parseFloat(preco) : preco
      if (isNaN(precoDecimal as number) || (precoDecimal as number) <= 0) {
        return NextResponse.json(
          { error: 'Preço deve ser um número positivo' },
          { status: 400 }
        )
      }
      dataToUpdate.preco = precoDecimal
    }
    if (categoriaId !== undefined) {
      const categoriaIdNum = typeof categoriaId === 'string' ? parseInt(categoriaId) : categoriaId
      if (isNaN(categoriaIdNum as number)) {
        return NextResponse.json(
          { error: 'ID da categoria deve ser um número válido' },
          { status: 400 }
        )
      }
      // Garantir que categoria existe
      const categoria = await prisma.categoria.findUnique({ where: { id: categoriaIdNum as number } })
      if (!categoria) {
        return NextResponse.json(
          { error: 'Categoria não encontrada' },
          { status: 404 }
        )
      }
      dataToUpdate.categoriaId = categoriaIdNum
    }
    if (descricao !== undefined) {
      dataToUpdate.descricao = descricao && typeof descricao === 'string' ? descricao.trim() : null
    }

    if (estoque !== undefined) {
      const parsedEstoque =
        typeof estoque === 'string'
          ? parseInt(estoque, 10)
          : typeof estoque === 'number'
            ? Math.floor(estoque)
            : NaN
      if (isNaN(parsedEstoque) || parsedEstoque < 0) {
        return NextResponse.json(
          { error: 'Estoque deve ser um número inteiro maior ou igual a zero' },
          { status: 400 }
        )
      }
      dataToUpdate.estoque = parsedEstoque
    }

    if (ativo !== undefined) {
      let parsedAtivo: boolean | null = null
      if (typeof ativo === 'boolean') {
        parsedAtivo = ativo
      } else if (typeof ativo === 'string') {
        const normalized = ativo.trim().toLowerCase()
        if (['true', '1'].includes(normalized)) {
          parsedAtivo = true
        } else if (['false', '0'].includes(normalized)) {
          parsedAtivo = false
        }
      } else if (typeof ativo === 'number') {
        parsedAtivo = ativo === 1
      }

      if (parsedAtivo === null) {
        return NextResponse.json(
          { error: 'Valor de ativo inválido' },
          { status: 400 }
        )
      }

      dataToUpdate.ativo = parsedAtivo
    }

    // Atualização transacional do produto e imagens (se enviadas)
    const updated = await prisma.$transaction(async (tx) => {
      // Atualizar dados primários
      const produtoAtualizado = await tx.produto.update({
        where: { id: produtoIdNum as number },
        data: dataToUpdate,
      })

      // Se imagens foram enviadas, substituir conjunto
      if (Array.isArray(imagens)) {
        // validação das URLs
        const imagensValidadas: Array<{ url: string; ordem: number }> = []
        for (let i = 0; i < imagens.length; i++) {
          const url = imagens[i]
          if (typeof url !== 'string' || !url.trim()) {
            throw new Error(`URL da imagem ${i + 1} é inválida`)
          }
          try {
            const u = new URL(url.trim())
            if (!['http:', 'https:'].includes(u.protocol)) {
              throw new Error(`URL da imagem ${i + 1} deve ser pública (http ou https)`)
            }
          } catch {
            throw new Error(`URL da imagem ${i + 1} não é válida`)
          }
          imagensValidadas.push({ url: url.trim(), ordem: i })
        }

        // Remover imagens antigas e inserir novas
        await tx.imagemProduto.deleteMany({ where: { produtoId: produtoIdNum as number } })
        if (imagensValidadas.length > 0) {
          await tx.imagemProduto.createMany({
            data: imagensValidadas.map((img) => ({
              produtoId: produtoIdNum as number,
              url: img.url,
              ordem: img.ordem,
            })),
          })
        }
      }

      // Retornar o produto completo
      return tx.produto.findUnique({
        where: { id: produtoIdNum as number },
        include: {
          categoria: true,
          imagens: { orderBy: { ordem: 'asc' } },
          lojista: {
            include: {
              usuario: { select: { id: true, nome: true, email: true } },
            },
          },
        },
      })
    })

    return NextResponse.json(
      { message: 'Produto atualizado com sucesso', produto: updated },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Erro ao atualizar produto:', error)

    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflito ao atualizar produto (valores únicos duplicados)' },
        { status: 409 }
      )
    }

    const isDev = process.env.NODE_ENV === 'development'
    const errorMessage =
      isDev && typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message || 'Erro ao atualizar produto'
        : 'Erro ao atualizar produto. Tente novamente.'

    return NextResponse.json(
      { error: errorMessage, ...(process.env.NODE_ENV === 'development' && { details: error }) },
      { status: 500 }
    )
  }
}


