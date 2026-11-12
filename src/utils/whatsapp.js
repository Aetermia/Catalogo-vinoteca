// Generación del mensaje de pedido y del enlace de WhatsApp. Funciones puras.
import { calculateLineTotal, calculateCartTotals, getPromoBadges } from './pricing.js';
import { formatPrice } from './format.js';

export function buildWhatsAppLink(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * @param {object}   params
 * @param {Array}    params.items     [{ product, variant, quantity }]
 * @param {object}   params.customer  { nombre, entrega: 'retiro'|'envio', direccion, pago, notas }
 * @param {object}   params.config    configuración de marca (src/data/config.js)
 */
export function buildOrderMessage({ items, customer, config }) {
  const lines = [];
  lines.push(`*Nuevo pedido — ${config.brand.name}*`);
  lines.push('');
  lines.push('*Detalle*');

  items.forEach((item) => {
    const { product, variant, quantity } = item;
    const line = calculateLineTotal(product, variant, quantity);
    const formato = product.es_caja
      ? `Caja cerrada${product.presentacion ? ` (${product.presentacion})` : ''}`
      : product.presentacion || 'Botella';
    lines.push(`• ${quantity} x ${product.nombre}`);
    lines.push(`   ${formato}`);
    if (variant) lines.push(`   Variante: ${variant.nombre}`);
    lines.push(`   Precio unitario: ${formatPrice(line.unitFinal)}${line.discountPct ? ` (${line.discountPct}% OFF)` : ''}`);
    const promos = getPromoBadges(product).filter((b) => !b.includes('OFF'));
    if (promos.length && line.promoApplied) lines.push(`   Promo aplicada: ${promos.join(', ')}`);
    if (line.savings > 0) lines.push(`   Ahorro: ${formatPrice(line.savings)}`);
    lines.push(`   Subtotal: ${formatPrice(line.lineTotal)}`);
  });

  const totals = calculateCartTotals(items);
  lines.push('');
  lines.push(`Subtotal: ${formatPrice(totals.subtotalBase)}`);
  if (totals.totalDiscount > 0) lines.push(`Descuentos: -${formatPrice(totals.totalDiscount)}`);
  lines.push(`*Total: ${formatPrice(totals.finalTotal)}*`);
  lines.push('');
  lines.push('*Datos del cliente*');
  lines.push(`Nombre: ${customer.nombre.trim()}`);
  if (customer.entrega === 'envio') {
    lines.push(`Entrega: ${config.delivery.shippingLabel}`);
    lines.push(`Dirección: ${customer.direccion.trim()}`);
  } else {
    lines.push(`Entrega: ${config.delivery.pickupLabel}`);
  }
  const pago = config.paymentMethods.find((p) => p.id === customer.pago)?.label ?? customer.pago;
  lines.push(`Medio de pago: ${pago}`);
  if (customer.notas?.trim()) lines.push(`Notas: ${customer.notas.trim()}`);
  lines.push('');
  lines.push('Confirmo que soy mayor de 18 años.');

  return lines.join('\n');
}
