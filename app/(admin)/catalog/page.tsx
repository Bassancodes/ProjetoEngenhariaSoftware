"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Filters from "../customer/catalog/Filters";
import { Product, FilterState, ApiProduct } from "../customer/catalog/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CatalogPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { addToCart, getItemCount } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para converter produto da API para o formato do frontend
  const convertApiProductToProduct = (apiProduct: ApiProduct): Product => {
    const images = apiProduct.imagens && apiProduct.imagens.length > 0
      ? apiProduct.imagens.map(img => img.url)
      : ["/placeholder.png"]; // Imagem padrão se não houver imagens

    const price = typeof apiProduct.preco === 'string'
      ? parseFloat(apiProduct.preco)
      : Number(apiProduct.preco);

    return {
      id: apiProduct.id,
      name: apiProduct.nome,
      price: price,
      image: images[0] || "/placeholder.png",
      images: images,
      category: apiProduct.categoria.nome,
      sizes: ["P", "M", "G", "GG"], // Valores padrão - pode ser expandido no futuro
      colors: ["Preto", "Branco", "Cinza"], // Valores padrão - pode ser expandido no futuro
      description: apiProduct.descricao || "",
      isBestSeller: false, // Pode ser adicionado no futuro
      isOnSale: false, // Pode ser adicionado no futuro
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"], // Valores padrão
    };
  };

  // Buscar produtos da API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const url = user?.id
          ? `/api/products/list?usuarioId=${user.id}`
          : `/api/products/list`;

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.produtos) {
          const convertedProducts = data.produtos.map(convertApiProductToProduct);
          setAllProducts(convertedProducts);
        } else {
          console.error("Erro ao carregar produtos:", data.error);
        }
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user?.id]);

  // Estado dos filtros
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    priceRange: null,
    sizes: [],
    colors: [],
    showBestSellers: false,
    showOnSale: false,
  });

  // Extrair opções disponíveis dos produtos
  const availableCategories = useMemo(() => {
    const categories = new Set(allProducts.map((p) => p.category));
    return Array.from(categories).sort();
  }, [allProducts]);

  const availableSizes = useMemo(() => {
    const sizes = new Set(allProducts.flatMap((p) => p.sizes));
    return Array.from(sizes).sort();
  }, [allProducts]);

  const availableColors = useMemo(() => {
    const colors = new Set(allProducts.flatMap((p) => p.colors));
    return Array.from(colors).sort();
  }, [allProducts]);

  // Lógica de filtragem
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Filtro de categoria
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Filtro de preço
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split("-");
        if (max === "+") {
          if (product.price < Number(min)) return false;
        } else {
          const minPrice = Number(min);
          const maxPrice = Number(max);
          if (product.price < minPrice || product.price > maxPrice) return false;
        }
      }

      // Filtro de tamanho
      if (filters.sizes.length > 0) {
        const hasMatchingSize = filters.sizes.some((size: string) =>
          product.sizes.includes(size)
        );
        if (!hasMatchingSize) return false;
      }

      // Filtro de cor
      if (filters.colors.length > 0) {
        const hasMatchingColor = filters.colors.some((color: string) =>
          product.colors.includes(color)
        );
        if (!hasMatchingColor) return false;
      }

      // Filtro de mais vendidos
      if (filters.showBestSellers && !product.isBestSeller) {
        return false;
      }

      // Filtro de promoção
      if (filters.showOnSale && !product.isOnSale) {
        return false;
      }

      return true;
    });
  }, [allProducts, filters]);

  // Calcular quantidade de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.priceRange) count++;
    if (filters.sizes.length > 0) count++;
    if (filters.colors.length > 0) count++;
    if (filters.showBestSellers) count++;
    if (filters.showOnSale) count++;
    return count;
  }, [filters]);

  // Função para formatar preço em reais
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Função para abrir modal de seleção
  const handleAddToCartClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || "");
    setSelectedColor(product.colors[0] || "");
    setShowModal(true);
  };

  // Função para confirmar adição ao carrinho
  const handleConfirmAddToCart = () => {
    if (selectedProduct && selectedSize && selectedColor) {
      addToCart(selectedProduct, selectedSize, selectedColor);
      setShowModal(false);
      setSelectedProduct(null);
      setSelectedSize("");
      setSelectedColor("");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Fixo */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo - Logo */}
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs text-gray-900 mb-1">BAXEIN WEAR - Product Catalog</div>
                <div className="text-2xl font-bold text-gray-800">BAXEINWEAR</div>
              </div>
            </div>

            {/* Lado Direito - Ações */}
            <div className="flex items-center gap-4">
              {/* Botão Sair */}
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200"
              >
                Sair
              </button>

              {/* Barra de Busca */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar produtos"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Botão Filtrar */}
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200">
                Filtrar
              </button>

              {/* Carrinho */}
              <div
                onClick={() => router.push("/cart")}
                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors duration-200 relative"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="font-medium">Carrinho</span>
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </div>

              {/* Usuário */}
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="font-medium">CLIENTE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de Filtros */}
          <aside className="lg:col-span-1">
            <Filters
              filters={filters}
              onFiltersChange={setFilters}
              availableCategories={availableCategories}
              availableSizes={availableSizes}
              availableColors={availableColors}
              activeFiltersCount={activeFiltersCount}
            />
          </aside>

          {/* Área de Produtos */}
          <div className="lg:col-span-3">
            {/* Título e Contador */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-gray-900">
                Nossos Produtos
              </h1>
              <span className="text-gray-900">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Grid de Produtos */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando produtos...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
                  >
                    {/* Imagem do Produto - Clicável */}
                    <div
                      onClick={() => router.push(`/productDetails/${product.id}`)}
                      className="w-full h-64 bg-gray-100 relative overflow-hidden cursor-pointer"
                    >
                      <Image
                        src={product.image || "/placeholder.png"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                      />
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Badges */}
                      <div className="flex gap-2 mb-2">
                        {product.isBestSeller && (
                          <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">
                            Mais Vendido
                          </span>
                        )}
                        {product.isOnSale && (
                          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                            Em Promoção
                          </span>
                        )}
                      </div>

                      {/* Nome do Produto - Clicável */}
                      <h3 
                        onClick={() => router.push(`/productDetails/${product.id}`)}
                        className="text-lg font-medium text-gray-900 mb-3 cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        {product.name}
                      </h3>

                      {/* Preço */}
                      <div className="mb-4 flex-grow">
                        {product.isOnSale && product.originalPrice ? (
                          <div>
                            <p className="text-lg text-gray-900 line-through opacity-60">
                              {formatPrice(product.originalPrice)}
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-gray-900">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>

                      {/* Botão Adicionar ao Carrinho */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCartClick(product);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                      >
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-16">
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhum produto encontrado
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tente ajustar os filtros para encontrar o que procura.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Seleção de Tamanho e Cor */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Selecionar opções
            </h2>
            <p className="text-gray-700 mb-4">{selectedProduct.name}</p>

            {/* Seleção de Tamanho */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho
              </label>
              <div className="grid grid-cols-4 gap-2">
                {selectedProduct.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border-2 rounded-md transition-colors ${
                      selectedSize === size
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção de Cor */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border-2 rounded-md transition-colors ${
                      selectedColor === color
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões do Modal */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAddToCart}
                disabled={!selectedSize || !selectedColor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
