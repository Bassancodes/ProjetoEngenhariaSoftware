import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/list - Listar todas as categorias
export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: {
        nome: 'asc',
      },
    })

    return NextResponse.json(
      {
        categorias,
        total: categorias.length,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Erro ao listar categorias:', error)
    
    return NextResponse.json(
      { error: 'Erro ao listar categorias. Tente novamente.' },
      { status: 500 }
    )
  }
}

