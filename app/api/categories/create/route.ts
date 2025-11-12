import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/categories/create - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, descricao } = body

    // Validação dos campos obrigatórios
    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe uma categoria com o mesmo nome
    const categoriaExistente = await prisma.categoria.findFirst({
      where: {
        nome: {
          equals: nome.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (categoriaExistente) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 409 }
      )
    }

    // Criar a categoria
    const categoria = await prisma.categoria.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
      },
    })

    return NextResponse.json(
      {
        message: 'Categoria criada com sucesso',
        categoria,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Erro ao criar categoria:', error)
    
    return NextResponse.json(
      { error: 'Erro ao criar categoria. Tente novamente.' },
      { status: 500 }
    )
  }
}

