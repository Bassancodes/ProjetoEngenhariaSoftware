import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CartItemPayload = {
  id?: number | string
  productId?: number | string
  quantity?: number | string
  selectedSize?: string | null
  selectedColor?: string | null
  cartItemId?: string | null
}

type NormalizedCartItem = {
  produtoId: number
  quantidade: number
  selectedSize: string | null
  selectedColor: string | null
  cartItemId: string | null
}

const DEFAULT_SIZE = 'Único'
const DEFAULT_COLOR = 'Padrão'
const PLACEHOLDER_IMAGE = '/placeholder.png'

const formatProductPrice = (preco: unknown): number => {
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

function normalizeCartItems(items: CartItemPayload[]): NormalizedCartItem[] {
  const normalized = items
    .map((item) => {
      const rawId = item.productId ?? item.id
      const produtoId =
        typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId

      const rawQuantity = item.quantity
      const quantidade =
        typeof rawQuantity === 'string'
          ? Number.parseInt(rawQuantity, 10)
          : rawQuantity

      if (
        !produtoId ||
        Number.isNaN(produtoId) ||
        !quantidade ||
        Number.isNaN(quantidade) ||
        quantidade <= 0
      ) {
        return null
      }

      return {
        produtoId,
        quantidade,
        selectedSize: item.selectedSize ?? null,
        selectedColor: item.selectedColor ?? null,
        cartItemId: item.cartItemId ?? null,
      }
    })
    .filter(Boolean) as NormalizedCartItem[]

  return normalized
}

function formatCartItem(
  item: {
    id: number
    quantidade: number
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
    selectedSize: metadata?.selectedSize ?? DEFAULT_SIZE,
    selectedColor: metadata?.selectedColor ?? DEFAULT_COLOR,
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

async function getOrCreateCarrinho(clienteId: number) {
  const existing = await prisma.carrinho.findFirst({
    where: { clienteId },
  })

  if (existing) return existing

  return prisma.carrinho.create({
    data: {
      clienteId,
    },
  })
}

export async function POST(request: NextRequest) {
    try {
      const body = await request.json()
      const { usuarioId, items } = body as {
        usuarioId?: string
        items?: CartItemPayload[]
      }
  
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
  
      const { clienteId, error } = await ensureCliente(usuarioId)
      if (error || !clienteId) {
        return error!
      }
  
      if (items.length === 0) {
        const carrinhoVazio = await getOrCreateCarrinho(clienteId)
  
        await prisma.itemCarrinho.deleteMany({
          where: { carrinhoId: carrinhoVazio.id },
        })
  
        return NextResponse.json(
          {
            message: 'Carrinho salvo com sucesso',
            carrinho: {
              id: carrinhoVazio.id,
              clienteId: carrinhoVazio.clienteId,
              createdAt: carrinhoVazio.createdAt,
              updatedAt: carrinhoVazio.updatedAt,
            },
            items: [],
          },
          { status: 200 }
        )
      }
  
      const normalizedItems = normalizeCartItems(items)
  
      if (normalizedItems.length === 0) {
        return NextResponse.json(
          { error: 'Nenhum item válido foi enviado' },
          { status: 400 }
        )
      }
  
      const produtoIds = Array.from(
        new Set(normalizedItems.map((item) => item.produtoId))
      )
  
      const produtos = await prisma.produto.findMany({
        where: { id: { in: produtoIds } },
        include: {
          categoria: true,
          imagens: true,
        },
      })
  
      if (produtos.length !== produtoIds.length) {
        const encontrados = new Set(produtos.map((produto: { id: number }) => produto.id))
        const faltantes = produtoIds.filter((id) => !encontrados.has(id))
  
        return NextResponse.json(
          {
            error: 'Alguns produtos não foram encontrados',
            missingProductIds: faltantes,
          },
          { status: 404 }
        )
      }
  
      const carrinho = await getOrCreateCarrinho(clienteId)
  
      const metadataByProduct = new Map<
        number,
        { selectedSize: string | null; selectedColor: string | null }
      >()
  
      for (const item of normalizedItems) {
        if (!metadataByProduct.has(item.produtoId)) {
          metadataByProduct.set(item.produtoId, {
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })
        }
      }
  
      const aggregatedItems = normalizedItems.reduce<
        Map<
          number,
          {
            produtoId: number
            quantidade: number
          }
        >
      >((acc, item) => {
        if (acc.has(item.produtoId)) {
          const current = acc.get(item.produtoId)!
          acc.set(item.produtoId, {
            produtoId: item.produtoId,
            quantidade: current.quantidade + item.quantidade,
          })
        } else {
          acc.set(item.produtoId, {
            produtoId: item.produtoId,
            quantidade: item.quantidade,
          })
        }
        return acc
      }, new Map())
  
      await prisma.$transaction(async (tx) => {
        await tx.itemCarrinho.deleteMany({
          where: { carrinhoId: carrinho.id },
        })
  
        if (aggregatedItems.size > 0) {
          await tx.itemCarrinho.createMany({
            data: Array.from(aggregatedItems.values()).map((item) => ({
              carrinhoId: carrinho.id,
              produtoId: item.produtoId,
              quantidade: item.quantidade,
            })),
          })
        }
      })
  
      const carrinhoAtualizado = await prisma.carrinho.findUnique({
        where: { id: carrinho.id },
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
      })
  
      const itensFormatados =
        carrinhoAtualizado?.itensCarrinho.map((item) =>
          formatCartItem(item, metadataByProduct.get(item.produto.id) ?? undefined)
        ) ?? []
  
      return NextResponse.json(
        {
          message: 'Carrinho salvo com sucesso',
          carrinho: carrinhoAtualizado
            ? {
                id: carrinhoAtualizado.id,
                clienteId: carrinhoAtualizado.clienteId,
                createdAt: carrinhoAtualizado.createdAt,
                updatedAt: carrinhoAtualizado.updatedAt,
              }
            : null,
          items: itensFormatados,
        },
        { status: 200 }
      )
  } catch (error: unknown) {
    console.error('Erro ao salvar carrinho:', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string' &&
      (error as { message: string }).message.includes('Item inválido')
    ) {
        return NextResponse.json(
        { error: (error as { message: string }).message },
          { status: 400 }
        )
      }
  
      return NextResponse.json(
        { error: 'Erro ao salvar carrinho. Tente novamente.' },
        { status: 500 }
      )
    }
  }