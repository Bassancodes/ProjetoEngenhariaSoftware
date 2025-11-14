import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type EnderecoEntrega = {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  nomeCompleto: string
  email: string
  telefone: string
}

type CreateOrderRequest = {
  usuarioId?: string
  enderecoEntrega?: EnderecoEntrega
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

function validateEndereco(endereco: EnderecoEntrega): string | null {
  if (!endereco.cep || endereco.cep.trim() === '') {
    return 'CEP é obrigatório'
  }
  if (!endereco.logradouro || endereco.logradouro.trim() === '') {
    return 'Logradouro é obrigatório'
  }
  if (!endereco.numero || endereco.numero.trim() === '') {
    return 'Número é obrigatório'
  }
  if (!endereco.bairro || endereco.bairro.trim() === '') {
    return 'Bairro é obrigatório'
  }
  if (!endereco.cidade || endereco.cidade.trim() === '') {
    return 'Cidade é obrigatória'
  }
  if (!endereco.uf || endereco.uf.trim() === '') {
    return 'UF é obrigatória'
  }
  if (!endereco.nomeCompleto || endereco.nomeCompleto.trim() === '') {
    return 'Nome completo é obrigatório'
  }
  if (!endereco.email || endereco.email.trim() === '') {
    return 'Email é obrigatório'
  }
  if (!endereco.telefone || endereco.telefone.trim() === '') {
    return 'Telefone é obrigatório'
  }
  
  // Validar formato de CEP (8 dígitos)
  const cepNumbers = endereco.cep.replace(/\D/g, '')
  if (cepNumbers.length !== 8) {
    return 'CEP deve ter 8 dígitos'
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(endereco.email)) {
    return 'Email inválido'
  }
  
  // Validar UF (2 caracteres)
  if (endereco.uf.trim().length !== 2) {
    return 'UF deve ter 2 caracteres'
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderRequest
    const { usuarioId, enderecoEntrega } = body

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!enderecoEntrega) {
      return NextResponse.json(
        { error: 'Endereço de entrega é obrigatório' },
        { status: 400 }
      )
    }

    const validationError = validateEndereco(enderecoEntrega)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
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

    const totalAmount = carrinho.itensCarrinho.reduce(
      (
        total: number,
        item: { produto: { preco: unknown }; quantidade: number }
      ) => {
        const unitPrice = Number(item.produto.preco)
        return total + unitPrice * item.quantidade
      },
      0
    )

    // Preparar objeto de endereço para salvar
    const enderecoParaSalvar: EnderecoEntrega = {
      cep: enderecoEntrega.cep.trim(),
      logradouro: enderecoEntrega.logradouro.trim(),
      numero: enderecoEntrega.numero.trim(),
      complemento: enderecoEntrega.complemento?.trim() || '',
      bairro: enderecoEntrega.bairro.trim(),
      cidade: enderecoEntrega.cidade.trim(),
      uf: enderecoEntrega.uf.trim().toUpperCase(),
      nomeCompleto: enderecoEntrega.nomeCompleto.trim(),
      email: enderecoEntrega.email.trim(),
      telefone: enderecoEntrega.telefone.trim(),
    }

    const pedido = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdOrder = await tx.pedido.create({
        data: {
          clienteId,
          lojistaId,
          status: 'PENDENTE_PAGAMENTO',
          enderecoEntrega: enderecoParaSalvar,
          itensPedido: {
            create: carrinho.itensCarrinho.map(
              (
                item: {
                  produtoId: number
                  quantidade: number
                  produto: { preco: Prisma.Decimal }
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
          enderecoEntrega: pedido.enderecoEntrega,
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

