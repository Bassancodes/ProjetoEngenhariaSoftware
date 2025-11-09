"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Filters from "./Filters";
import { Product, FilterState } from "./types";
import { useCart } from "@/context/CartContext";

export default function CatalogPage() {
  const router = useRouter();
  const { addToCart, getItemCount } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // Dados estáticos dos produtos (será substituído por API futuramente)
  const allProducts: Product[] = [
    {
      id: 1,
      name: "Calça Legging Feminina",
      price: 189.99,
      originalPrice: 229.99,
      image: "/legging.png",
      images: ["/legging.png", "/legging.png", "/legging.png"],
      category: "Calças",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Preto", "Cinza", "Branco"],
      description: "Essencial em qualquer guarda-roupa, nossa calça jeans de lavagem escura é a peça-chave para compor looks que vão do casual ao sofisticado. Com um tom de azul profundo e design atemporal, ela oferece a combinação perfeita de conforto e estilo, adaptando-se a todas as ocasiões do seu dia, do trabalho ao happy hour.",
      rating: {
        stars: 5,
        count: 238,
      },
      isBestSeller: true,
      isOnSale: true,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
    },
    {
      id: 2,
      name: "Camiseta Básica Branca Algodão",
      price: 79.90,
      image: "/white-shirt.png",
      images: ["/white-shirt.png", "/white-shirt.png", "/white-shirt.png"],
      category: "Camisetas",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Branco", "Preto", "Cinza"],
      description: "A camiseta básica perfeita para o seu guarda-roupa. Feita com 100% algodão de alta qualidade, oferece conforto e durabilidade. Ideal para usar sozinha ou como camada base, combina perfeitamente com qualquer look casual ou esportivo.",
      rating: {
        stars: 4,
        count: 156,
      },
      isBestSeller: true,
      isOnSale: false,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
    },
    {
      id: 3,
      name: "Jaqueta de Couro Masculina Clássica",
      price: 549.00,
      originalPrice: 699.00,
      image: "/leather-jacket.png",
      images: ["/leather-jacket.png", "/leather-jacket.png", "/leather-jacket.png"],
      category: "Jaquetas",
      sizes: ["M", "G", "GG"],
      colors: ["Preto", "Marrom"],
      description: "Jaqueta de couro genuíno com design clássico e atemporal. Perfeita para adicionar um toque de estilo e elegância ao seu visual. Com forro interno confortável e acabamento impecável, esta jaqueta é um investimento para durar muitos anos.",
      rating: {
        stars: 5,
        count: 89,
      },
      isBestSeller: false,
      isOnSale: true,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
    },
    {
      id: 4,
      name: "Moletom Canguru com Capuz Cinza",
      price: 219.50,
      image: "/grey-sweatshirt.png",
      images: ["/grey-sweatshirt.png", "/grey-sweatshirt.png", "/grey-sweatshirt.png"],
      category: "Moletons",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Cinza", "Preto"],
      description: "Moletom confortável e estiloso com capuz e bolso canguru. Perfeito para os dias mais frios ou para um look casual e descontraído. Feito com tecido macio e resistente, garantindo conforto e durabilidade.",
      rating: {
        stars: 4,
        count: 201,
      },
      isBestSeller: true,
      isOnSale: false,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
    },
    {
      id: 5,
      name: "Camisa Polo Preta",
      price: 129.90,
      image: "/black-shirt.png",
      images: ["/black-shirt.png", "/black-shirt.png", "/black-shirt.png"],
      category: "Camisetas",
      sizes: ["M", "G", "GG"],
      colors: ["Preto", "Branco", "Azul"],
      description: "Camisa polo clássica em tom escuro, perfeita para ocasiões casuais e semi-formais. Com tecido de alta qualidade e corte moderno, oferece conforto e estilo em qualquer situação.",
      rating: {
        stars: 4,
        count: 124,
      },
      isBestSeller: false,
      isOnSale: false,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
    },
    {
      id: 6,
      name: "Bermuda Chino Amarela",
      price: 159.99,
      image: "/yellow-short.png",
      images: ["/yellow-short.png", "/yellow-short.png", "/yellow-short.png"],
      category: "Bermudas",
      sizes: ["P", "M", "G"],
      colors: ["Amarelo", "Bege"],
      description: "Bermuda chino em cor vibrante, ideal para o verão. Com tecido leve e respirável, oferece conforto e estilo durante os dias mais quentes. Perfeita para praia, esportes ou um look casual moderno.",
      rating: {
        stars: 4,
        count: 67,
      },
      isBestSeller: false,
      isOnSale: false,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
    },
  ];

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
  }, []);

  const availableSizes = useMemo(() => {
    const sizes = new Set(allProducts.flatMap((p) => p.sizes));
    return Array.from(sizes).sort();
  }, []);

  const availableColors = useMemo(() => {
    const colors = new Set(allProducts.flatMap((p) => p.colors));
    return Array.from(colors).sort();
  }, []);

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
        const hasMatchingSize = filters.sizes.some((size) =>
          product.sizes.includes(size)
        );
        if (!hasMatchingSize) return false;
      }

      // Filtro de cor
      if (filters.colors.length > 0) {
        const hasMatchingColor = filters.colors.some((color) =>
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
                onClick={() => router.push("/login")}
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
                onClick={() => router.push("/customer/cart")}
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
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
                  >
                    {/* Imagem do Produto - Clicável */}
                    <div 
                      onClick={() => router.push(`/customer/productDetails/${product.id}`)}
                      className="w-full h-64 bg-gray-100 relative overflow-hidden cursor-pointer"
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                        onClick={() => router.push(`/customer/productDetails/${product.id}`)}
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
                {selectedProduct.sizes.map((size) => (
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
                {selectedProduct.colors.map((color) => (
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
