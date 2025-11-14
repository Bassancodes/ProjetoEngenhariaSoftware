"use client";

import Image from "next/image";
import { useMemo } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  sizes: string[];
  colors: string[];
  description?: string;
  stockByVariant?: Record<string, number>;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  originalPrice?: number;
  features?: string[];
}

interface ProductSelectionModalProps {
  showModal: boolean;
  selectedProduct: Product | null;
  selectedSize: string;
  selectedColor: string;
  isPanelOpen: boolean;
  onSizeSelect: (size: string) => void;
  onColorSelect: (color: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ProductSelectionModal({
  showModal,
  selectedProduct,
  selectedSize,
  selectedColor,
  isPanelOpen,
  onSizeSelect,
  onColorSelect,
  onConfirm,
  onClose,
}: ProductSelectionModalProps) {
  // Função auxiliar para extrair cores e tamanhos de uma chave de variante
  // Formato da API: "Preto-M" -> { cor: "Preto", tamanho: "M" }
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
  
  // Função para obter a quantidade em estoque de uma variante específica
  const getStockForVariant = (
    stockByVariant: Record<string, number> | null | undefined,
    cor: string,
    tamanho: string
  ): number => {
    if (!stockByVariant || Object.keys(stockByVariant).length === 0) {
      return 0;
    }

    const variantKey = `${cor}-${tamanho}`;
    return stockByVariant[variantKey] || 0;
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

  // Calcular cores e tamanhos disponíveis no modal
  const availableColorsInModal = useMemo(() => {
    if (!selectedProduct) return [];
    return getAvailableColors(selectedProduct, selectedSize);
  }, [selectedProduct, selectedSize]);

  const availableSizesInModal = useMemo(() => {
    if (!selectedProduct) return [];
    return getAvailableSizes(selectedProduct, selectedColor);
  }, [selectedProduct, selectedColor]);

  // Verificar se a combinação selecionada tem estoque
  const hasStockForSelection = useMemo(() => {
    if (!selectedProduct || !selectedSize || !selectedColor) return false;
    return hasStockForVariant(selectedProduct.stockByVariant, selectedColor, selectedSize);
  }, [selectedProduct, selectedSize, selectedColor]);

  // Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (!showModal || !selectedProduct) return null;

  return (
    <>
      {/* Overlay com blur */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Painel Modal */}
      <div 
        className={`fixed top-0 right-0 h-full w-[95vw] sm:w-[500px] bg-gradient-to-b from-white to-gray-50 shadow-2xl z-[70] transform transition-transform duration-300 ease-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          willChange: 'transform'
        }}
      >
        <div className="h-full flex flex-col">
          {/* Cabeçalho do Painel */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all duration-200"
              aria-label="Fechar"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-bold pr-10">
              Personalize seu produto
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Escolha o tamanho e a cor perfeitos para você
            </p>
          </div>

          {/* Conteúdo do Painel */}
          <div className="flex-1 overflow-y-auto">
            {/* Imagem do Produto */}
            <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              <Image
                src={selectedProduct.image || "/placeholder.png"}
                alt={selectedProduct.name}
                fill
                className="object-cover"
                sizes="500px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Informações do Produto */}
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedProduct.name}
                </h3>
                <p className="text-3xl font-extrabold text-blue-600">
                  {formatPrice(selectedProduct.price)}
                </p>
                {selectedProduct.description && (
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              {/* Seleção de Tamanho */}
              {availableSizesInModal.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-base font-semibold text-gray-900">
                      Tamanho
                    </label>
                    {selectedSize && selectedColor && (
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {getStockForVariant(selectedProduct.stockByVariant, selectedColor, selectedSize)} em estoque
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {availableSizesInModal.map((size: string) => {
                      const isAvailable = selectedColor
                        ? hasStockForVariant(selectedProduct.stockByVariant, selectedColor, size)
                        : true;
                      const stock = selectedColor 
                        ? getStockForVariant(selectedProduct.stockByVariant, selectedColor, size)
                        : 0;
                      const isLowStock = stock > 0 && stock <= 3;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => onSizeSelect(size)}
                          className={`relative px-4 py-4 border-2 rounded-lg transition-all duration-200 font-bold text-lg ${
                            selectedSize === size
                              ? "border-blue-600 bg-blue-600 text-white shadow-lg scale-105"
                              : isAvailable
                              ? "border-gray-300 hover:border-blue-500 hover:shadow-md hover:scale-102 text-gray-700 bg-white"
                              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                          }`}
                          disabled={!isAvailable}
                        >
                          {size.toUpperCase()}
                          {isLowStock && selectedColor && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seleção de Cor */}
              {availableColorsInModal.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-base font-semibold text-gray-900">
                      Cor
                    </label>
                    {selectedColor && (
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {selectedColor}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableColorsInModal.map((color: string) => {
                      const isAvailable = selectedSize
                        ? hasStockForVariant(selectedProduct.stockByVariant, color, selectedSize)
                        : true;
                      const stock = selectedSize 
                        ? getStockForVariant(selectedProduct.stockByVariant, color, selectedSize)
                        : 0;
                      const isLowStock = stock > 0 && stock <= 3;
                      
                      return (
                        <button
                          key={color}
                          onClick={() => onColorSelect(color)}
                          className={`relative px-6 py-3 border-2 rounded-lg transition-all duration-200 font-medium ${
                            selectedColor === color
                              ? "border-blue-600 bg-blue-600 text-white shadow-lg scale-105"
                              : isAvailable
                              ? "border-gray-300 hover:border-blue-500 hover:shadow-md hover:scale-102 text-gray-700 bg-white"
                              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                          }`}
                          disabled={!isAvailable}
                        >
                          {color}
                          {isLowStock && selectedSize && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensagem se não houver opções disponíveis */}
              {availableSizesInModal.length === 0 && availableColorsInModal.length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    Produto indisponível
                  </p>
                  <p className="text-gray-500 text-sm">
                    Este produto não possui opções de tamanho ou cor disponíveis em estoque no momento.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé do Painel com Botões */}
          <div className="p-6 border-t border-gray-200 bg-white shadow-lg">
            {selectedSize && selectedColor && hasStockForSelection && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium text-sm">
                    Seleção válida! {getStockForVariant(selectedProduct.stockByVariant, selectedColor, selectedSize)} unidades disponíveis
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={!selectedSize || !selectedColor || !hasStockForSelection || availableSizesInModal.length === 0 || availableColorsInModal.length === 0}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

