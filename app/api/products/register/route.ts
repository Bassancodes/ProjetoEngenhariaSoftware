import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

// POST /api/products/register - Criar produto (apenas lojistas)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId, nome, preco, categoriaId, descricao, imagens } = body

    // Validação dos campos obrigatórios
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!nome || !preco || !categoriaId) {
      return NextResponse.json(
        { error: 'Nome, preço e categoria são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e é um lojista
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        lojista: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (usuario.tipoUsuario !== 'LOJISTA' || !usuario.lojista) {
      return NextResponse.json(
        { error: 'Apenas lojistas podem criar produtos' },
        { status: 403 }
      )
    }

    // Validar e converter categoriaId para número
    const categoriaIdNum = parseInt(categoriaId)
    if (isNaN(categoriaIdNum)) {
      return NextResponse.json(
        { error: 'ID da categoria deve ser um número válido' },
        { status: 400 }
      )
    }

    // Verificar se a categoria existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaIdNum },
    })

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Validar preço
    const precoDecimal = parseFloat(preco)
    if (isNaN(precoDecimal) || precoDecimal <= 0) {
      return NextResponse.json(
        { error: 'Preço deve ser um número positivo' },
        { status: 400 }
      )
    }

    const lojistaId = usuario.lojista.id

    // Validar imagens se fornecidas
    const imagensValidadas: Array<{ url: string; ordem: number }> = []
    if (imagens && Array.isArray(imagens)) {
      // Validar cada URL de imagem
      for (let i = 0; i < imagens.length; i++) {
        const url = imagens[i]
        if (typeof url !== 'string' || !url.trim()) {
          return NextResponse.json(
            { error: `URL da imagem ${i + 1} é inválida` },
            { status: 400 }
          )
        }

        // Verificar se é uma URL pública válida (http ou https)
        try {
          const urlObj = new URL(url.trim())
          if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return NextResponse.json(
              { error: `URL da imagem ${i + 1} deve ser uma URL pública (http ou https)` },
              { status: 400 }
            )
          }
        } catch {
          return NextResponse.json(
            { error: `URL da imagem ${i + 1} não é uma URL válida` },
            { status: 400 }
          )
        }

        imagensValidadas.push({
          url: url.trim(),
          ordem: i,
        })
      }
    }

    // Criar o produto com as imagens
    const produto = await prisma.produto.create({
      data: {
        nome,
        preco: precoDecimal,
        categoriaId: categoriaIdNum,
        descricao: descricao || null,
        lojistaId: lojistaId,
        imagens: {
          create: imagensValidadas,
        },
      },
      include: {
        categoria: true,
        imagens: {
          orderBy: {
            ordem: 'asc',
          },
        },
        lojista: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Produto criado com sucesso',
        produto,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Erro ao criar produto:', error)
    
    // Retornar mensagem de erro mais específica
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um produto com este nome' },
        { status: 409 }
      )
    }
    
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Categoria ou lojista não encontrado' },
        { status: 404 }
      )
    }
    
    // Retornar mensagem de erro detalhada em desenvolvimento
    const isDev = process.env.NODE_ENV === 'development'
    const errorMessage = isDev
      ? (typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
            ? (error as { message: string }).message
            : 'Erro ao criar produto. Tente novamente.')
      : 'Erro ao criar produto. Tente novamente.'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isDev && { details: error })
      },
      { status: 500 }
    )
  }
}

