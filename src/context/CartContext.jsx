import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { calculateCartTotals } from '../utils/pricing.js';
import { config } from '../data/config.js';
import { safeStorage } from '../services/productService.js';

const CartContext = createContext(null);
const MAX_QTY = 99;

const lineKey = (productId, variantId) => `${productId}::${variantId ?? 'base'}`;

// Se persisten solo ids y cantidades; los datos del producto se rehidratan contra
// el catálogo vigente para que precios y promos siempre estén actualizados.
export function CartProvider({ products, children }) {
  const [entries, setEntries] = useState(() => safeStorage.get(config.storageKeys.cart, []));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    safeStorage.set(config.storageKeys.cart, entries);
  }, [entries]);

  const items = useMemo(() => {
    if (!products) return [];
    return entries
      .map((e) => {
        const product = products.find((p) => String(p.id) === String(e.productId));
        if (!product) return null;
        const variant = e.variantId ? product.variantes.find((v) => v.id === e.variantId) ?? null : null;
        if (e.variantId && !variant) return null;
        return { key: lineKey(product.id, variant?.id), product, variant, quantity: e.quantity };
      })
      .filter(Boolean);
  }, [entries, products]);

  const addItem = useCallback((product, variant, quantity = 1) => {
    setEntries((prev) => {
      const key = lineKey(product.id, variant?.id);
      const existing = prev.find((e) => lineKey(e.productId, e.variantId) === key);
      if (existing) {
        return prev.map((e) =>
          e === existing ? { ...e, quantity: Math.min(MAX_QTY, e.quantity + quantity) } : e,
        );
      }
      return [...prev, { productId: product.id, variantId: variant?.id ?? null, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((key, quantity) => {
    setEntries((prev) =>
      quantity <= 0
        ? prev.filter((e) => lineKey(e.productId, e.variantId) !== key)
        : prev.map((e) =>
            lineKey(e.productId, e.variantId) === key ? { ...e, quantity: Math.min(MAX_QTY, quantity) } : e,
          ),
    );
  }, []);

  const removeItem = useCallback((key) => setQuantity(key, 0), [setQuantity]);
  const clear = useCallback(() => setEntries([]), []);

  const totals = useMemo(() => calculateCartTotals(items), [items]);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  const value = {
    items,
    totals,
    count,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    addItem,
    setQuantity,
    removeItem,
    clear,
    maxQty: MAX_QTY,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
