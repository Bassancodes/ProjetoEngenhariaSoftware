"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/app/(admin)/catalog/types";

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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
