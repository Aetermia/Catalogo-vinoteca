import { useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { getCategoryLabel } from '../data/config.js';
import {
  calculateLineTotal,
  getPromoBadges,
  getPromoDescription,
  getPromoThreshold,
  getUnitPricing,
} from '../utils/pricing.js';
import { formatPrice } from '../utils/format.js';
import { useBodyLock, useEscape, useFocusReturn } from '../utils/hooks.js';
import Icon from './Icon.jsx';
import './ProductModal.css';

const FICHA_FIELDS = [
  ['bodega', 'Bodega'],
  ['cepa', 'Cepa'],
  ['region', 'Región'],
  ['crianza', 'Crianza'],
  ['maridaje', 'Maridaje'],
];

export default function ProductModal({ product, onClose }) {
  const { addItem, open: openCart, maxQty } = useCart();
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState(product.variantes[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const dialogRef = useRef(null);

  useBodyLock(true);
  useEscape(onClose);
  useFocusReturn(true, dialogRef);

  const variant = product.variantes.find((v) => v.id === variantId) ?? null;
  const unit = getUnitPricing(product, variant);
  const line = useMemo(() => calculateLineTotal(product, variant, quantity), [product, variant, quantity]);
  const promos = getPromoBadges(product);
  const promoText = getPromoDescription(product);
  const threshold = getPromoThreshold(product);
  const images = product.imagenes.length ? product.imagenes : [null];
  const ficha = FICHA_FIELDS.filter(([key]) => product.ficha_tecnica[key]);

  const handleAdd = () => {
    addItem(product, variant, quantity);
    onClose();
    openCart();
  };

  const step = (delta) => setQuantity((q) => Math.min(maxQty, Math.max(1, q + delta)));

  return (
    <div className="overlay pmodal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pmodal" role="dialog" aria-modal="true" aria-labelledby="pmodal-title" tabIndex={-1} ref={dialogRef}>
        <button type="button" className="icon-btn pmodal__close" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" />
        </button>

        <div className="pmodal__gallery">
          <div className="pmodal__stage">
            {images[imageIndex] ? (
              <img src={images[imageIndex]} alt={`${product.nombre}, imagen ${imageIndex + 1} de ${images.length}`} />
            ) : (
              <span className="pmodal__noimg">Sin imagen</span>
            )}
            {images.length > 1 && (
              <>
                <button type="button" className="pmodal__nav pmodal__nav--prev" aria-label="Imagen anterior"
                  onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}>
                  <Icon name="chevronLeft" />
                </button>
                <button type="button" className="pmodal__nav pmodal__nav--next" aria-label="Imagen siguiente"
                  onClick={() => setImageIndex((i) => (i + 1) % images.length)}>
                  <Icon name="chevronRight" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="pmodal__thumbs">
              {images.map((src, i) => (
                <button key={src + i} type="button" className={`pmodal__thumb${i === imageIndex ? ' is-active' : ''}`}
                  onClick={() => setImageIndex(i)} aria-label={`Ver imagen ${i + 1}`} aria-current={i === imageIndex}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pmodal__info">
          <p className="kicker">
            {getCategoryLabel(product.categoria)} · {product.es_caja ? 'Caja cerrada' : 'Botella individual'}
            {product.presentacion && ` · ${product.presentacion}`}
          </p>
          <h2 id="pmodal-title" className="pmodal__title">{product.nombre}</h2>
          {(promos.length > 0 || product.etiqueta) && (
            <div className="pmodal__badges">
              {promos.map((b) => <span key={b} className="badge badge--saving">{b}</span>)}
              {product.etiqueta && <span className="badge badge--accent">{product.etiqueta}</span>}
            </div>
          )}

          <div className="pmodal__price">
            {unit.hasDiscount && <span className="price-old">{formatPrice(unit.basePrice)}</span>}
            <span className="price-final pmodal__final">{formatPrice(unit.finalPrice)}</span>
            <span className="pmodal__unit">{product.es_caja ? 'por caja' : 'por unidad'}</span>
          </div>

          <p className="pmodal__desc">{product.descripcion}</p>

          {product.variantes.length > 0 && (
            <fieldset className="pmodal__variants">
              <legend className="field__label">{product.es_caja ? 'Composición' : 'Añada / formato'}</legend>
              {product.variantes.map((v) => {
                const p = getUnitPricing(product, v);
                return (
                  <label key={v.id} className={`variant${v.id === variantId ? ' is-active' : ''}`}>
                    <input type="radio" name="variante" value={v.id} checked={v.id === variantId} onChange={() => setVariantId(v.id)} />
                    <span className="variant__text">
                      <span className="variant__name">{v.nombre}</span>
                      {v.descripcion && <span className="variant__desc">{v.descripcion}</span>}
                    </span>
                    <span className="variant__price num">{formatPrice(p.finalPrice)}</span>
                  </label>
                );
              })}
            </fieldset>
          )}

          {promoText && (
            <p className="pmodal__promo">
              <strong>Promoción:</strong> {promoText}
            </p>
          )}

          <div className="pmodal__buy">
            <div className="stepper stepper--lg" role="group" aria-label="Cantidad">
              <button type="button" onClick={() => step(-1)} disabled={quantity <= 1} aria-label="Restar una unidad"><Icon name="minus" size={16} /></button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" onClick={() => step(1)} disabled={quantity >= maxQty} aria-label="Sumar una unidad"><Icon name="plus" size={16} /></button>
            </div>
            <button type="button" className="btn btn--primary pmodal__add" onClick={handleAdd}>
              Agregar · <span className="num">{formatPrice(line.lineTotal)}</span>
            </button>
          </div>
          <p className="pmodal__summary num">
            {line.savings > 0 ? (
              <span className="saving-text">Ahorrás {formatPrice(line.savings)} en esta compra</span>
            ) : threshold > 0 ? (
              <span>Sumá {threshold - quantity} más para activar la promoción</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </p>

          {ficha.length > 0 && (
            <section className="ficha" aria-labelledby="ficha-title">
              <h3 id="ficha-title" className="ficha__title">Ficha técnica y de cata</h3>
              <dl className="ficha__list">
                {ficha.map(([key, label]) => (
                  <div key={key} className="ficha__row">
                    <dt>{label}</dt>
                    <dd>{product.ficha_tecnica[key]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
