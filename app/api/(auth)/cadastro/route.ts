import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/cadastro - Criar novo usuário com perfil (Cliente ou Lojista)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
    const resultado = await prisma.$transaction(async (tx) => {
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
    const { senha, ...usuarioSemSenha } = resultado.usuario

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        usuario: usuarioSemSenha,
        perfil: resultado.perfil,
        tipoPerfil: resultado.tipoPerfil,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar usuário. Tente novamente.' },
      { status: 500 }
    )
  }
}

