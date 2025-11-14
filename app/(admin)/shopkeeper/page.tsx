"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CustomerHeader } from "@/components/CustomerHeader";

interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: {
    id: number;
    nome: string;
  };
  descricao?: string;
  createdAt: string;
}

export default function ShopkeeperPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    categoriaId: "",
    descricao: "",
    imagens: [] as string[],
  });
  const [imagemUrl, setImagemUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Estados para o selector de categoria
  const [categoriaSearch, setCategoriaSearch] = useState("");
  const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false);
  const [isCreatingCategoria, setIsCreatingCategoria] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");

  // Verificar autenticação e tipo de usuário
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.tipoPerfil !== "lojista")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Carregar categorias
  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoadingCategorias(true);
      try {
        const response = await fetch("/api/categories/list");
        const data = await response.json();
        if (response.ok) {
          setCategorias(data.categorias || []);
        } else {
          console.error("Erro ao carregar categorias:", data.error);
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setIsLoadingCategorias(false);
      }
    };

    if (isAuthenticated && user?.tipoPerfil === "lojista") {
      fetchCategorias();
    }
  }, [isAuthenticated, user]);

  // Carregar produtos do lojista
  useEffect(() => {
    const fetchProdutos = async () => {
      if (!user?.id) return;

      setIsLoadingProdutos(true);
      try {
        const response = await fetch(`/api/products/list?usuarioId=${user.id}`);
        const data = await response.json();
        if (response.ok) {
          setProdutos(data.produtos || []);
        } else {
          console.error("Erro ao carregar produtos:", data.error);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setIsLoadingProdutos(false);
      }
    };

    if (isAuthenticated && user?.tipoPerfil === "lojista") {
      fetchProdutos();
    }
  }, [isAuthenticated, user, showForm]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Filtrar categorias baseado na busca
  const categoriasFiltradas = categorias.filter((categoria) =>
    categoria.nome.toLowerCase().includes(categoriaSearch.toLowerCase())
  );

  // Selecionar categoria
  const handleSelectCategoria = (categoria: Categoria) => {
    setFormData((prev) => ({
      ...prev,
      categoriaId: categoria.id.toString(),
    }));
    setCategoriaSearch(categoria.nome);
    setShowCategoriaDropdown(false);
    
    // Limpar erro
    if (errors.categoriaId) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.categoriaId;
        return newErrors;
      });
    }
  };

  // Criar nova categoria
  const handleCreateCategoria = async () => {
    const nomeCategoria = novaCategoriaNome.trim() || categoriaSearch.trim();
    if (!nomeCategoria) {
      return;
    }

    setIsCreatingCategoria(true);
    try {
      const response = await fetch("/api/categories/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeCategoria,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar categoria");
      }

      // Adicionar a nova categoria à lista
      const novaCategoria = data.categoria;
      setCategorias((prev) => [...prev, novaCategoria].sort((a, b) => 
        a.nome.localeCompare(b.nome)
      ));

      // Selecionar a categoria recém-criada
      handleSelectCategoria(novaCategoria);
      setNovaCategoriaNome("");
      setIsCreatingCategoria(false);
    } catch (error: unknown) {
      console.error("Erro ao criar categoria:", error);
      setErrors({
        categoriaId:
          (error as { message?: string })?.message ||
          "Erro ao criar categoria. Tente novamente.",
      });
      setIsCreatingCategoria(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome do produto é obrigatório";
    }

    if (!formData.preco.trim()) {
      newErrors.preco = "Preço é obrigatório";
    } else {
      const preco = parseFloat(formData.preco);
      if (isNaN(preco) || preco <= 0) {
        newErrors.preco = "Preço deve ser um número positivo";
      }
    }

    if (!formData.categoriaId) {
      newErrors.categoriaId = "Categoria é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setErrors({ submit: "Usuário não autenticado" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const response = await fetch("/api/products/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: user.id,
          nome: formData.nome.trim(),
          preco: parseFloat(formData.preco),
          categoriaId: parseInt(formData.categoriaId),
          descricao: formData.descricao.trim() || null,
          imagens: formData.imagens.length > 0 ? formData.imagens : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar produto");
      }

      setSuccessMessage("Produto criado com sucesso!");
      setFormData({
        nome: "",
        preco: "",
        categoriaId: "",
        descricao: "",
        imagens: [],
      });
      setCategoriaSearch("");
      setNovaCategoriaNome("");
      setImagemUrl("");
      setShowForm(false);

      // Recarregar produtos
      const produtosResponse = await fetch(`/api/products/list?usuarioId=${user.id}`);
      const produtosData = await produtosResponse.json();
      if (produtosResponse.ok) {
        setProdutos(produtosData.produtos || []);
      }
    } catch (error: unknown) {
      setErrors({
        submit:
          (error as { message?: string })?.message ||
          "Erro ao criar produto. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        subtitle="Painel do Lojista - Gerencie seus produtos"
        title="BAXEINWEAR"
        profileMenuItems={[
          { label: "Meus Produtos", href: "/shopkeeper", disabled: true },
        ]}
      />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Botão para Adicionar Produto */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Meus Produtos</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
          >
            {showForm ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancelar
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Adicionar Produto
              </>
            )}
          </button>
        </div>

        {/* Mensagem de Sucesso */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Formulário de Cadastro */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cadastrar Novo Produto
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome do Produto */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      errors.nome ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Ex: Camiseta Básica Branca"
                  />
                  {errors.nome && (
                    <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
                  )}
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    name="preco"
                    value={formData.preco}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      errors.preco ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.preco && (
                    <p className="mt-1 text-sm text-red-600">{errors.preco}</p>
                  )}
                </div>

                {/* Categoria com busca e criação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categoriaSearch}
                      onChange={(e) => {
                        setCategoriaSearch(e.target.value);
                        setShowCategoriaDropdown(true);
                        // Se limpar a busca, limpar também a seleção
                        if (e.target.value === "") {
                          setFormData((prev) => ({
                            ...prev,
                            categoriaId: "",
                          }));
                        }
                      }}
                      onFocus={() => setShowCategoriaDropdown(true)}
                      onBlur={() => {
                        // Delay para permitir clicar no dropdown
                        setTimeout(() => setShowCategoriaDropdown(false), 200);
                      }}
                      placeholder="Buscar ou criar categoria..."
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        errors.categoriaId ? "border-red-500" : "border-gray-300"
                      }`}
                      disabled={isLoadingCategorias}
                    />
                    
                    {/* Dropdown de categorias */}
                    {showCategoriaDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {categoriaSearch.trim() === "" ? (
                          <div className="px-4 py-2 text-sm text-gray-900">
                            Digite para buscar ou criar uma categoria
                          </div>
                        ) : categoriasFiltradas.length > 0 ? (
                          categoriasFiltradas.map((categoria) => (
                            <button
                              key={categoria.id}
                              type="button"
                              onClick={() => handleSelectCategoria(categoria)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                            >
                              <div className="font-medium text-gray-900">{categoria.nome}</div>
                              {categoria.descricao && (
                                <div className="text-sm text-gray-900">{categoria.descricao}</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-4">
                            <div className="text-sm text-gray-900 mb-3">
                              Nenhuma categoria encontrada com &quot;{categoriaSearch}&quot;
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={novaCategoriaNome || categoriaSearch}
                                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCreateCategoria();
                                  }
                                }}
                                placeholder="Nome da nova categoria"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                                disabled={isCreatingCategoria}
                              />
                              <button
                                type="button"
                                onClick={handleCreateCategoria}
                                disabled={isCreatingCategoria || (!novaCategoriaNome.trim() && !categoriaSearch.trim())}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                              >
                                {isCreatingCategoria ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Criando...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                    Criar &quot;{novaCategoriaNome.trim() || categoriaSearch.trim()}&quot;
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.categoriaId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoriaId}</p>
                  )}
                  {formData.categoriaId && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ Categoria selecionada: {categorias.find(c => c.id.toString() === formData.categoriaId)?.nome}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Descreva o produto..."
                  />
                </div>

                {/* Imagens */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URLs das Imagens (opcional)
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imagemUrl}
                        onChange={(e) => setImagemUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (imagemUrl.trim() && imagemUrl.startsWith("http")) {
                              setFormData((prev) => ({
                                ...prev,
                                imagens: [...prev.imagens, imagemUrl.trim()],
                              }));
                              setImagemUrl("");
                            }
                          }
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (imagemUrl.trim() && imagemUrl.startsWith("http")) {
                            setFormData((prev) => ({
                              ...prev,
                              imagens: [...prev.imagens, imagemUrl.trim()],
                            }));
                            setImagemUrl("");
                          }
                        }}
                        disabled={!imagemUrl.trim() || !imagemUrl.startsWith("http")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Adicione URLs públicas (http ou https) das imagens do produto. Uma por linha ou clique em &quot;Adicionar&quot; para cada URL.
                    </p>
                    {formData.imagens.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Imagens adicionadas ({formData.imagens.length}):
                        </p>
                        <div className="space-y-1">
                          {formData.imagens.map((url, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                            >
                              <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                                {url}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    imagens: prev.imagens.filter((_, i) => i !== index),
                                  }));
                                }}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Erro de submissão */}
              {errors.submit && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                  {errors.submit}
                </div>
              )}

              {/* Botões */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      nome: "",
                      preco: "",
                      categoriaId: "",
                      descricao: "",
                      imagens: [],
                    });
                    setCategoriaSearch("");
                    setNovaCategoriaNome("");
                    setImagemUrl("");
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Produtos */}
        {isLoadingProdutos ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando produtos...</p>
          </div>
        ) : produtos.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Criação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {produto.nome}
                        </div>
                        {produto.descricao && (
                          <div className="text-sm text-gray-500 mt-1">
                            {produto.descricao.length > 50
                              ? `${produto.descricao.substring(0, 50)}...`
                              : produto.descricao}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {produto.categoria.nome}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(produto.preco)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(produto.createdAt)}
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum produto cadastrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece adicionando seu primeiro produto.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors duration-200"
              >
                Adicionar Produto
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

