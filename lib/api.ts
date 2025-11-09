import axios from 'axios'

// Configuração base do axios para as rotas da API
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tipos para as requisições e respostas
export type TipoUsuario = 'CLIENTE' | 'LOJISTA'
export type PedidoStatus = 'PENDENTE_PAGAMENTO' | 'PENDENTE_ENVIO' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADO'
export type PagamentoStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO'

// Exemplos de uso:
// 
// import { api } from '@/lib/api'
// 
// // GET
// const usuarios = await api.get('/usuarios')
// 
// // POST
// const novoUsuario = await api.post('/usuarios', {
//   nome: 'João',
//   email: 'joao@example.com',
//   senha: 'senha123',
//   tipoUsuario: 'CLIENTE'
// })
// 
// // PUT
// await api.put(`/usuarios/${id}`, { nome: 'João Atualizado' })
// 
// // DELETE
// await api.delete(`/usuarios/${id}`)

