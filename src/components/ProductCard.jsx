import { useCart } from '../context/CartContext.jsx';
import { getUnitPricing, getPromoBadges } from '../utils/pricing.js';
import { formatPrice } from '../utils/format.js';
import Icon from './Icon.jsx';
import './ProductCard.css';

export default function ProductCard({ product, onSelect }) {
  const { addItem, open } = useCart();
  const defaultVariant = product.variantes[0] ?? null;
  // Se muestra el precio más bajo entre las variantes ("Desde ...").
  const options = product.variantes.length ? product.variantes : [null];
  const pricings = options.map((v) => getUnitPricing(product, v));
  const { basePrice, finalPrice, hasDiscount } = pricings.reduce((min, p) => (p.finalPrice < min.finalPrice ? p : min));
  const hasRange = new Set(pricings.map((p) => p.finalPrice)).size > 1;
  const promos = getPromoBadges(product);
  const { bodega, cepa } = product.ficha_tecnica;
  const image = product.imagenes[0];

  const quickAdd = (e) => {
    e.stopPropagation();
    addItem(product, defaultVariant, 1);
    open();
  };

  return (
    <article className="card">
      <button type="button" className="card__media" onClick={() => onSelect(product)} aria-label={`Ver detalle de ${product.nombre}`}>
        {image ? <img src={image} alt="" loading="lazy" /> : <span className="card__noimg">Sin imagen</span>}
        <span className="card__badges">
          <span className="badge badge--outline">{product.es_caja ? product.presentacion || 'Caja cerrada' : product.presentacion || 'Botella 750 ml'}</span>
          {product.etiqueta && <span className="badge badge--accent">{product.etiqueta}</span>}
        </span>
        {promos.length > 0 && (
          <span className="card__promos">
            {promos.map((b) => <span key={b} className="badge badge--saving">{b}</span>)}
          </span>
        )}
      </button>
      <div className="card__body">
        <p className="card__meta">{[bodega, cepa].filter(Boolean).join(' · ')}</p>
        <h3 className="card__title">
          <button type="button" onClick={() => onSelect(product)}>{product.nombre}</button>
        </h3>
        <div className="card__footer">
          <div className="card__price">
            {hasDiscount && <span className="price-old card__old">{formatPrice(basePrice)}</span>}
            <span className="price-final card__final">
              {hasRange && <small>Desde </small>}
              {formatPrice(finalPrice)}
            </span>
          </div>
          <button type="button" className="card__add" onClick={quickAdd} aria-label={`Agregar ${product.nombre} al carrito`}>
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
