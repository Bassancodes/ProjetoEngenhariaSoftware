"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { Product } from "@/app/(admin)/customer/catalog/types";
import { useAuth } from "./AuthContext";

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  cartItemId: string; // ID único: productId-size-color
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string, color: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const DEFAULT_SIZES = ["P", "M", "G", "GG"];
const DEFAULT_COLORS = ["Preto", "Branco", "Cinza"];
const FALLBACK_IMAGE = "/placeholder.png";

type ApiCartItem = {
  id: number;
  name?: string;
  price?: number | string;
  image?: string;
  images?: string[];
  category?: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  description?: string | null;
};

const mapApiItemToCartItem = (item: ApiCartItem): CartItem => {
  const normalizedSize =
    typeof item.selectedSize === "string" && item.selectedSize.length > 0
      ? item.selectedSize
      : DEFAULT_SIZES[0];

  const normalizedColor =
    typeof item.selectedColor === "string" && item.selectedColor.length > 0
      ? item.selectedColor
      : DEFAULT_COLORS[0];

  const sizes = DEFAULT_SIZES.includes(normalizedSize)
    ? [...DEFAULT_SIZES]
    : [normalizedSize, ...DEFAULT_SIZES];

  const colors = DEFAULT_COLORS.includes(normalizedColor)
    ? [...DEFAULT_COLORS]
    : [normalizedColor, ...DEFAULT_COLORS];

  const images =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : [item.image || FALLBACK_IMAGE];

  return {
    id: item.id,
    name: item.name ?? "Produto",
    price:
      typeof item.price === "number" ? item.price : Number(item.price) || 0,
    image: item.image || images[0] || FALLBACK_IMAGE,
    images,
    category: item.category ?? "Sem categoria",
    sizes,
    colors,
    description: item.description ?? "",
    quantity: item.quantity ?? 1,
    selectedSize: normalizedSize,
    selectedColor: normalizedColor,
    cartItemId: `${item.id}-${normalizedSize}-${normalizedColor}`,
  };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, isAuthenticated, isLoading } = useAuth();
  const isHydrating = useRef(false);
  const shouldSkipNextSync = useRef(false);
  const hasHydratedForUser = useRef<string | null>(null);
  const isSyncing = useRef(false);

  const addToCart = (product: Product, size: string, color: string) => {
    setItems((prevItems) => {
      const cartItemId = `${product.id}-${size}-${color}`;
      // Verificar se o item já existe com mesmo ID, tamanho e cor
      const existingItemIndex = prevItems.findIndex(
        (item) => item.cartItemId === cartItemId
      );

      if (existingItemIndex >= 0) {
        // Se existe, incrementar quantidade
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        // Se não existe, adicionar novo item
        return [
          ...prevItems,
          {
            ...product,
            quantity: 1,
            selectedSize: size,
            selectedColor: color,
            cartItemId,
          },
        ];
      }
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user?.id) {
      setItems([]);
      hasHydratedForUser.current = null;
      return;
    }

    if (
      hasHydratedForUser.current === user.id ||
      isHydrating.current ||
      items.length > 0
    ) {
      hasHydratedForUser.current = user.id;
      return;
    }

    const abortController = new AbortController();

    const loadCart = async () => {
      isHydrating.current = true;
      try {
        const response = await fetch(`/api/cart/list?usuarioId=${user.id}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          console.error("Erro ao buscar carrinho do servidor:", await response.json());
          return;
        }

        const data: { items?: ApiCartItem[] } = await response.json();

        if (Array.isArray(data.items)) {
          shouldSkipNextSync.current = true;
          setItems(data.items.map(mapApiItemToCartItem));
        }
        hasHydratedForUser.current = user.id;
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Erro inesperado ao carregar carrinho:", error);
        }
      } finally {
        isHydrating.current = false;
      }
    };

    loadCart();

    return () => {
      abortController.abort();
    };
  }, [isAuthenticated, isLoading, user?.id, items.length]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user?.id) {
      return;
    }

    if (isHydrating.current) {
      return;
    }

    if (shouldSkipNextSync.current) {
      shouldSkipNextSync.current = false;
      return;
    }

    const abortController = new AbortController();

    const persistCart = async () => {
      if (isSyncing.current) {
        return;
      }

      isSyncing.current = true;
      try {
        const response = await fetch("/api/cart/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: user.id,
            items: items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
              cartItemId: item.cartItemId,
            })),
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          console.error("Erro ao salvar carrinho no servidor:", await response.json());
        }
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Erro inesperado ao salvar carrinho:", error);
        }
      } finally {
        isSyncing.current = false;
      }
    };

    persistCart();

    return () => {
      abortController.abort();
    };
  }, [items, isAuthenticated, isLoading, user?.id]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
