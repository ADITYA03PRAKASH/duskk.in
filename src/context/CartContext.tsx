"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  productId: string;
  comboId?: string;
  isCombo?: boolean;
  variantId?: string | null;
  variantTitle?: string | null;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
  stockQuantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  addComboToCart: (combo: any, quantity?: number) => void;
  removeItem: (idOrKey: string) => void;
  updateQuantity: (idOrKey: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "duskk_shopping_cart_v1";

function getCartItemKey(item: { productId: string; comboId?: string; variantId?: string | null }): string {
  if (item.comboId) return `combo_${item.comboId}`;
  return `${item.productId}_${item.variantId || "default"}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to storage:", e);
      }
    }
  }, [items, isInitialized]);

  const addItem = (itemData: Omit<CartItem, "quantity">, quantity: number = 1) => {
    const targetKey = getCartItemKey(itemData);
    setItems((prev) => {
      const existing = prev.find((i) => getCartItemKey(i) === targetKey);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, itemData.stockQuantity || 99);
        return prev.map((i) =>
          getCartItemKey(i) === targetKey ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          ...itemData,
          quantity: Math.min(quantity, itemData.stockQuantity || 99),
        },
      ];
    });
    setIsCartOpen(true);
  };

  const addComboToCart = (combo: any, quantity: number = 1) => {
    addItem(
      {
        productId: combo.id,
        comboId: combo.id,
        isCombo: true,
        variantId: null,
        variantTitle: `${combo.items?.length || combo.itemsCount || 0} pieces set`,
        name: combo.title,
        sku: `COMBO-${(combo.slug || combo.id).toUpperCase()}`,
        price: Number(combo.price),
        mrp: Number(combo.mrp || combo.price),
        image:
          combo.imageUrl ||
          combo.image_url ||
          (Array.isArray(combo.galleryImages) ? combo.galleryImages[0] : null) ||
          "/placeholder.jpg",
        stockQuantity: 25,
      },
      quantity
    );
  };

  const removeItem = (idOrKey: string) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          getCartItemKey(i) !== idOrKey &&
          i.productId !== idOrKey &&
          i.comboId !== idOrKey
      )
    );
  };

  const updateQuantity = (idOrKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(idOrKey);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        const match =
          getCartItemKey(i) === idOrKey ||
          i.productId === idOrKey ||
          i.comboId === idOrKey;
        return match
          ? { ...i, quantity: Math.min(quantity, i.stockQuantity || 99) }
          : i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addComboToCart,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
