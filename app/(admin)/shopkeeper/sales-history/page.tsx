"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CustomerHeader } from "@/components/CustomerHeader";

interface VarianteVenda {
  cor: string | null;
  tamanho: string | null;
  quantidade: number;
}

interface ProdutoVendas {
  produtoId: number;
  nome: string;
  categoria: string;
  imagemPrincipal: string | null;
  quantidadeTotalVendida: number;
  receitaTotal: number;
  numeroPedidos: number;
  precoMedio: number;
  ultimaVenda: string | null;
  ativo: boolean;
  variantesMaisVendidas: VarianteVenda[];
}

interface Resumo {
  totalProdutosVendidos: number;
  receitaTotalGeral: number;
  totalPedidos: number;
}

interface Categoria {
  id: number;
  nome: string;
}

type OrdenacaoType = "receita" | "quantidade" | "pedidos" | "recente";

export default function SalesHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [salesHistory, setSalesHistory] = useState<ProdutoVendas[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | "all">("all");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoType>("receita");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Verificar autenticação e tipo de usuário
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.tipoPerfil !== "lojista")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Carregar categorias
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch("/api/categories/list");
        const data = await response.json();
        if (response.ok) {
          setCategorias(data.categorias || []);
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    };

    if (isAuthenticated && user?.tipoPerfil === "lojista") {
      fetchCategorias();
    }
  }, [isAuthenticated, user]);

  // Carregar histórico de vendas
  useEffect(() => {
    const fetchSalesHistory = async () => {
      if (!user?.id) return;

      setIsLoadingData(true);
      try {
        let url = `/api/sales/history?usuarioId=${user.id}`;
        
        if (selectedCategoriaId !== "all") {
          url += `&categoriaId=${selectedCategoriaId}`;
        }
        
        if (dataInicio) {
          url += `&dataInicio=${dataInicio}`;
        }
        
        if (dataFim) {
          url += `&dataFim=${dataFim}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          setSalesHistory(data.salesHistory || []);
          setResumo(data.resumo || null);
        } else {
          console.error("Erro ao carregar histórico de vendas:", data.error);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico de vendas:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAuthenticated && user?.tipoPerfil === "lojista") {
      fetchSalesHistory();
    }
  }, [isAuthenticated, user, selectedCategoriaId, dataInicio, dataFim]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Filtrar por busca
  const filteredBySearch = salesHistory.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar produtos
  const sortedProducts = [...filteredBySearch].sort((a, b) => {
    switch (ordenacao) {
      case "receita":
        return b.receitaTotal - a.receitaTotal;
      case "quantidade":
        return b.quantidadeTotalVendida - a.quantidadeTotalVendida;
      case "pedidos":
        return b.numeroPedidos - a.numeroPedidos;
      case "recente":
        if (!a.ultimaVenda) return 1;
        if (!b.ultimaVenda) return -1;
        return new Date(b.ultimaVenda).getTime() - new Date(a.ultimaVenda).getTime();
      default:
        return 0;
    }
  });

  const limparFiltros = () => {
    setSearchTerm("");
    setSelectedCategoriaId("all");
    setDataInicio("");
    setDataFim("");
    setOrdenacao("receita");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.tipoPerfil !== "lojista") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CustomerHeader
        subtitle="Histórico de Vendas dos Produtos"
        title="BAXEINWEAR"
        profileMenuItems={[
          { label: "Meus Produtos", href: "/shopkeeper" },
          { label: "Histórico de Vendas", href: "/shopkeeper/sales-history", disabled: true },
        ]}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Título e Resumo */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Histórico de Vendas</h2>
          
          {resumo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Produtos Vendidos</p>
                    <p className="text-2xl font-bold text-gray-900">{resumo.totalProdutosVendidos}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(resumo.receitaTotalGeral)}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900">{resumo.totalPedidos}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Produto
              </label>
              <input
                type="text"
                placeholder="Nome do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={selectedCategoriaId === "all" ? "all" : String(selectedCategoriaId)}
                onChange={(e) => {
                  const v = e.target.value === "all" ? "all" : parseInt(e.target.value);
                  setSelectedCategoriaId(v as number | "all");
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">Todas as Categorias</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Ordenação */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as OrdenacaoType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="receita">Maior Receita</option>
                <option value="quantidade">Maior Quantidade Vendida</option>
                <option value="pedidos">Mais Pedidos</option>
                <option value="recente">Venda Mais Recente</option>
              </select>
            </div>

            {/* Botão Limpar */}
            <button
              onClick={limparFiltros}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Produtos */}
        {isLoadingData ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando histórico de vendas...</p>
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Qtd. Vendida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Receita Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Nº Pedidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Preço Médio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Última Venda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProducts.map((produto) => (
                    <tr key={produto.produtoId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded object-cover"
                              src={
                                produto.imagemPrincipal ||
                                "https://via.placeholder.com/48x48.png?text=Sem+Imagem"
                              }
                              alt={produto.nome}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {produto.nome}
                            </div>
                            {produto.variantesMaisVendidas.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Mais vendida:{" "}
                                {produto.variantesMaisVendidas[0].cor || "N/A"} -{" "}
                                {produto.variantesMaisVendidas[0].tamanho || "N/A"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{produto.categoria}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {produto.quantidadeTotalVendida}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatPrice(produto.receitaTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{produto.numeroPedidos}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(produto.precoMedio)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(produto.ultimaVenda)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            produto.ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {produto.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma venda encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategoriaId !== "all" || dataInicio || dataFim
                ? "Tente ajustar os filtros para ver mais resultados."
                : "Você ainda não possui vendas registradas."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

