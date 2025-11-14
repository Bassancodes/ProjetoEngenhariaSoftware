import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/login - Autenticar usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validação dos campos obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
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

    // Buscar usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        cliente: true,
        lojista: true,
      },
    })

    // Verificar se o usuário existe
    if (!usuario) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar se a senha está correta
    // TODO: Comparar com hash da senha (usar bcrypt.compare quando implementar hash)
    if (usuario.senha !== password) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Determinar o tipo de perfil e os dados do perfil
    let perfil = null
    let tipoPerfil = null

    if (usuario.tipoUsuario === 'CLIENTE' && usuario.cliente) {
      perfil = usuario.cliente
      tipoPerfil = 'cliente'
    } else if (usuario.tipoUsuario === 'LOJISTA' && usuario.lojista) {
      perfil = usuario.lojista
      tipoPerfil = 'lojista'
    }

    // Retornar resposta sem a senha
    const { senha, ...usuarioSemSenha } = usuario
    // Garantir que a variável seja considerada utilizada pelo ESLint
    void senha

    return NextResponse.json(
      {
        message: 'Login realizado com sucesso',
        usuario: usuarioSemSenha,
        perfil,
        tipoPerfil,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Erro ao fazer login:', error)
    
    return NextResponse.json(
      { error: 'Erro ao fazer login. Tente novamente.' },
      { status: 500 }
    )
  }
}

