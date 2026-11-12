import ProductCard from './ProductCard.jsx';
import './ProductGrid.css';

export default function ProductGrid({ products, loading, error, onSelect, onResetFilters }) {
  if (loading) {
    return (
      <div className="grid" aria-busy="true" aria-label="Cargando productos">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="grid__skeleton" />)}
      </div>
    );
  }
  if (error) return <p className="grid__empty">No pudimos cargar el catálogo: {error}</p>;
  if (!products.length) {
    return (
      <div className="grid__empty">
        <p>No hay productos para esta combinación de filtros.</p>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onResetFilters}>Ver todo el catálogo</button>
      </div>
    );
  }
  return (
    <ul className="grid">
      {products.map((p) => (
        <li key={p.id}><ProductCard product={p} onSelect={onSelect} /></li>
      ))}
    </ul>
  );
}
