import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatDecimal(value: unknown): number {
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

async function ensureLojista(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      lojista: true,
    },
  })

  if (!usuario) {
    return {
      error: NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      ),
      lojistaId: null,
    }
  }

  if (usuario.tipoUsuario !== 'LOJISTA' || !usuario.lojista) {
    return {
      error: NextResponse.json(
        { error: 'Apenas lojistas podem acessar o histórico de vendas' },
        { status: 403 }
      ),
      lojistaId: null,
    }
  }

  return { lojistaId: usuario.lojista.id, error: null }
}

type VarianteVenda = {
  cor: string | null
  tamanho: string | null
  quantidade: number
}

type ProdutoVendas = {
  produtoId: number
  nome: string
  categoria: string
  imagemPrincipal: string | null
  quantidadeTotalVendida: number
  receitaTotal: number
  numeroPedidos: number
  precoMedio: number
  ultimaVenda: Date | null
  ativo: boolean
  variantesMaisVendidas: VarianteVenda[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')
    const categoriaId = searchParams.get('categoriaId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    const { lojistaId, error } = await ensureLojista(usuarioId)
    if (error || !lojistaId) {
      return error!
    }

    // Construir filtros para os pedidos
    const pedidoFilters: any = {
      lojistaId,
    }

    // Adicionar filtro de data se fornecido
    if (dataInicio || dataFim) {
      pedidoFilters.createdAt = {}
      if (dataInicio) {
        pedidoFilters.createdAt.gte = new Date(dataInicio)
      }
      if (dataFim) {
        // Adicionar 23:59:59 ao fim do dia
        const fimDate = new Date(dataFim)
        fimDate.setHours(23, 59, 59, 999)
        pedidoFilters.createdAt.lte = fimDate
      }
    }

    // Buscar todos os pedidos do lojista
    const pedidos = await prisma.pedido.findMany({
      where: pedidoFilters,
      include: {
        itensPedido: {
          include: {
            produto: {
              include: {
                categoria: true,
                imagens: {
                  orderBy: { ordem: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    if (pedidos.length === 0) {
      return NextResponse.json(
        {
          message: 'Nenhuma venda encontrada para este lojista',
          salesHistory: [],
          resumo: {
            totalProdutosVendidos: 0,
            receitaTotalGeral: 0,
            totalPedidos: 0,
          },
        },
        { status: 200 }
      )
    }

    // Agregar dados por produto
    const produtosMap = new Map<number, any>()

    for (const pedido of pedidos) {
      for (const item of pedido.itensPedido) {
        const produtoId = item.produtoId
        
        // Aplicar filtro de categoria se fornecido
        if (categoriaId && item.produto.categoriaId !== parseInt(categoriaId)) {
          continue
        }

        if (!produtosMap.has(produtoId)) {
          produtosMap.set(produtoId, {
            produtoId: item.produto.id,
            nome: item.produto.nome,
            categoria: item.produto.categoria.nome,
            imagemPrincipal: item.produto.imagens[0]?.url || null,
            ativo: item.produto.ativo,
            quantidadeTotalVendida: 0,
            receitaTotal: 0,
            precos: [] as number[],
            pedidosIds: new Set<number>(),
            ultimaVenda: null as Date | null,
            variantes: new Map<string, number>(),
          })
        }

        const produtoData = produtosMap.get(produtoId)!
        const precoUnitario = formatDecimal(item.precoUnitario)
        const subtotal = precoUnitario * item.quantidade

        produtoData.quantidadeTotalVendida += item.quantidade
        produtoData.receitaTotal += subtotal
        produtoData.precos.push(precoUnitario)
        produtoData.pedidosIds.add(pedido.id)

        // Atualizar última venda
        if (!produtoData.ultimaVenda || pedido.createdAt > produtoData.ultimaVenda) {
          produtoData.ultimaVenda = pedido.createdAt
        }

        // Agregar variantes (cor + tamanho)
        const cor = item.corSelecionada || null
        const tamanho = item.tamanhoSelecionado || null
        const varianteKey = `${cor || 'sem-cor'}-${tamanho || 'sem-tamanho'}`
        
        const quantidadeAtual = produtoData.variantes.get(varianteKey) || 0
        produtoData.variantes.set(varianteKey, quantidadeAtual + item.quantidade)
      }
    }

    // Processar dados agregados
    const salesHistory: ProdutoVendas[] = Array.from(produtosMap.values()).map(
      (produto) => {
        // Calcular preço médio
        const precoMedio =
          produto.precos.reduce((sum: number, p: number) => sum + p, 0) /
          produto.precos.length

        // Ordenar variantes por quantidade vendida (top 5)
        const variantesMaisVendidas: VarianteVenda[] = Array.from<[string, number]>(
          produto.variantes.entries()
        )
          .map(([key, quantidade]) => {
            const [cor, tamanho] = key.split('-')
            return {
              cor: cor === 'sem-cor' ? null : cor,
              tamanho: tamanho === 'sem-tamanho' ? null : tamanho,
              quantidade,
            }
          })
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5)

        return {
          produtoId: produto.produtoId,
          nome: produto.nome,
          categoria: produto.categoria,
          imagemPrincipal: produto.imagemPrincipal,
          quantidadeTotalVendida: produto.quantidadeTotalVendida,
          receitaTotal: produto.receitaTotal,
          numeroPedidos: produto.pedidosIds.size,
          precoMedio,
          ultimaVenda: produto.ultimaVenda,
          ativo: produto.ativo,
          variantesMaisVendidas,
        }
      }
    )

    // Ordenar por receita total (decrescente)
    salesHistory.sort((a, b) => b.receitaTotal - a.receitaTotal)

    // Calcular resumo geral
    const resumo = {
      totalProdutosVendidos: salesHistory.reduce(
        (sum, p) => sum + p.quantidadeTotalVendida,
        0
      ),
      receitaTotalGeral: salesHistory.reduce((sum, p) => sum + p.receitaTotal, 0),
      totalPedidos: pedidos.length,
    }

    return NextResponse.json(
      {
        message: 'Histórico de vendas recuperado com sucesso',
        salesHistory,
        resumo,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar histórico de vendas:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar histórico de vendas. Tente novamente.' },
      { status: 500 }
    )
  }
}

