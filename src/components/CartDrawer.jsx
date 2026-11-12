import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { config } from '../data/config.js';
import { calculateLineTotal, getPromoBadges } from '../utils/pricing.js';
import { formatPrice } from '../utils/format.js';
import { buildOrderMessage, buildWhatsAppLink } from '../utils/whatsapp.js';
import { safeStorage } from '../services/productService.js';
import { useBodyLock, useEscape, useFocusReturn } from '../utils/hooks.js';
import Icon from './Icon.jsx';
import './CartDrawer.css';

const emptyCustomer = { nombre: '', entrega: 'retiro', direccion: '', pago: config.paymentMethods[0].id, notas: '' };

function validate(c) {
  const errors = {};
  if (c.nombre.trim().length < 3) errors.nombre = 'Ingresá tu nombre completo.';
  if (c.entrega === 'envio' && c.direccion.trim().length < 5) errors.direccion = 'Ingresá la dirección de entrega.';
  return errors;
}

export default function CartDrawer() {
  const { items, totals, count, isOpen, close, setQuantity, removeItem, clear, maxQty } = useCart();
  const [customer, setCustomer] = useState(() => ({ ...emptyCustomer, ...safeStorage.get(config.storageKeys.customer, {}) }));
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const panelRef = useRef(null);

  useBodyLock(isOpen);
  useEscape(close, isOpen);
  useFocusReturn(isOpen, panelRef);

  useEffect(() => {
    // Se recuerdan nombre, dirección y preferencias para el próximo pedido (no las notas).
    const { notas, ...rest } = customer;
    safeStorage.set(config.storageKeys.customer, rest);
  }, [customer]);

  useEffect(() => {
    if (!isOpen) setSent(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const errors = validate(customer);
  const isValid = Object.keys(errors).length === 0;
  const update = (field) => (e) => setCustomer((c) => ({ ...c, [field]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || !items.length) return;
    const message = buildOrderMessage({ items, customer, config });
    window.open(buildWhatsAppLink(config.whatsapp.phone, message), '_blank', 'noopener');
    setSent(true);
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1} ref={panelRef}>
        <header className="drawer__head">
          <h2 id="drawer-title" className="drawer__title">
            Tu pedido <span className="num drawer__count">({count})</span>
          </h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Cerrar carrito"><Icon name="close" /></button>
        </header>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <p>Tu carrito está vacío.</p>
            <button type="button" className="btn btn--ghost" onClick={close}>Seguir explorando</button>
          </div>
        ) : (
          <form className="drawer__body" onSubmit={submit} noValidate>
            <ul className="drawer__items">
              {items.map((item) => {
                const line = calculateLineTotal(item.product, item.variant, item.quantity);
                const promos = getPromoBadges(item.product);
                return (
                  <li key={item.key} className="citem">
                    <div className="citem__img">
                      {item.product.imagenes[0] && <img src={item.product.imagenes[0]} alt="" />}
                    </div>
                    <div className="citem__main">
                      <div className="citem__top">
                        <p className="citem__name">{item.product.nombre}</p>
                        <button type="button" className="citem__remove" onClick={() => removeItem(item.key)} aria-label={`Quitar ${item.product.nombre}`}>
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                      <p className="citem__meta">
                        {[item.product.es_caja ? 'Caja cerrada' : null, item.product.presentacion || 'Botella', item.variant?.nombre]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="citem__unit num">
                        {formatPrice(line.unitFinal)} c/u
                        {promos.length > 0 && <span className="citem__promo">{promos.join(' + ')}</span>}
                      </p>
                      <div className="citem__bottom">
                        <div className="stepper" role="group" aria-label={`Cantidad de ${item.product.nombre}`}>
                          <button type="button" onClick={() => setQuantity(item.key, item.quantity - 1)} aria-label="Restar una unidad"><Icon name="minus" size={14} /></button>
                          <output>{item.quantity}</output>
                          <button type="button" onClick={() => setQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= maxQty} aria-label="Sumar una unidad"><Icon name="plus" size={14} /></button>
                        </div>
                        <div className="citem__total">
                          {line.savings > 0 && <span className="price-old">{formatPrice(line.baseTotal)}</span>}
                          <span className="price-final">{formatPrice(line.lineTotal)}</span>
                        </div>
                      </div>
                      {line.savings > 0 && <p className="citem__saving saving-text">Ahorro aplicado: {formatPrice(line.savings)}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>

            <fieldset className="drawer__form">
              <legend className="drawer__section">Datos para el pedido</legend>
              <label className="field">
                <span className="field__label">Nombre completo</span>
                <input className="input" value={customer.nombre} onChange={update('nombre')} autoComplete="name"
                  aria-invalid={touched && !!errors.nombre} placeholder="Ej. Lucía Fernández" />
                {touched && errors.nombre && <span className="field__error">{errors.nombre}</span>}
              </label>

              <div className="field">
                <span className="field__label">Entrega</span>
                <div className="segmented" role="radiogroup" aria-label="Forma de entrega">
                  {[
                    ['retiro', config.delivery.pickupLabel, 'store'],
                    ['envio', config.delivery.shippingLabel, 'truck'],
                  ].map(([id, label, icon]) => (
                    <label key={id} className={`segmented__opt${customer.entrega === id ? ' is-active' : ''}`}>
                      <input type="radio" name="entrega" value={id} checked={customer.entrega === id} onChange={update('entrega')} />
                      <Icon name={icon} size={18} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {customer.entrega === 'retiro' && <span className="field__hint">{config.brand.address}</span>}
              </div>

              {customer.entrega === 'envio' && (
                <label className="field">
                  <span className="field__label">Dirección de entrega</span>
                  <input className="input" value={customer.direccion} onChange={update('direccion')} autoComplete="street-address"
                    aria-invalid={touched && !!errors.direccion} placeholder="Calle, número, piso y barrio" />
                  {touched && errors.direccion ? (
                    <span className="field__error">{errors.direccion}</span>
                  ) : (
                    <span className="field__hint">{config.delivery.shippingNote}</span>
                  )}
                </label>
              )}

              <label className="field">
                <span className="field__label">Medio de pago</span>
                <select className="select" value={customer.pago} onChange={update('pago')}>
                  {config.paymentMethods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Notas (opcional)</span>
                <input className="input" value={customer.notas} onChange={update('notas')} placeholder="Ej. es para regalo, timbre 3B" />
              </label>
            </fieldset>

            <div className="drawer__foot">
              <dl className="totals num">
                <div><dt>Subtotal</dt><dd>{formatPrice(totals.subtotalBase)}</dd></div>
                <div className="totals__saving"><dt>Descuentos aplicados</dt><dd>{totals.totalDiscount > 0 ? `-${formatPrice(totals.totalDiscount)}` : formatPrice(0)}</dd></div>
                <div className="totals__final"><dt>Total</dt><dd>{formatPrice(totals.finalTotal)}</dd></div>
              </dl>
              <button type="submit" className="btn btn--primary btn--block drawer__submit">
                <Icon name="whatsapp" size={18} /> Enviar pedido por WhatsApp
              </button>
              {sent ? (
                <p className="drawer__note">
                  Abrimos WhatsApp con tu pedido. Cuando lo envíes, te confirmamos stock y entrega.{' '}
                  <button type="button" className="drawer__link" onClick={() => { clear(); close(); }}>Vaciar carrito</button>
                </p>
              ) : (
                <p className="drawer__note">El pedido se confirma por WhatsApp. No se realiza ningún cobro en este sitio.</p>
              )}
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
