import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatDecimal(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  if (value == null) return 0
  if (typeof value === 'bigint') return Number(value)
  return 0
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    PENDENTE_PAGAMENTO: 'Pendente de Pagamento',
    PENDENTE_ENVIO: 'Pendente de Envio',
    EM_TRANSITO: 'Em Trânsito',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  }

  return map[status] ?? status
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
        { error: 'Apenas clientes podem listar pedidos' },
        { status: 403 }
      ),
      clienteId: null,
    }
  }

  return { clienteId: usuario.cliente.id, error: null }
}

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

    const { clienteId, error } = await ensureCliente(usuarioId)
    if (error || !clienteId) {
      return error!
    }

    const pedidos = await prisma.pedido.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
      include: {
        lojista: {
          select: {
            id: true,
            empresa: true,
          },
        },
        itensPedido: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                imagens: {
                  select: { url: true },
                },
              },
            },
          },
        },
        pagamentos: {
          select: {
            id: true,
            valor: true,
            status: true,
            tipoPagamento: true,
            createdAt: true,
          },
        },
      },
    })

    if (pedidos.length === 0) {
      return NextResponse.json(
        {
          message: 'Nenhum pedido encontrado para o cliente',
          orders: [],
        },
        { status: 200 }
      )
    }

    const orders = pedidos.map((pedido) => {
      const total = pedido.itensPedido.reduce((acc, item) => {
        const unit = formatDecimal(item.precoUnitario)
        return acc + unit * item.quantidade
      }, 0)

      return {
        id: pedido.id,
        status: pedido.status,
        statusLabel: translateStatus(pedido.status),
        createdAt: pedido.createdAt,
        lojista: pedido.lojista?.empresa ?? null,
        total,
        itens: pedido.itensPedido.map((item) => ({
          id: item.id,
          produtoId: item.produtoId,
          nomeProduto: item.produto.nome,
          quantidade: item.quantidade,
          precoUnitario: formatDecimal(item.precoUnitario),
          subtotal: formatDecimal(item.precoUnitario) * item.quantidade,
          imagem: item.produto.imagens[0]?.url ?? null,
        })),
        pagamentos: pedido.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          valor: formatDecimal(pagamento.valor),
          status: pagamento.status,
          tipoPagamento: pagamento.tipoPagamento,
          createdAt: pagamento.createdAt,
        })),
      }
    })

    return NextResponse.json(
      {
        message: 'Pedidos recuperados com sucesso',
        orders,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao listar pedidos:', error)

    return NextResponse.json(
      { error: 'Erro ao listar pedidos. Tente novamente.' },
      { status: 500 }
    )
  }
}


