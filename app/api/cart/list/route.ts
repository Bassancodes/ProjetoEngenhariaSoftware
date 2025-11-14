import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_SIZE = 'Único'
const DEFAULT_COLOR = 'Padrão'
const PLACEHOLDER_IMAGE = '/placeholder.png'

const formatProductPrice = (preco: unknown) => {
  if (typeof preco === 'number') return preco
  if (typeof preco === 'string') {
    const parsed = Number.parseFloat(preco)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  if (preco == null) return 0
  if (typeof preco === 'bigint') return Number(preco)
  // Prisma Decimal or similar objects exposing toNumber/toString
  if (typeof preco === 'object') {
    const maybeDecimal = preco as { toNumber?: () => number; toString?: () => string }
    if (typeof maybeDecimal.toNumber === 'function') {
      const value = maybeDecimal.toNumber()
      return Number.isNaN(value) ? 0 : value
    }
    if (typeof maybeDecimal.toString === 'function') {
      const parsed = Number.parseFloat(maybeDecimal.toString())
      return Number.isNaN(parsed) ? 0 : parsed
    }
  }
  return 0
}

function formatCartItem(
  item: {
    id: number
    quantidade: number
    corSelecionada?: string | null
    tamanhoSelecionado?: string | null
    produto: {
      id: number
      nome: string
      preco: unknown | null
      categoria: { nome: string }
      imagens: Array<{ url: string }>
    }
  },
  metadata?: { selectedSize: string | null; selectedColor: string | null }
) {
  const images =
    item.produto.imagens.length > 0
      ? item.produto.imagens.map((img) => img.url)
      : []

  return {
    id: item.produto.id,
    name: item.produto.nome,
    price: formatProductPrice(item.produto.preco),
    image: images[0] ?? PLACEHOLDER_IMAGE,
    images,
    category: item.produto.categoria.nome,
    quantity: item.quantidade,
    cartItemId: `${item.produto.id}-${item.id}`,
    selectedSize: metadata?.selectedSize ?? item.tamanhoSelecionado ?? DEFAULT_SIZE,
    selectedColor: metadata?.selectedColor ?? item.corSelecionada ?? DEFAULT_COLOR,
  }
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
        { error: 'Apenas clientes podem ter carrinho' },
        { status: 403 }
      ),
      clienteId: null,
    }
  }

  return { clienteId: usuario.cliente.id, error: null }
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

    const { clienteId, error } = await ensureCliente(usuarioId)
    if (error || !clienteId) {
      return error!
    }

    // Buscar carrinho do cliente
    const carrinho = await prisma.carrinho.findFirst({
      where: { clienteId },
      include: {
        itensCarrinho: {
          include: {
            produto: {
              include: {
                categoria: true,
                imagens: true,
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
    const items = carrinho.itensCarrinho.map(
      (item: Parameters<typeof formatCartItem>[0]) => {
        const metadata = {
          selectedSize: item.tamanhoSelecionado || null,
          selectedColor: item.corSelecionada || null,
        }
        return formatCartItem(item, metadata)
      }
    )

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
  } catch (error: unknown) {
    console.error('Erro ao buscar carrinho:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar carrinho. Tente novamente.' },
      { status: 500 }
    )
  }
}

