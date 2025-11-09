import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/products/register - Criar produto (apenas lojistas)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId, nome, preco, categoriaId, descricao } = body

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

    // Criar o produto usando os IDs diretamente
    const produto = await prisma.produto.create({
      data: {
        nome,
        preco: precoDecimal,
        categoriaId: categoriaIdNum,
        descricao: descricao || null,
        lojistaId: lojistaId,
      },
      include: {
        categoria: true,
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
  } catch (error: any) {
    console.error('Erro ao criar produto:', error)
    
    // Retornar mensagem de erro mais específica
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um produto com este nome' },
        { status: 409 }
      )
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Categoria ou lojista não encontrado' },
        { status: 404 }
      )
    }
    
    // Retornar mensagem de erro detalhada em desenvolvimento
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Erro ao criar produto. Tente novamente.'
      : 'Erro ao criar produto. Tente novamente.'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: error })
      },
      { status: 500 }
    )
  }
}

