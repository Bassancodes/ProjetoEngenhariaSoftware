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
  // Handle Prisma Decimal type
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  // Handle Prisma Decimal toString
  if (typeof value === 'object' && value !== null) {
    const str = value.toString()
    const parsed = Number.parseFloat(str)
    return Number.isNaN(parsed) ? 0 : parsed
  }
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

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const pedidoId = Number.parseInt(id, 10)

    if (Number.isNaN(pedidoId)) {
      return NextResponse.json(
        { error: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Buscar usuário ID da query string para validação
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário é cliente
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        cliente: true,
      },
    })

    if (!usuario || usuario.tipoUsuario !== 'CLIENTE' || !usuario.cliente) {
      return NextResponse.json(
        { error: 'Apenas clientes podem visualizar pedidos' },
        { status: 403 }
      )
    }

    const clienteId = usuario.cliente.id

    // Buscar o pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: {
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
        itensPedido: {
          select: {
            id: true,
            produtoId: true,
            quantidade: true,
            precoUnitario: true,
            produto: {
              select: {
                id: true,
                nome: true,
                preco: true,
                descricao: true,
                categoria: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
                imagens: {
                  select: { 
                    id: true,
                    url: true,
                    ordem: true,
                  },
                  orderBy: {
                    ordem: 'asc',
                  },
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

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o pedido pertence ao cliente
    if (pedido.clienteId !== clienteId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para visualizar este pedido' },
        { status: 403 }
      )
    }

    // Calcular o total
    const total = pedido.itensPedido.reduce(
      (
        acc: number,
        item: {
          quantidade: number
          precoUnitario: unknown
        }
      ) => {
        const unit = formatDecimal(item.precoUnitario)
        return acc + unit * item.quantidade
      },
      0
    )

    // Calcular total de pagamentos
    const totalPago = pedido.pagamentos.reduce(
      (acc: number, pagamento: { valor: unknown; status: string }) => {
        if (pagamento.status === 'PAGO') {
          return acc + formatDecimal(pagamento.valor)
        }
        return acc
      },
      0
    )

    // Usar endereço salvo no pedido, ou fallback para endereço do cliente (compatibilidade com pedidos antigos)
    const enderecoEntrega = pedido.enderecoEntrega 
      ? pedido.enderecoEntrega as {
          cep?: string
          logradouro?: string
          numero?: string
          complemento?: string
          bairro?: string
          cidade?: string
          uf?: string
          nomeCompleto?: string
          email?: string
          telefone?: string
        }
      : null

    const orderDetails = {
      id: pedido.id,
      status: pedido.status,
      statusLabel: translateStatus(pedido.status),
      createdAt: pedido.createdAt,
      updatedAt: pedido.updatedAt,
      cliente: {
        id: pedido.cliente.id,
        nome: pedido.cliente.usuario.nome,
        email: pedido.cliente.usuario.email,
        endereco: pedido.cliente.endereco,
      },
      enderecoEntrega: enderecoEntrega || {
        // Fallback para pedidos antigos sem endereço salvo
        logradouro: pedido.cliente.endereco,
        cep: null,
        numero: null,
        complemento: null,
        bairro: null,
        cidade: null,
        uf: null,
        nomeCompleto: pedido.cliente.usuario.nome,
        email: pedido.cliente.usuario.email,
        telefone: null,
      },
      lojista: {
        id: pedido.lojista.id,
        empresa: pedido.lojista.empresa,
        nome: pedido.lojista.usuario.nome,
        email: pedido.lojista.usuario.email,
      },
      itens: pedido.itensPedido.map(
        (
          item: {
            id: number
            produtoId: number
            quantidade: number
            precoUnitario: unknown
            produto: {
              id: number
              nome: string
              preco: unknown
              descricao: string | null
              categoria: { id: number; nome: string }
              imagens: Array<{ id: number; url: string; ordem: number }>
            }
          }
        ) => ({
          id: item.id,
          produtoId: item.produtoId,
          nomeProduto: item.produto.nome,
          descricao: item.produto.descricao,
          categoria: item.produto.categoria.nome,
          quantidade: item.quantidade,
          precoUnitario: formatDecimal(item.precoUnitario),
          precoAtual: formatDecimal(item.produto.preco),
          subtotal: formatDecimal(item.precoUnitario) * item.quantidade,
          imagens: item.produto.imagens.map((img) => ({
            id: img.id,
            url: img.url,
            ordem: img.ordem,
          })),
          imagemPrincipal: item.produto.imagens[0]?.url ?? null,
        })
      ),
      total,
      totalPago,
      saldoRestante: total - totalPago,
      pagamentos: pedido.pagamentos.map(
        (
          pagamento: {
            id: number
            valor: unknown
            status: string
            tipoPagamento: string
            createdAt: Date
          }
        ) => ({
          id: pagamento.id,
          valor: formatDecimal(pagamento.valor),
          status: pagamento.status,
          tipoPagamento: pagamento.tipoPagamento,
          createdAt: pagamento.createdAt,
        })
      ),
    }

    return NextResponse.json(
      {
        message: 'Detalhes do pedido recuperados com sucesso',
        order: orderDetails,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do pedido. Tente novamente.' },
      { status: 500 }
    )
  }
}

