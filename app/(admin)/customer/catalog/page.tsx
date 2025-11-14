"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Filters from "./Filters";
import { Product, FilterState, ApiProduct } from "./types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CustomerHeader } from "@/components/CustomerHeader";
import { ProductSelectionModal } from "@/components/ProductSelectionModal";

export default function CatalogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, getItemCount } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função auxiliar para extrair cores e tamanhos de uma chave de variante
  const parseVariantKey = (key: string): { cor: string; tamanho: string } => {
    const parts = key.split('-');
    if (parts.length !== 2) {
      return { cor: '', tamanho: '' };
    }
    return {
      cor: parts[0].trim(),
      tamanho: parts[1].trim()
    };
  };

  // Função para extrair cores e tamanhos disponíveis baseado no estoquePorVariante
  const getAvailableOptions = (
    stockByVariant: Record<string, number> | null | undefined,
    allCores: string[],
    allTamanhos: string[]
  ): { cores: string[]; tamanhos: string[] } => {
    if (!stockByVariant || Object.keys(stockByVariant).length === 0) {
      return { cores: allCores, tamanhos: allTamanhos };
    }

    const coresComEstoque = new Set<string>();
    const tamanhosComEstoque = new Set<string>();

    for (const [key, stock] of Object.entries(stockByVariant)) {
      if (stock > 0) {
        const { cor, tamanho } = parseVariantKey(key);
        if (cor) coresComEstoque.add(cor);
        if (tamanho) tamanhosComEstoque.add(tamanho);
      }
    }

    const coresDisponiveis = allCores.filter(cor => coresComEstoque.has(cor));
    const tamanhosDisponiveis = allTamanhos.filter(tamanho => tamanhosComEstoque.has(tamanho));

    return {
      cores: coresDisponiveis,
      tamanhos: tamanhosDisponiveis,
    };
  };

  // Função para verificar se uma combinação cor-tamanho tem estoque disponível
  const hasStockForVariant = (
    stockByVariant: Record<string, number> | null | undefined,
    cor: string,
    tamanho: string
  ): boolean => {
    if (!stockByVariant || Object.keys(stockByVariant).length === 0) {
      return true;
    }
    const variantKey = `${cor}-${tamanho}`;
    const stock = stockByVariant[variantKey];
    return stock !== undefined && stock > 0;
  };

  // Função para converter produto da API para o formato do frontend
  const convertApiProductToProduct = (apiProduct: ApiProduct): Product => {
    const images = apiProduct.imagens && apiProduct.imagens.length > 0
      ? apiProduct.imagens.map(img => img.url)
      : ["/placeholder.png"];
    
    const price = typeof apiProduct.preco === 'string' 
      ? parseFloat(apiProduct.preco) 
      : Number(apiProduct.preco);

    // Converter cores do banco (JSON) para array de strings
    let cores: string[] = [];
    if (apiProduct.cores) {
      if (Array.isArray(apiProduct.cores)) {
        cores = apiProduct.cores
          .filter(cor => typeof cor === 'string')
          .flatMap(cor => {
            if (cor.includes(',')) {
              return cor.split(',').map(c => c.trim()).filter(c => c.length > 0);
            }
            return [cor.trim()];
          })
          .filter((cor, index, self) => self.indexOf(cor) === index);
      }
    }

    // Converter tamanhos do banco (JSON) para array de strings
    let tamanhos: string[] = [];
    if (apiProduct.tamanhos) {
      if (Array.isArray(apiProduct.tamanhos)) {
        tamanhos = apiProduct.tamanhos
          .filter(tamanho => typeof tamanho === 'string')
          .flatMap(tamanho => {
            if (tamanho.includes(',')) {
              return tamanho.split(',').map(t => t.trim()).filter(t => t.length > 0);
            }
            return [tamanho.trim()];
          })
          .filter((tamanho, index, self) => self.indexOf(tamanho) === index);
      }
    }

    // Processar estoquePorVariante
    let stockByVariant: Record<string, number> | undefined = undefined;
    if (apiProduct.estoquePorVariante && typeof apiProduct.estoquePorVariante === 'object') {
      stockByVariant = apiProduct.estoquePorVariante as Record<string, number>;
    }

    // Filtrar cores e tamanhos baseado no estoque disponível
    const { cores: coresDisponiveis, tamanhos: tamanhosDisponiveis } = getAvailableOptions(
      stockByVariant,
      cores,
      tamanhos
    );

    return {
      id: apiProduct.id,
      name: apiProduct.nome,
      price: price,
      image: images[0] || "/placeholder.png",
      images: images,
      category: apiProduct.categoria.nome,
      sizes: tamanhosDisponiveis,
      colors: coresDisponiveis,
      description: apiProduct.descricao || "",
      stockByVariant: stockByVariant,
      isBestSeller: false,
      isOnSale: false,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
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
        if (filters.priceRange.includes("+")) {
          // Para ranges do tipo "500+"
          const min = Number(filters.priceRange.replace("+", ""));
          if (product.price <= min) return false;
        } else {
          // Para ranges normais "100-200"
          const [min, max] = filters.priceRange.split("-");
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

  // Função para obter cores disponíveis baseado no tamanho selecionado
  const getAvailableColors = (product: Product, selectedSize: string): string[] => {
    if (!product.stockByVariant || Object.keys(product.stockByVariant).length === 0) {
      return product.colors;
    }

    if (!selectedSize) {
      const coresComEstoque = new Set<string>();
      for (const [key, stock] of Object.entries(product.stockByVariant)) {
        if (stock > 0) {
          const { cor } = parseVariantKey(key);
          if (cor) coresComEstoque.add(cor);
        }
      }
      return product.colors.filter(cor => coresComEstoque.has(cor));
    }

    const coresDisponiveis = new Set<string>();
    for (const [key, stock] of Object.entries(product.stockByVariant)) {
      if (stock > 0) {
        const { cor, tamanho } = parseVariantKey(key);
        if (tamanho === selectedSize && cor) {
          coresDisponiveis.add(cor);
        }
      }
    }

    return product.colors.filter(cor => coresDisponiveis.has(cor));
  };

  // Função para obter tamanhos disponíveis baseado na cor selecionada
  const getAvailableSizes = (product: Product, selectedColor: string): string[] => {
    if (!product.stockByVariant || Object.keys(product.stockByVariant).length === 0) {
      return product.sizes;
    }

    if (!selectedColor) {
      const tamanhosComEstoque = new Set<string>();
      for (const [key, stock] of Object.entries(product.stockByVariant)) {
        if (stock > 0) {
          const { tamanho } = parseVariantKey(key);
          if (tamanho) tamanhosComEstoque.add(tamanho);
        }
      }
      return product.sizes.filter(tamanho => tamanhosComEstoque.has(tamanho));
    }

    const tamanhosDisponiveis = new Set<string>();
    for (const [key, stock] of Object.entries(product.stockByVariant)) {
      if (stock > 0) {
        const { cor, tamanho } = parseVariantKey(key);
        if (cor === selectedColor && tamanho) {
          tamanhosDisponiveis.add(tamanho);
        }
      }
    }

    return product.sizes.filter(tamanho => tamanhosDisponiveis.has(tamanho));
  };

  // Função para abrir modal de seleção
  const handleAddToCartClick = (product: Product) => {
    // Só abrir se o produto tiver tamanhos e cores definidos
    if (product.sizes.length === 0 || product.colors.length === 0) {
      addToCart(product, "", "");
      return;
    }
    
    // Resetar estado antes de abrir
    setIsPanelOpen(false);
    setSelectedProduct(product);
    
    // Selecionar primeira cor e tamanho disponíveis
    const coresDisponiveis = getAvailableColors(product, "");
    const tamanhosDisponiveis = getAvailableSizes(product, "");
    
    setSelectedColor(coresDisponiveis[0] || "");
    setSelectedSize(tamanhosDisponiveis[0] || "");
    setShowModal(true);
    
    // Pequeno delay para permitir renderização antes da animação
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPanelOpen(true);
      });
    });
  };

  // Handler para selecionar tamanho
  const handleSizeSelect = (size: string) => {
    if (!selectedProduct) return;
    setSelectedSize(size);
    
    // Se a cor selecionada não está disponível para este tamanho, resetar cor
    if (selectedColor && !hasStockForVariant(selectedProduct.stockByVariant, selectedColor, size)) {
      const coresDisponiveis = getAvailableColors(selectedProduct, size);
      setSelectedColor(coresDisponiveis[0] || "");
    }
  };

  // Handler para selecionar cor
  const handleColorSelect = (color: string) => {
    if (!selectedProduct) return;
    setSelectedColor(color);
    
    // Se o tamanho selecionado não está disponível para esta cor, resetar tamanho
    if (selectedSize && !hasStockForVariant(selectedProduct.stockByVariant, color, selectedSize)) {
      const tamanhosDisponiveis = getAvailableSizes(selectedProduct, color);
      setSelectedSize(tamanhosDisponiveis[0] || "");
    }
  };

  // Função para confirmar adição ao carrinho
  const handleConfirmAddToCart = () => {
    if (selectedProduct && selectedSize && selectedColor) {
      // Validar se a combinação tem estoque
      if (!hasStockForVariant(selectedProduct.stockByVariant, selectedColor, selectedSize)) {
        alert("Esta combinação de cor e tamanho não está disponível em estoque.");
        return;
      }
      addToCart(selectedProduct, selectedSize, selectedColor);
      closePanel();
    }
  };

  // Função para fechar o painel com animação
  const closePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setShowModal(false);
      setSelectedProduct(null);
      setSelectedSize("");
      setSelectedColor("");
      setIsPanelOpen(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white">
      <CustomerHeader
        subtitle="BAXEIN WEAR - Product Catalog"
        profileMenuItems={[
          { label: "Meus Pedidos", href: "/customer/orders" },
          { label: "Meu Carrinho", href: "/customer/cart" },
        ]}
        actions={
          <>
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-black"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200">
              Filtrar
            </button>
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
          </>
        }
      />

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
                      onClick={() =>
                        router.push(`/customer/productDetails/${product.id}`)
                      }
                      className="w-full h-64 bg-gray-100 relative overflow-hidden cursor-pointer"
                    >
                      <img
                        src={product.image || "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-cover"
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
      <ProductSelectionModal
        showModal={showModal}
        selectedProduct={selectedProduct}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        isPanelOpen={isPanelOpen}
        onSizeSelect={handleSizeSelect}
        onColorSelect={handleColorSelect}
        onConfirm={handleConfirmAddToCart}
        onClose={closePanel}
      />
    </div>
  );
}
