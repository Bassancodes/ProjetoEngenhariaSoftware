"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CustomerHeader } from "@/components/CustomerHeader";

type OrderItem = {
  id: number;
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  imagem: string | null;
};

type Order = {
  id: number;
  status: string;
  statusLabel: string;
  createdAt: string;
  lojista: string | null;
  total: number;
  itens: OrderItem[];
};

const statusStyles: Record<
  string,
  { label: string; badgeClass: string; textClass: string }
> = {
  PENDENTE_PAGAMENTO: {
    label: "Pendente de Pagamento",
    badgeClass: "bg-yellow-100 text-yellow-800",
    textClass: "text-yellow-700",
  },
  PENDENTE_ENVIO: {
    label: "Pendente de Envio",
    badgeClass: "bg-purple-100 text-purple-800",
    textClass: "text-purple-700",
  },
  EM_TRANSITO: {
    label: "Em Trânsito",
    badgeClass: "bg-blue-100 text-blue-800",
    textClass: "text-blue-700",
  },
  ENTREGUE: {
    label: "Entregue",
    badgeClass: "bg-green-100 text-green-800",
    textClass: "text-green-700",
  },
  CANCELADO: {
    label: "Cancelado",
    badgeClass: "bg-red-100 text-red-800",
    textClass: "text-red-700",
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

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const usuarioId = user.id;

    async function fetchOrders(id: string) {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get("/orders/list", {
          params: { usuarioId: id },
        });

        const fetchedOrders = (data?.orders ?? []) as Order[];
        setOrders(fetchedOrders);
      } catch (err: unknown) {
        console.error("Erro ao buscar pedidos:", err);
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Erro ao buscar pedidos. Tente novamente.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders(usuarioId);
  }, [isAuthenticated, isLoading, router, user]);

  const headerSubtitle = useMemo(() => {
    if (!orders.length) return "Nenhum pedido encontrado";
    if (orders.length === 1) return "Você possui 1 pedido registrado";
    return `Você possui ${orders.length} pedidos registrados`;
  }, [orders]);

  const renderOrderItemsSummary = (items: OrderItem[]) => {
    if (!items.length) return "Sem itens registrados";

    return items
      .map((item) => `${item.nomeProduto} (x${item.quantidade})`)
      .slice(0, 3)
      .join(", ")
      .concat(items.length > 3 ? ", ..." : "");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
      <CustomerHeader
        subtitle="BAXEIN WEAR - Meus Pedidos"
        profileMenuItems={[
          { label: "Meus Pedidos", href: "/customer/orders", disabled: true },
          { label: "Catálogo", href: "/customer/catalog" },
          { label: "Meu Carrinho", href: "/customer/cart" },
        ]}
      />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">{headerSubtitle}</p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm text-center text-gray-600">
            Carregando pedidos...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm text-center text-red-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Você ainda não possui pedidos.
            </h2>
            <p className="text-gray-600 mb-6">
              Explore o catálogo e faça seu primeiro pedido.
            </p>
            <Link
              href="/customer/catalog"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200"
            >
              Ir para o Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo =
                statusStyles[order.status] ?? statusStyles["PENDENTE_PAGAMENTO"];

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-lg font-semibold text-blue-600">
                        #{String(order.id).padStart(5, "0")}
                      </span>
                      <span className="flex items-center text-sm text-gray-500 gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10m-12 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(order.createdAt)}
                      </span>
                      {order.lojista && (
                        <span className="text-sm text-gray-500">
                          Lojista:{" "}
                          <span className="font-medium text-gray-700">
                            {order.lojista}
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">
                      {renderOrderItemsSummary(order.itens)}
                    </p>

                    <div className="text-sm font-medium text-gray-800">
                      Total do pedido:{" "}
                      <span className="text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors duration-200"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}


