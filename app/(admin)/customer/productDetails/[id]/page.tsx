"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Product, ApiProduct } from "@/app/(admin)/customer/catalog/types";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { addToCart, getItemCount } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const productId = parseInt(params.id as string);

  // Função para converter produto da API para o formato do frontend
  const convertApiProductToProduct = (apiProduct: ApiProduct): Product => {
    const images = apiProduct.imagens && apiProduct.imagens.length > 0
      ? apiProduct.imagens.map(img => img.url)
      : ["/placeholder.png"];
    
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
      sizes: ["P", "M", "G", "GG"],
      colors: ["Preto", "Branco", "Cinza"],
      description: apiProduct.descricao || "",
      isBestSeller: false,
      isOnSale: false,
      features: ["Qualidade Premium", "Produção Sustentável", "Troca Fácil"],
    };
  };

  // Buscar produto da API
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const url = user?.id 
          ? `/api/products/list?usuarioId=${user.id}`
          : `/api/products/list`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok && data.produtos) {
          const apiProduct = data.produtos.find((p: ApiProduct) => p.id === productId);
          if (apiProduct) {
            setProduct(convertApiProductToProduct(apiProduct));
          }
        } else {
          console.error("Erro ao carregar produto:", data.error);
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, user?.id]);

  // Estados para seleção
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // Inicializar seleções padrão
  useMemo(() => {
    if (product) {
      if (!selectedSize && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
      if (!selectedColor && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product, selectedSize, selectedColor]);

  // Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Função para renderizar estrelas
  const renderStars = (stars: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < stars ? "text-yellow-400 fill-current" : "text-gray-300"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // Função para adicionar ao carrinho
  const handleAddToCart = () => {
    if (product && selectedSize && selectedColor) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product, selectedSize, selectedColor);
      }
      // Opcional: mostrar notificação de sucesso
    }
  };

  // Função para comprar agora
  const handleBuyNow = () => {
    if (product && selectedSize && selectedColor) {
      handleAddToCart();
      router.push("/customer/cart");
    }
  };

  // Função para obter cor em formato CSS
  const getColorValue = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      Preto: "#000000",
      Branco: "#FFFFFF",
      Cinza: "#808080",
      Marrom: "#8B4513",
      Amarelo: "#FFD700",
      Bege: "#F5F5DC",
      Azul: "#0000FF",
    };
    return colorMap[colorName] || "#CCCCCC";
  };

  // Se está carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  // Se produto não encontrado
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h1>
          <button
            onClick={() => router.push("/customer/catalog")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md transition-colors"
          >
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    );
  }

  // Obter imagens do produto (usar images se disponível, senão usar image)
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image, product.image, product.image]; // Fallback para 3 imagens

  const mainImage = productImages[selectedImageIndex] || productImages[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo - Logo */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-900 mb-0.5">BAXEIN WEAR - {product.name}</div>
                <div className="text-lg font-bold text-gray-800">BAXEINWEAR</div>
              </div>
            </div>

            {/* Lado Direito - Ações */}
            <div className="flex items-center gap-4">
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
                  placeholder="Pesquisar produtos..."
                  className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent w-48 text-sm"
                  style={{ '--tw-ring-color': '#2784D5' } as React.CSSProperties}
                />
              </div>

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
      <main className="max-w-7xl mx-auto px-4 pt-16 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seção de Imagens */}
          <div>
            {/* Imagem Principal */}
            <div className="w-full aspect-square bg-white rounded-lg shadow-md overflow-hidden mb-2 relative max-h-[550px]">
              <Image
                src={mainImage || "/placeholder.png"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Galeria de Thumbnails */}
            <div className="flex gap-2">
              {productImages.slice(0, 3).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-16 bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={selectedImageIndex === index ? { borderColor: '#2784D5' } : {}}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={img || "/placeholder.png"}
                      alt={`${product.name} - Vista ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seção de Detalhes */}
          <div className="flex flex-col">
            {/* Brand */}
            <div className="text-xs text-gray-900 mb-1">BAXEIN WEAR</div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

            {/* Avaliações */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {renderStars(product.rating.stars)}
                </div>
                <span className="text-gray-900 text-xs">
                  ({product.rating.count} avaliações)
                </span>
              </div>
            )}

            {/* Descrição */}
            {product.description && (
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Preço */}
            <div className="mb-4">
              {product.isOnSale && product.originalPrice ? (
                <div>
                  <p className="text-lg text-gray-900 line-through opacity-60 mb-1">
                    {formatPrice(product.originalPrice)}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            {/* Seleção de Tamanho */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Tamanho
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 border-2 rounded-md text-sm font-medium transition-all ${
                      selectedSize === size
                        ? "bg-opacity-10"
                        : "border-gray-300 hover:border-gray-400 text-gray-700 bg-white"
                    }`}
                    style={selectedSize === size ? { 
                      borderColor: '#2784D5', 
                      backgroundColor: 'rgba(39, 132, 213, 0.1)',
                      color: '#2784D5'
                    } : {}}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção de Cor */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Cor
              </label>
              <div className="flex gap-2">
                {product.colors.map((color) => {
                  const colorValue = getColorValue(color);
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        isSelected
                          ? ""
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={isSelected ? { 
                        borderColor: '#2784D5',
                        boxShadow: '0 0 0 2px rgba(39, 132, 213, 0.3)',
                        backgroundColor: colorValue
                      } : {
                        backgroundColor: colorValue
                      }}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Seletor de Quantidade */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Quantidade
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border-2 border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium">-</span>
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-8 border-2 border-gray-300 rounded-md text-center text-sm font-medium focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#2784D5' } as React.CSSProperties}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 border-2 border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium">+</span>
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedColor}
                className="w-full text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                style={{ 
                  backgroundColor: !selectedSize || !selectedColor ? undefined : '#2784D5',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#1e6bb8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#2784D5';
                  }
                }}
              >
                Adicionar ao Carrinho
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!selectedSize || !selectedColor}
                className="w-full border-2 font-medium py-2.5 px-4 rounded-md transition-colors disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                style={!selectedSize || !selectedColor ? {} : {
                  borderColor: '#2784D5',
                  color: '#2784D5',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'rgba(39, 132, 213, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Comprar Agora
              </button>
            </div>

            {/* Características */}
            {product.features && product.features.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 mb-1 flex items-center justify-center">
                      {index === 0 && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#2784D5' }}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      {index === 1 && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#2784D5' }}>
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      )}
                      {index === 2 && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2784D5' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-gray-900 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-4">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Links */}
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">Empresa</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Ajuda</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Legal</a>
            </div>

            {/* Redes Sociais */}
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.897 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.897-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.057-1.274-.07-1.649-.07-4.844 0-3.196.016-3.586.074-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.057 1.65-.07 4.859-.07zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

