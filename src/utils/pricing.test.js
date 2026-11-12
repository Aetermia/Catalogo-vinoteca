import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUnitPricing, calculateLineTotal, calculateCartTotals, getPromoBadges } from './pricing.js';
import { buildOrderMessage, buildWhatsAppLink } from './whatsapp.js';
import { catalog } from '../data/catalog.js';
import { config } from '../data/config.js';

const byId = (id) => catalog.find((p) => p.id === id);

test('variante sin precio hereda el base; con precio lo reemplaza; aplica % OFF', () => {
  const malbec = byId(1);
  assert.deepEqual(getUnitPricing(malbec, malbec.variantes[0]).finalPrice, 15725);
  assert.equal(getUnitPricing(malbec, malbec.variantes[1]).basePrice, 23900);
  assert.equal(getUnitPricing(malbec, malbec.variantes[1]).finalPrice, 20315);
});

test('3X2: 3 unidades pagan 2, 7 pagan 5', () => {
  const cf = byId(2);
  assert.equal(calculateLineTotal(cf, null, 3).lineTotal, 49600);
  assert.equal(calculateLineTotal(cf, null, 3).savings, 24800);
  assert.equal(calculateLineTotal(cf, null, 7).lineTotal, 5 * 24800);
  assert.equal(calculateLineTotal(cf, null, 2).promoApplied, false);
});

test('2X1: cobra ceil(q/2)', () => {
  const esp = byId(5);
  assert.equal(calculateLineTotal(esp, null, 3).lineTotal, 2 * 21300);
  assert.equal(calculateLineTotal(esp, null, 1).lineTotal, 21300);
});

test('2da unidad al 50%: por cada par completo', () => {
  const ch = byId(3);
  assert.equal(calculateLineTotal(ch, null, 2).lineTotal, 14200 * 1.5);
  assert.equal(calculateLineTotal(ch, null, 3).lineTotal, 14200 * 2.5);
});

test('totales del carrito: botella 3x2 x3 + caja 15% OFF', () => {
  const items = [
    { product: byId(2), variant: null, quantity: 3 },
    { product: byId(7), variant: null, quantity: 1 },
  ];
  const t = calculateCartTotals(items);
  assert.equal(t.subtotalBase, 74400 + 79800);
  assert.equal(t.finalTotal, 49600 + 67830);
  assert.equal(t.totalDiscount, 24800 + 11970);
});

test('badges de promo', () => {
  assert.deepEqual(getPromoBadges(byId(1)), ['15% OFF']);
  assert.deepEqual(getPromoBadges(byId(3)), ['2da al 50%']);
  assert.deepEqual(getPromoBadges(byId(2)), ['3x2']);
});

test('mensaje y link de WhatsApp', () => {
  const msg = buildOrderMessage({
    items: [{ product: byId(2), variant: null, quantity: 3 }],
    customer: { nombre: 'Ana Pérez', entrega: 'envio', direccion: 'Olavarría 520', pago: 'mercadopago' },
    config,
  });
  assert.match(msg, /3 x Cabernet Franc Gran Corte/);
  assert.match(msg, /Promo aplicada: 3x2/);
  assert.match(msg, /Dirección: Olavarría 520/);
  assert.match(msg, /Medio de pago: Mercado Pago/);
  const link = buildWhatsAppLink('+54 9 11 5555-0123', msg);
  assert.ok(link.startsWith('https://wa.me/5491155550123?text='));
});
