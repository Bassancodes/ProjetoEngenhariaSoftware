import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CreateOrderRequest = {
  usuarioId?: string
}

async function ensureCliente(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      cliente: true,
    },
  })

  if (!usuario) {
    return {
      error: NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      ),
      clienteId: null,
    }
  }

  if (usuario.tipoUsuario !== 'CLIENTE' || !usuario.cliente) {
    return {
      error: NextResponse.json(
        { error: 'Apenas clientes podem criar pedidos' },
        { status: 403 }
      ),
      clienteId: null,
    }
  }

  return { clienteId: usuario.cliente.id, error: null }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderRequest
    const { usuarioId } = body

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    const { clienteId, error } = await ensureCliente(usuarioId)
    if (error || !clienteId) {
      return error!
    }

    const carrinho = await prisma.carrinho.findFirst({
      where: { clienteId },
      orderBy: { updatedAt: 'desc' },
      include: {
        itensCarrinho: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                preco: true,
                lojistaId: true,
              },
            },
          },
        },
      },
    })

    if (!carrinho || carrinho.itensCarrinho.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho vazio ou não encontrado' },
        { status: 400 }
      )
    }

    const lojistaIds = new Set(
      carrinho.itensCarrinho.map(
        (item: { produto: { lojistaId: number } }) => item.produto.lojistaId
      )
    )

    if (lojistaIds.size === 0) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o lojista dos produtos' },
        { status: 400 }
      )
    }

    if (lojistaIds.size > 1) {
      return NextResponse.json(
        {
          error:
            'Carrinho contém itens de lojistas diferentes. Separe os itens por lojista antes de continuar.',
        },
        { status: 400 }
      )
    }

    const lojistaId = carrinho.itensCarrinho[0].produto.lojistaId

    const totalAmount = carrinho.itensCarrinho.reduce((total, item) => {
      const unitPrice = Number(item.produto.preco)
      return total + unitPrice * item.quantidade
    }, 0 as number)

    const pedido = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.pedido.create({
        data: {
          clienteId,
          lojistaId,
          status: 'PENDENTE_PAGAMENTO',
          itensPedido: {
            create: carrinho.itensCarrinho.map(
              (
                item: {
                  produtoId: number
                  quantidade: number
                  produto: { preco: any }
                }
              ) => ({
                produto: { connect: { id: item.produtoId } },
                quantidade: item.quantidade,
                precoUnitario: item.produto.preco,
              })
            ),
          },
        },
        include: {
          itensPedido: {
            include: {
              produto: {
                select: {
                  id: true,
                  nome: true,
                  preco: true,
                },
              },
            },
          },
        },
      })

      await tx.itemCarrinho.deleteMany({
        where: { carrinhoId: carrinho.id },
      })

      return createdOrder
    })

    return NextResponse.json(
      {
        message: 'Pedido criado com sucesso',
        order: {
          id: pedido.id,
          status: pedido.status,
          createdAt: pedido.createdAt,
          totalAmount,
          itens: pedido.itensPedido.map(
            (
              item: {
                id: number
                produtoId: number
                quantidade: number
                precoUnitario: unknown
                produto: { nome: string }
              }
            ) => ({
              id: item.id,
              produtoId: item.produtoId,
              nomeProduto: item.produto.nome,
              quantidade: item.quantidade,
              precoUnitario: Number(item.precoUnitario),
              subtotal: Number(item.precoUnitario) * item.quantidade,
            })
          ),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar pedido:', error)

    return NextResponse.json(
      { error: 'Erro ao criar pedido. Tente novamente.' },
      { status: 500 }
    )
  }
}

