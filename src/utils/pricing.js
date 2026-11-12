// Motor de precios: funciones puras, sin dependencias de React ni del DOM.
// Todas las reglas comerciales de descuentos viven acá.

export const PROMO_TYPES = ['NONE', '2X1', '3X2', '2DA_UNIDAD_DESCUENTO'];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const clampPct = (n) => Math.min(100, Math.max(0, Number(n) || 0));

/**
 * Precio unitario de un producto (o de su variante) con el descuento directo aplicado.
 * La variante sin precio propio hereda el precio base del producto.
 */
export function getUnitPricing(product, selectedVariant = null) {
  const variantPrice = Number(selectedVariant?.precio);
  const basePrice = round2(variantPrice > 0 ? variantPrice : Number(product?.precio) || 0);
  const discountPct = clampPct(product?.descuento_porcentaje);
  const finalPrice = discountPct > 0 ? round2(basePrice * (1 - discountPct / 100)) : basePrice;
  return { basePrice, finalPrice, discountPct, hasDiscount: discountPct > 0 };
}

/** Normaliza el tipo de promoción; valores desconocidos se tratan como NONE. */
export function getPromoType(product) {
  const type = String(product?.tipo_promocion || 'NONE').toUpperCase();
  if (type === '2DA_UNIDAD_DESCUENTO' && clampPct(product?.descuento_segunda_unidad) === 0) return 'NONE';
  return PROMO_TYPES.includes(type) ? type : 'NONE';
}

/** Etiqueta corta para badges ("15% OFF", "3x2", "2da al 50%"). Devuelve la promo principal. */
export function getPromoBadges(product) {
  const badges = [];
  const pct = clampPct(product?.descuento_porcentaje);
  if (pct > 0) badges.push(`${pct}% OFF`);
  const type = getPromoType(product);
  if (type === '2X1') badges.push('2x1');
  if (type === '3X2') badges.push('3x2');
  if (type === '2DA_UNIDAD_DESCUENTO') badges.push(`2da al ${clampPct(product.descuento_segunda_unidad)}%`);
  return badges;
}

/** Texto explicativo de la promoción por cantidad, o null. */
export function getPromoDescription(product) {
  switch (getPromoType(product)) {
    case '2X1':
      return 'Llevando 2 unidades, pagás 1.';
    case '3X2':
      return 'Llevando 3 unidades, pagás 2.';
    case '2DA_UNIDAD_DESCUENTO':
      return `La segunda unidad de cada par tiene ${clampPct(product.descuento_segunda_unidad)}% de descuento.`;
    default:
      return null;
  }
}

/** Cantidad mínima para que la promo por cantidad se active (0 si no hay). */
export function getPromoThreshold(product) {
  const type = getPromoType(product);
  if (type === '3X2') return 3;
  if (type === '2X1' || type === '2DA_UNIDAD_DESCUENTO') return 2;
  return 0;
}

/**
 * Total de una línea del carrito.
 * - baseTotal: lo que costaría sin ningún descuento.
 * - lineTotal: lo que efectivamente se cobra.
 * - savings: diferencia total (descuento directo + promo por cantidad).
 */
export function calculateLineTotal(product, selectedVariant, quantity) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  const { basePrice, finalPrice, discountPct } = getUnitPricing(product, selectedVariant);
  const promoType = getPromoType(product);

  let lineTotal;
  let promoApplied = false;

  switch (promoType) {
    case '2X1': {
      const charged = Math.ceil(qty / 2);
      lineTotal = charged * finalPrice;
      promoApplied = qty >= 2;
      break;
    }
    case '3X2': {
      const charged = qty - Math.floor(qty / 3);
      lineTotal = charged * finalPrice;
      promoApplied = qty >= 3;
      break;
    }
    case '2DA_UNIDAD_DESCUENTO': {
      const pairs = Math.floor(qty / 2);
      const pct = clampPct(product.descuento_segunda_unidad);
      lineTotal = qty * finalPrice - pairs * finalPrice * (pct / 100);
      promoApplied = pairs > 0;
      break;
    }
    default:
      lineTotal = qty * finalPrice;
  }

  const baseTotal = round2(qty * basePrice);
  lineTotal = round2(lineTotal);
  const promoSavings = round2(qty * finalPrice - lineTotal);
  const directSavings = round2(baseTotal - qty * finalPrice);

  return {
    quantity: qty,
    unitBase: basePrice,
    unitFinal: finalPrice,
    discountPct,
    promoType,
    promoApplied,
    baseTotal,
    lineTotal,
    directSavings,
    promoSavings,
    savings: round2(baseTotal - lineTotal),
  };
}

/**
 * Totales del carrito. Cada item: { product, variant, quantity }.
 */
export function calculateCartTotals(items = []) {
  let subtotalBase = 0;
  let finalTotal = 0;
  for (const item of items) {
    const line = calculateLineTotal(item.product, item.variant, item.quantity);
    subtotalBase += line.baseTotal;
    finalTotal += line.lineTotal;
  }
  subtotalBase = round2(subtotalBase);
  finalTotal = round2(finalTotal);
  return { subtotalBase, totalDiscount: round2(subtotalBase - finalTotal), finalTotal };
}
