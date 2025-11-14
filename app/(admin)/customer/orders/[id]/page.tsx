"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CustomerHeader } from "@/components/CustomerHeader";

type OrderItem = {
  id: number;
  produtoId: number;
  nomeProduto: string;
  descricao: string | null;
  categoria: string;
  quantidade: number;
  precoUnitario: number;
  precoAtual: number;
  subtotal: number;
  imagemPrincipal: string | null;
  imagens: Array<{
    id: number;
    url: string;
    ordem: number;
  }>;
};

type Payment = {
  id: number;
  valor: number;
  status: string;
  tipoPagamento: string;
  createdAt: string;
};

type EnderecoEntrega = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  nomeCompleto?: string | null;
  email?: string | null;
  telefone?: string | null;
};

type OrderDetails = {
  id: number;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  cliente: {
    id: number;
    nome: string;
    email: string;
    endereco: string;
  };
  enderecoEntrega?: EnderecoEntrega;
  lojista: {
    id: number;
    empresa: string;
    nome: string;
    email: string;
  };
  itens: OrderItem[];
  total: number;
  totalPago: number;
  saldoRestante: number;
  pagamentos: Payment[];
};

const statusStyles: Record<
  string,
  { label: string; badgeClass: string; textClass: string }
> = {
  PENDENTE_PAGAMENTO: {
    label: "Pendente de Pagamento",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    textClass: "text-yellow-700",
  },
  PENDENTE_ENVIO: {
    label: "Pendente de Envio",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    textClass: "text-purple-700",
  },
  EM_TRANSITO: {
    label: "Em Trânsito",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    textClass: "text-blue-700",
  },
  ENTREGUE: {
    label: "Entregue",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    textClass: "text-green-700",
  },
  CANCELADO: {
    label: "Cancelado",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    textClass: "text-red-700",
  },
};

const paymentStatusStyles: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PENDENTE: {
    label: "Pendente",
    badgeClass: "bg-yellow-100 text-yellow-800",
  },
  PAGO: {
    label: "Pago",
    badgeClass: "bg-green-100 text-green-800",
  },
  CANCELADO: {
    label: "Cancelado",
    badgeClass: "bg-red-100 text-red-800",
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const usuarioId = user.id;

    async function fetchOrderDetails(id: string, userId: string) {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get(`/orders/${id}`, {
          params: { usuarioId: userId },
        });

        const orderData = data?.order as OrderDetails;
        setOrder(orderData);
      } catch (err: unknown) {
        console.error("Erro ao buscar detalhes do pedido:", err);
        const message =
          (err as { response?: { data?: { error?: string } } })?.response
            ?.data?.error ?? "Erro ao buscar detalhes do pedido. Tente novamente.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails(orderId, usuarioId);
  }, [isAuthenticated, isLoading, router, user, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
        <CustomerHeader
          subtitle="BAXEIN WEAR - Detalhes do Pedido"
          profileMenuItems={[
            { label: "Meus Pedidos", href: "/customer/orders" },
            { label: "Catálogo", href: "/customer/catalog" },
            { label: "Meu Carrinho", href: "/customer/cart" },
          ]}
        />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm text-center text-gray-600">
            Carregando detalhes do pedido...
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
        <CustomerHeader
          subtitle="BAXEIN WEAR - Detalhes do Pedido"
          profileMenuItems={[
            { label: "Meus Pedidos", href: "/customer/orders" },
            { label: "Catálogo", href: "/customer/catalog" },
            { label: "Meu Carrinho", href: "/customer/cart" },
          ]}
        />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm text-center">
            <p className="text-red-700 mb-4">{error ?? "Pedido não encontrado"}</p>
            <Link
              href="/customer/orders"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200"
            >
              Voltar para Meus Pedidos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusInfo =
    statusStyles[order.status] ?? statusStyles["PENDENTE_PAGAMENTO"];

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
      <CustomerHeader
        subtitle="BAXEIN WEAR - Detalhes do Pedido"
        profileMenuItems={[
          { label: "Meus Pedidos", href: "/customer/orders" },
          { label: "Catálogo", href: "/customer/catalog" },
          { label: "Meu Carrinho", href: "/customer/cart" },
        ]}
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Cabeçalho do Pedido */}
        <div className="mb-6">
          <Link
            href="/customer/orders"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar para Meus Pedidos
          </Link>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Pedido #{String(order.id).padStart(5, "0")}
                </h1>
                <p className="text-gray-600">
                  Realizado em {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${statusInfo.badgeClass}`}
              >
                {statusInfo.label}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Itens do Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Itens do Pedido */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Itens do Pedido
              </h2>
              <div className="space-y-4">
                {order.itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    {/* Imagem do Produto */}
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md overflow-hidden relative">
                      {item.imagemPrincipal ? (
                        <Image
                          src={item.imagemPrincipal}
                          alt={item.nomeProduto}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.nomeProduto}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Categoria: {item.categoria}
                      </p>
                      {item.descricao && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                          {item.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Quantidade: <span className="font-medium text-gray-900">{item.quantidade}</span>
                        </span>
                        <span className="text-gray-600">
                          Preço unitário: <span className="font-medium text-gray-900">{formatCurrency(item.precoUnitario)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {/* Informações do Lojista */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informações do Lojista
              </h2>
              <div className="space-y-2">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-3 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-medium text-gray-900">{order.lojista.empresa}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-3 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Responsável</p>
                    <p className="font-medium text-gray-900">{order.lojista.nome}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-3 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{order.lojista.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Resumo e Pagamentos */}
          <div className="space-y-6">
            {/* Resumo do Pedido */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Resumo do Pedido
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(0)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            
            

            {/* Informações de Entrega */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Endereço de Entrega
              </h2>
              {order.enderecoEntrega ? (
                <div className="space-y-3">
                  {/* Nome Completo */}
                  {order.enderecoEntrega.nomeCompleto && (
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Destinatário</p>
                        <p className="font-medium text-gray-900">
                          {order.enderecoEntrega.nomeCompleto}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {order.enderecoEntrega.email && (
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {order.enderecoEntrega.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Telefone */}
                  {order.enderecoEntrega.telefone && (
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-medium text-gray-900">
                          {order.enderecoEntrega.telefone}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Endereço Completo */}
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-gray-600">Endereço</p>
                      <div className="font-medium text-gray-900">
                        {order.enderecoEntrega.logradouro && (
                          <>
                            {order.enderecoEntrega.logradouro}
                            {order.enderecoEntrega.numero && `, ${order.enderecoEntrega.numero}`}
                            {order.enderecoEntrega.complemento && ` - ${order.enderecoEntrega.complemento}`}
                          </>
                        )}
                      </div>
                      {order.enderecoEntrega.bairro && (
                        <p className="text-sm text-gray-700">
                          {order.enderecoEntrega.bairro}
                        </p>
                      )}
                      {(order.enderecoEntrega.cidade || order.enderecoEntrega.uf) && (
                        <p className="text-sm text-gray-700">
                          {order.enderecoEntrega.cidade}
                          {order.enderecoEntrega.cidade && order.enderecoEntrega.uf && ' - '}
                          {order.enderecoEntrega.uf}
                        </p>
                      )}
                      {order.enderecoEntrega.cep && (
                        <p className="text-sm text-gray-600">
                          CEP: {order.enderecoEntrega.cep}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Fallback para pedidos antigos sem endereço estruturado
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Endereço</p>
                    <p className="font-medium text-gray-900">{order.cliente.endereco}</p>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
    
  );
}

