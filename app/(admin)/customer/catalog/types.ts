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
  stockByVariant?: Record<string, number>; // Estoque por variante (ex: {"Preto-M": 10, "Branco-G": 5})
  rating?: {
    stars: number; // 1-5
    count: number; // Número de avaliações
  };
  isBestSeller?: boolean;
  isOnSale?: boolean;
  features?: string[]; // Características (Qualidade Premium, Produção Sustentável, etc.)
}

// Tipo para produto vindo da API
export interface ApiProduct {
  id: number;
  nome: string;
  preco: number | string;
  categoria: {
    id: number;
    nome: string;
  };
  descricao?: string;
  cores?: string[] | null;
  tamanhos?: string[] | null;
  estoquePorVariante?: Record<string, number> | null;
  imagens?: Array<{
    id: number;
    url: string;
    ordem: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  category: string | null;
  priceRange: string | null;
  sizes: string[];
  colors: string[];
  showBestSellers: boolean;
  showOnSale: boolean;
}

