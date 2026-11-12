import { useMemo } from 'react';
import { config } from '../data/config.js';
import './CategoryFilter.css';

export default function CategoryFilter({ products, category, onCategoryChange, cepa, onCepaChange, resultCount }) {
  const options = [{ id: 'todos', label: 'Todos' }, ...config.categories];

  // Cepas individuales derivadas del catálogo ("Chardonnay 70% / Pinot Noir 30%" aporta ambas).
  const cepas = useMemo(() => {
    const set = new Set();
    products.forEach((p) =>
      p.ficha_tecnica.cepa
        .split(/[,/]/)
        .map((c) => c.replace(/\d+%|rosado|vol\.?/gi, '').trim())
        .filter((c) => c && !/destilado/i.test(c))
        .forEach((c) => set.add(c)),
    );
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [products]);

  return (
    <div className="filters">
      <div className="filters__head">
        <h2 id="catalogo-titulo" className="filters__title">Catálogo</h2>
        <p className="filters__count num" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'producto' : 'productos'}
        </p>
      </div>
      <div className="filters__row">
        <div className="filters__chips" role="tablist" aria-label="Categorías">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={category === o.id}
              className={`filters__chip${category === o.id ? ' is-active' : ''}`}
              onClick={() => onCategoryChange(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <label className="filters__cepa">
          <span className="sr-only">Filtrar por cepa</span>
          <select className="select" value={cepa} onChange={(e) => onCepaChange(e.target.value)}>
            <option value="">Todas las cepas</option>
            {cepas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
