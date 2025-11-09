import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/cart - Salvar itens do carrinho do cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId, items } = body

    // Validação dos campos obrigatórios
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Itens do carrinho são obrigatórios e devem ser um array' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e é um cliente
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        cliente: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (usuario.tipoUsuario !== 'CLIENTE' || !usuario.cliente) {
      return NextResponse.json(
        { error: 'Apenas clientes podem ter carrinho' },
        { status: 403 }
      )
    }

    const clienteId = usuario.cliente.id

    // Buscar ou criar carrinho para o cliente
    let carrinho = await prisma.carrinho.findFirst({
      where: { clienteId },
      include: {
        itensCarrinho: true,
      },
    })

    if (!carrinho) {
      carrinho = await prisma.carrinho.create({
        data: {
          clienteId,
        },
        include: {
          itensCarrinho: true,
        },
      })
    }

    // Usar transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // Remover todos os itens antigos do carrinho
      await tx.itemCarrinho.deleteMany({
        where: { carrinhoId: carrinho!.id },
      })

      // Adicionar novos itens ao carrinho
      if (items.length > 0) {
        // Validar e preparar os itens
        const itensParaSalvar = items.map((item: any) => {
          // Validar campos obrigatórios
          if (!item.id || !item.quantity || item.quantity <= 0) {
            throw new Error(
              `Item inválido: produto ID e quantidade são obrigatórios`
            )
          }

          // Verificar se o produto existe
          // Nota: Não vamos validar aqui para melhor performance,
          // mas você pode adicionar validação se necessário

          return {
            carrinhoId: carrinho!.id,
            produtoId: item.id,
            quantidade: item.quantity,
          }
        })

        // Criar todos os itens
        await tx.itemCarrinho.createMany({
          data: itensParaSalvar,
        })
      }
    })

    // Buscar o carrinho atualizado com os itens
    const carrinhoAtualizado = await prisma.carrinho.findUnique({
      where: { id: carrinho.id },
      include: {
        itensCarrinho: {
          include: {
            produto: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Carrinho salvo com sucesso',
        carrinho: carrinhoAtualizado,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro ao salvar carrinho:', error)

    // Tratar erros específicos
    if (error.message && error.message.includes('Item inválido')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao salvar carrinho. Tente novamente.' },
      { status: 500 }
    )
  }
}

// GET /api/cart - Buscar carrinho do cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e é um cliente
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        cliente: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (usuario.tipoUsuario !== 'CLIENTE' || !usuario.cliente) {
      return NextResponse.json(
        { error: 'Apenas clientes podem ter carrinho' },
        { status: 403 }
      )
    }

    const clienteId = usuario.cliente.id

    // Buscar carrinho do cliente
    const carrinho = await prisma.carrinho.findFirst({
      where: { clienteId },
      include: {
        itensCarrinho: {
          include: {
            produto: {
              include: {
                categoria: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Pegar o carrinho mais recente
      },
    })

    if (!carrinho) {
      return NextResponse.json(
        {
          message: 'Carrinho não encontrado',
          carrinho: null,
          items: [],
        },
        { status: 200 }
      )
    }

    // Transformar os itens para o formato esperado pelo frontend
    const items = carrinho.itensCarrinho.map((item) => ({
      id: item.produto.id,
      name: item.produto.nome,
      price: Number(item.produto.preco),
      image: `/public/${item.produto.nome.toLowerCase().replace(/\s+/g, '-')}.png`, // Ajustar conforme necessário
      category: item.produto.categoria.nome,
      quantity: item.quantidade,
      cartItemId: `${item.produto.id}-${item.id}`, // ID temporário
    }))

    return NextResponse.json(
      {
        message: 'Carrinho recuperado com sucesso',
        carrinho: {
          id: carrinho.id,
          clienteId: carrinho.clienteId,
          createdAt: carrinho.createdAt,
          updatedAt: carrinho.updatedAt,
        },
        items,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro ao buscar carrinho:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar carrinho. Tente novamente.' },
      { status: 500 }
    )
  }
}

