// Tipos e interfaces para produtos e filtros

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number; // Para produtos em promoção
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  isBestSeller?: boolean;
  isOnSale?: boolean;
}

export interface FilterState {
  category: string | null;
  priceRange: string | null;
  sizes: string[];
  colors: string[];
  showBestSellers: boolean;
  showOnSale: boolean;
}

