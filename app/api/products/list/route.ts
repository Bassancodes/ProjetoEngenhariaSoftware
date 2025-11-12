import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/list - Listar produtos
// Se for cliente: lista todos os produtos
// Se for lojista: lista apenas os produtos do lojista logado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')

    // Se não houver usuarioId, retornar todos os produtos (para clientes não autenticados ou catálogo público)
    if (!usuarioId) {
      const produtos = await prisma.produto.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(
        {
          produtos,
          total: produtos.length,
        },
        { status: 200 }
      )
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        cliente: true,
        lojista: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Se for cliente, retornar todos os produtos
    if (usuario.tipoUsuario === 'CLIENTE') {
      const produtos = await prisma.produto.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(
        {
          produtos,
          total: produtos.length,
        },
        { status: 200 }
      )
    }

    // Se for lojista, retornar apenas os produtos do lojista
    if (usuario.tipoUsuario === 'LOJISTA' && usuario.lojista) {
      const produtos = await prisma.produto.findMany({
        where: {
          lojistaId: usuario.lojista.id,
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
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(
        {
          produtos,
          total: produtos.length,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Tipo de usuário inválido' },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error('Erro ao listar produtos:', error)
    
    return NextResponse.json(
      { error: 'Erro ao listar produtos. Tente novamente.' },
      { status: 500 }
    )
  }
}

