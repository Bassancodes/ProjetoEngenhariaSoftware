import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// POST /api/cadastro - Criar novo usuário com perfil (Cliente ou Lojista)
export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Formato JSON inválido no corpo da requisição' },
        { status: 400 }
      )
    }
    
    const { fullName, email, password, confirmPassword, accountType, endereco, empresa } = body

    // Validação dos campos obrigatórios
    if (!fullName || !email || !password || !confirmPassword || !accountType) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: fullName, email, password, confirmPassword, accountType' },
        { status: 400 }
      )
    }

    // Validação do tipo de conta
    if (accountType !== 'cliente' && accountType !== 'lojista') {
      return NextResponse.json(
        { error: 'Tipo de conta inválido. Deve ser "cliente" ou "lojista"' },
        { status: 400 }
      )
    }

    // Validação de senhas
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'As senhas não coincidem' },
        { status: 400 }
      )
    }

    // Validação de senha mínima
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    // Converter accountType para o formato do enum
    const tipoUsuario = accountType === 'cliente' ? 'CLIENTE' : 'LOJISTA'

    // Criar usuário e perfil em uma transação
    const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Criar o usuário
      const usuario = await tx.usuario.create({
        data: {
          nome: fullName,
          email,
          senha: password, // TODO: Hash da senha antes de salvar (usar bcrypt)
          tipoUsuario: tipoUsuario as 'CLIENTE' | 'LOJISTA',
        },
      })

      // Criar o perfil correspondente
      if (tipoUsuario === 'CLIENTE') {
        // Se endereco não foi fornecido, usar valor padrão
        const enderecoCliente = endereco || 'Endereço não informado'
        
        const cliente = await tx.cliente.create({
          data: {
            endereco: enderecoCliente,
            usuarioId: usuario.id,
          },
        })

        return {
          usuario,
          perfil: cliente,
          tipoPerfil: 'cliente',
        }
      } else {
        // Se empresa não foi fornecida, usar valor padrão
        const empresaLojista = empresa || 'Empresa não informada'
        
        const lojista = await tx.lojista.create({
          data: {
            empresa: empresaLojista,
            usuarioId: usuario.id,
          },
        })

        return {
          usuario,
          perfil: lojista,
          tipoPerfil: 'lojista',
        }
      }
    })

    // Retornar resposta sem a senha
    const { senha: _senha, ...usuarioSemSenha } = resultado.usuario

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        usuario: usuarioSemSenha,
        perfil: resultado.perfil,
        tipoPerfil: resultado.tipoPerfil,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Erro ao criar usuário:', error)
    // Erros conhecidos do Prisma (constraints, validação, etc.)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const meta = error.meta as { target?: string[] } | undefined
        const campo = meta?.target?.[0] || 'campo'
        return NextResponse.json(
          { error: `${campo === 'email' ? 'Email' : 'Campo'} já cadastrado` },
          { status: 409 }
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Erro de referência: registro relacionado não encontrado' },
          { status: 400 }
        )
      }
    }
    // Erros de conexão (inicialização)
    const hasCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    if (hasCode) {
      const code = (error as { code: string }).code
      if (code === 'P1001' || code === 'P1017') {
        return NextResponse.json(
          { error: 'Erro de conexão com o banco de dados. Tente novamente mais tarde.' },
          { status: 503 }
        )
      }
    }
    // Em desenvolvimento, retornar mais detalhes do erro
    const isDevelopment = process.env.NODE_ENV === 'development'
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Erro desconhecido ao criar usuário'
    return NextResponse.json(
      {
        error: isDevelopment ? message : 'Erro ao criar usuário. Tente novamente.',
        ...(isDevelopment && {
          details: hasCode ? `Código: ${(error as { code: string }).code}` : undefined,
          stack:
            typeof error === 'object' &&
            error !== null &&
            'stack' in error &&
            typeof (error as { stack?: unknown }).stack === 'string'
              ? (error as { stack: string }).stack
              : undefined,
        }),
      },
      { status: 500 }
    )
  }
}

