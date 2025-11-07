// Tipos e interfaces para produtos e filtros

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number; // Para produtos em promoção
  image: string;
  images?: string[]; // Galeria completa de imagens
  category: string;
  sizes: string[];
  colors: string[];
  description?: string; // Descrição completa do produto
  rating?: {
    stars: number; // 1-5
    count: number; // Número de avaliações
  };
  isBestSeller?: boolean;
  isOnSale?: boolean;
  features?: string[]; // Características (Qualidade Premium, Produção Sustentável, etc.)
}

export interface FilterState {
  category: string | null;
  priceRange: string | null;
  sizes: string[];
  colors: string[];
  showBestSellers: boolean;
  showOnSale: boolean;
}

