import { useEffect, useMemo, useRef, useState } from 'react';
import { config, getCategoryLabel } from '../../data/config.js';
import {
  deleteProduct,
  getProducts,
  resetDemoCatalog,
  saveProduct,
  uploadImage,
} from '../../services/productService.js';
import { getPromoBadges, getUnitPricing, calculateLineTotal } from '../../utils/pricing.js';
import { formatPrice } from '../../utils/format.js';
import Icon from '../Icon.jsx';
import './AdminPanel.css';

const emptyProduct = () => ({
  id: null,
  nombre: '',
  categoria: config.categories[0].id,
  es_caja: false,
  presentacion: 'Botella 750 ml',
  descripcion: '',
  ficha_tecnica: { bodega: '', cepa: '', region: '', crianza: '', maridaje: '' },
  precio: '',
  imagenes: [],
  variantes: [],
  descuento_porcentaje: 0,
  tipo_promocion: 'NONE',
  descuento_segunda_unidad: 0,
  etiqueta: '',
  activo: true,
});

const FICHA_FIELDS = [
  ['bodega', 'Bodega / Destilería', 'Ej. Finca Los Arces'],
  ['cepa', 'Cepa', 'Ej. Malbec'],
  ['region', 'Región', 'Ej. Valle de Uco, Mendoza'],
  ['crianza', 'Crianza', 'Ej. 12 meses en roble francés'],
  ['maridaje', 'Maridaje', 'Ej. Carnes rojas, quesos duros'],
];

function validateProduct(p) {
  const errors = {};
  if (!p.nombre.trim()) errors.nombre = 'Obligatorio.';
  if (!(Number(p.precio) > 0)) errors.precio = 'Ingresá un precio mayor a 0.';
  const pct = Number(p.descuento_porcentaje);
  if (pct < 0 || pct > 90) errors.descuento_porcentaje = 'Entre 0 y 90.';
  if (p.tipo_promocion === '2DA_UNIDAD_DESCUENTO') {
    const d = Number(p.descuento_segunda_unidad);
    if (!(d > 0 && d <= 100)) errors.descuento_segunda_unidad = 'Entre 1 y 100.';
  }
  p.variantes.forEach((v, i) => {
    if (!v.nombre.trim()) errors[`variante_${i}`] = 'La variante necesita un nombre.';
  });
  return errors;
}

export default function AdminPanel({ mode, session, onLogout }) {
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(null);

  const load = () => getProducts({ includeInactive: true }).then(setProducts).catch((e) => flash(e.message, 'error'));
  useEffect(() => {
    load();
  }, []);

  const flash = (text, type = 'ok') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => `${p.nombre} ${p.ficha_tecnica.bodega} ${p.ficha_tecnica.cepa}`.toLowerCase().includes(q)) : products;
  }, [products, query]);

  const handleSave = async (product) => {
    const saved = await saveProduct(product);
    await load();
    setEditing(null);
    flash(product.id ? `"${saved.nombre}" actualizado.` : `"${saved.nombre}" creado.`);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProduct(p.id);
      await load();
      flash(`"${p.nombre}" eliminado.`);
    } catch (e) {
      flash(e.message, 'error');
    }
  };

  const toggleActive = async (p) => {
    try {
      await saveProduct({ ...p, activo: !p.activo });
      await load();
    } catch (e) {
      flash(e.message, 'error');
    }
  };

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__bar-inner">
          <div className="admin__brand">
            <span className="admin__brand-name">{config.brand.name}</span>
            <span className={`admin__mode${mode === 'demo' ? ' is-demo' : ''}`}>{mode === 'demo' ? 'Modo demo' : 'Servidor'}</span>
          </div>
          <div className="admin__bar-actions">
            <a href="#" className="btn btn--ghost btn--sm">Ver tienda</a>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout} title={`Sesión: ${session.usuario}`}>
              <Icon name="logout" size={16} /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="admin__main">
        {editing ? (
          <ProductForm initial={editing} onCancel={() => setEditing(null)} onSave={handleSave} />
        ) : (
          <>
            <div className="admin__head">
              <div>
                <h1 className="admin__title">Productos</h1>
                <p className="admin__sub num">
                  {products ? `${products.length} en total · ${products.filter((p) => p.activo).length} visibles en la tienda` : 'Cargando…'}
                </p>
              </div>
              <div className="admin__head-actions">
                {mode === 'demo' && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => {
                    if (window.confirm('¿Restaurar el catálogo de ejemplo? Se pierden los cambios hechos en este navegador.')) {
                      setProducts(resetDemoCatalog());
                      flash('Catálogo de ejemplo restaurado.');
                    }
                  }}>
                    Restaurar demo
                  </button>
                )}
                <button type="button" className="btn btn--primary" onClick={() => setEditing(emptyProduct())}>
                  <Icon name="plus" size={16} /> Nuevo producto
                </button>
              </div>
            </div>

            <label className="admin__search">
              <Icon name="search" size={16} />
              <span className="sr-only">Buscar</span>
              <input className="input" placeholder="Buscar por nombre, bodega o cepa" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>

            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="is-num">Precio</th>
                    <th>Oferta</th>
                    <th>Visible</th>
                    <th><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const { basePrice, finalPrice } = getUnitPricing(p, null);
                    return (
                      <tr key={p.id} className={p.activo ? '' : 'is-inactive'}>
                        <td>
                          <div className="admin__prod">
                            <span className="admin__thumb">{p.imagenes[0] && <img src={p.imagenes[0]} alt="" />}</span>
                            <span>
                              <strong>{p.nombre}</strong>
                              <small>{[p.ficha_tecnica.bodega, p.presentacion].filter(Boolean).join(' · ')}</small>
                            </span>
                          </div>
                        </td>
                        <td>{getCategoryLabel(p.categoria)}{p.es_caja && <small className="admin__tag">Caja</small>}</td>
                        <td className="is-num num">
                          {finalPrice !== basePrice && <small className="price-old">{formatPrice(basePrice)}</small>}
                          {formatPrice(finalPrice)}
                        </td>
                        <td>
                          <div className="admin__badges">
                            {getPromoBadges(p).map((b) => <span key={b} className="badge badge--saving">{b}</span>)}
                            {!getPromoBadges(p).length && <span className="admin__none">—</span>}
                          </div>
                        </td>
                        <td>
                          <button type="button" role="switch" aria-checked={p.activo} className={`switch${p.activo ? ' is-on' : ''}`}
                            onClick={() => toggleActive(p)} aria-label={`Visible en tienda: ${p.nombre}`}>
                            <span />
                          </button>
                        </td>
                        <td>
                          <div className="admin__row-actions">
                            <button type="button" className="icon-btn" onClick={() => setEditing(p)} aria-label={`Editar ${p.nombre}`}><Icon name="edit" size={18} /></button>
                            <button type="button" className="icon-btn admin__danger" onClick={() => handleDelete(p)} aria-label={`Eliminar ${p.nombre}`}><Icon name="trash" size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {products && !filtered.length && (
                    <tr><td colSpan={6} className="admin__empty">No hay productos que coincidan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {notice && <div className={`admin__toast${notice.type === 'error' ? ' is-error' : ''}`} role="status">{notice.text}</div>}
    </div>
  );
}

/* ---------------- Formulario ---------------- */

function ProductForm({ initial, onCancel, onSave }) {
  const [p, setP] = useState(() => ({
    ...initial,
    precio: initial.precio === '' ? '' : String(initial.precio),
    etiqueta: initial.etiqueta ?? '',
    variantes: initial.variantes.map((v) => ({ ...v, precio: v.precio == null ? '' : String(v.precio) })),
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileRef = useRef(null);

  const set = (field, value) => setP((prev) => ({ ...prev, [field]: value }));
  const setFicha = (field, value) => setP((prev) => ({ ...prev, ficha_tecnica: { ...prev.ficha_tecnica, [field]: value } }));
  const setVariant = (i, field, value) =>
    setP((prev) => ({ ...prev, variantes: prev.variantes.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)) }));

  const addVariant = () =>
    setP((prev) => ({
      ...prev,
      variantes: [...prev.variantes, { id: `v-${Date.now().toString(36)}`, nombre: '', descripcion: '', precio: '' }],
    }));
  const removeVariant = (i) => setP((prev) => ({ ...prev, variantes: prev.variantes.filter((_, idx) => idx !== i) }));
  const moveImage = (i, dir) =>
    setP((prev) => {
      const imgs = [...prev.imagenes];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return prev;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...prev, imagenes: imgs };
    });

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/|img\/|data:image\/)/i.test(url)) {
      setImageError('Ingresá una URL válida (https://...).');
      return;
    }
    set('imagenes', [...p.imagenes, url]);
    setImageUrl('');
    setImageError(null);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setP((prev) => ({ ...prev, imagenes: [...prev.imagenes, url] }));
    } catch (err) {
      setImageError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleCaja = (checked) =>
    setP((prev) => ({
      ...prev,
      es_caja: checked,
      categoria: checked ? 'cajas' : prev.categoria === 'cajas' ? config.categories[0].id : prev.categoria,
      presentacion: checked
        ? prev.presentacion.startsWith('Caja') ? prev.presentacion : 'Caja x6 · 750 ml'
        : prev.presentacion.startsWith('Caja') ? 'Botella 750 ml' : prev.presentacion,
    }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateProduct(p);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        ...p,
        nombre: p.nombre.trim(),
        precio: Number(p.precio),
        descuento_porcentaje: Number(p.descuento_porcentaje) || 0,
        descuento_segunda_unidad: p.tipo_promocion === '2DA_UNIDAD_DESCUENTO' ? Number(p.descuento_segunda_unidad) || 0 : 0,
        etiqueta: p.etiqueta.trim() || null,
        variantes: p.variantes.map((v) => ({ ...v, nombre: v.nombre.trim(), precio: Number(v.precio) > 0 ? Number(v.precio) : null })),
      });
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  // Vista previa del precio con las reglas reales del motor.
  const preview = useMemo(() => {
    const draft = {
      ...p,
      precio: Number(p.precio) || 0,
      descuento_porcentaje: Number(p.descuento_porcentaje) || 0,
      descuento_segunda_unidad: Number(p.descuento_segunda_unidad) || 0,
    };
    const qty = p.tipo_promocion === '3X2' ? 3 : p.tipo_promocion === 'NONE' ? 1 : 2;
    return { qty, unit: getUnitPricing(draft, null), line: calculateLineTotal(draft, null, qty), badges: getPromoBadges(draft) };
  }, [p]);

  return (
    <form className="pform" onSubmit={submit} noValidate>
      <div className="admin__head">
        <div>
          <button type="button" className="pform__back" onClick={onCancel}><Icon name="arrowLeft" size={16} /> Productos</button>
          <h1 className="admin__title">{p.id ? 'Editar producto' : 'Nuevo producto'}</h1>
        </div>
      </div>

      <div className="pform__grid">
        <div className="pform__col">
          <section className="pform__card">
            <h2 className="pform__h">Datos generales</h2>
            <label className="field">
              <span className="field__label">Nombre</span>
              <input className="input" value={p.nombre} onChange={(e) => set('nombre', e.target.value)} aria-invalid={!!errors.nombre} placeholder="Ej. Malbec Reserva" />
              {errors.nombre && <span className="field__error">{errors.nombre}</span>}
            </label>
            <div className="pform__row">
              <label className="field">
                <span className="field__label">Categoría</span>
                <select className="select" value={p.categoria} onChange={(e) => set('categoria', e.target.value)}>
                  {config.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Presentación</span>
                <input className="input" value={p.presentacion} onChange={(e) => set('presentacion', e.target.value)} placeholder="Botella 750 ml / Caja x6 · 750 ml" />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={p.es_caja} onChange={(e) => toggleCaja(e.target.checked)} />
              <span>
                <strong>Es caja cerrada</strong>
                <small>Se vende como unidad completa con su propio precio (no se separa por botella).</small>
              </span>
            </label>
            <label className="field">
              <span className="field__label">Descripción</span>
              <textarea className="textarea" rows={4} value={p.descripcion} onChange={(e) => set('descripcion', e.target.value)}
                placeholder="Notas de nariz y boca, estilo, para qué ocasión recomendarlo." />
            </label>
            <div className="pform__row">
              <label className="field">
                <span className="field__label">Etiqueta destacada (opcional)</span>
                <input className="input" value={p.etiqueta} maxLength={50} onChange={(e) => set('etiqueta', e.target.value)} placeholder="Ej. Más vendido" />
              </label>
              <label className="check check--inline">
                <input type="checkbox" checked={p.activo} onChange={(e) => set('activo', e.target.checked)} />
                <span><strong>Visible en la tienda</strong></span>
              </label>
            </div>
          </section>

          <section className="pform__card">
            <h2 className="pform__h">Ficha técnica y de cata</h2>
            <div className="pform__row">
              {FICHA_FIELDS.map(([key, label, ph]) => (
                <label key={key} className={`field${key === 'maridaje' ? ' pform__full' : ''}`}>
                  <span className="field__label">{label}</span>
                  <input className="input" value={p.ficha_tecnica[key]} onChange={(e) => setFicha(key, e.target.value)} placeholder={ph} />
                </label>
              ))}
            </div>
          </section>

          <section className="pform__card">
            <div className="pform__h-row">
              <h2 className="pform__h">Variantes (opcional)</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={addVariant}><Icon name="plus" size={14} /> Agregar variante</button>
            </div>
            <p className="field__hint">Añadas, formatos o composiciones de caja. Si una variante no tiene precio, usa el precio base. Si hay variantes, el cliente debe elegir una.</p>
            {p.variantes.map((v, i) => (
              <div key={v.id} className="vrow">
                <label className="field">
                  <span className="field__label">Nombre</span>
                  <input className="input" value={v.nombre} onChange={(e) => setVariant(i, 'nombre', e.target.value)} aria-invalid={!!errors[`variante_${i}`]} placeholder="Ej. Añada 2020" />
                </label>
                <label className="field vrow__desc">
                  <span className="field__label">Descripción</span>
                  <input className="input" value={v.descripcion} onChange={(e) => setVariant(i, 'descripcion', e.target.value)} placeholder="Ej. Guarda en roble" />
                </label>
                <label className="field">
                  <span className="field__label">Precio propio</span>
                  <input className="input num" type="number" min="0" step="1" value={v.precio} onChange={(e) => setVariant(i, 'precio', e.target.value)} placeholder="Base" />
                </label>
                <button type="button" className="icon-btn admin__danger vrow__remove" onClick={() => removeVariant(i)} aria-label="Quitar variante"><Icon name="trash" size={18} /></button>
                {errors[`variante_${i}`] && <span className="field__error vrow__error">{errors[`variante_${i}`]}</span>}
              </div>
            ))}
          </section>
        </div>

        <div className="pform__col">
          <section className="pform__card">
            <h2 className="pform__h">Precio y ofertas</h2>
            <label className="field">
              <span className="field__label">Precio base ({config.currency.code})</span>
              <input className="input num" type="number" min="0" step="1" value={p.precio} onChange={(e) => set('precio', e.target.value)} aria-invalid={!!errors.precio} />
              {errors.precio && <span className="field__error">{errors.precio}</span>}
            </label>
            <label className="field">
              <span className="field__label">Descuento directo (%)</span>
              <input className="input num" type="number" min="0" max="90" value={p.descuento_porcentaje} onChange={(e) => set('descuento_porcentaje', e.target.value)} aria-invalid={!!errors.descuento_porcentaje} />
              {errors.descuento_porcentaje && <span className="field__error">{errors.descuento_porcentaje}</span>}
            </label>
            <label className="field">
              <span className="field__label">Promoción por cantidad</span>
              <select className="select" value={p.tipo_promocion} onChange={(e) => set('tipo_promocion', e.target.value)}>
                {config.promotionTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            {p.tipo_promocion === '2DA_UNIDAD_DESCUENTO' && (
              <label className="field">
                <span className="field__label">Descuento 2da unidad (%)</span>
                <input className="input num" type="number" min="1" max="100" value={p.descuento_segunda_unidad} onChange={(e) => set('descuento_segunda_unidad', e.target.value)} aria-invalid={!!errors.descuento_segunda_unidad} />
                {errors.descuento_segunda_unidad && <span className="field__error">{errors.descuento_segunda_unidad}</span>}
              </label>
            )}
            <div className="pform__preview num">
              <p className="field__label">Vista previa</p>
              <p>
                Unidad: {preview.unit.hasDiscount && <span className="price-old">{formatPrice(preview.unit.basePrice)}</span>}{' '}
                <strong>{formatPrice(preview.unit.finalPrice)}</strong>
              </p>
              {preview.qty > 1 && (
                <p>
                  {preview.qty} unidades: <strong>{formatPrice(preview.line.lineTotal)}</strong>{' '}
                  {preview.line.savings > 0 && <span className="saving-text">(ahorro {formatPrice(preview.line.savings)})</span>}
                </p>
              )}
              <div className="admin__badges">{preview.badges.map((b) => <span key={b} className="badge badge--saving">{b}</span>)}</div>
            </div>
          </section>

          <section className="pform__card">
            <h2 className="pform__h">Imágenes</h2>
            <p className="field__hint">La primera imagen es la portada. JPG, PNG o WEBP de hasta 5 MB.</p>
            {p.imagenes.length > 0 && (
              <ul className="imgs">
                {p.imagenes.map((src, i) => (
                  <li key={src + i} className="imgs__item">
                    <img src={src} alt="" />
                    <div className="imgs__actions">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Mover antes"><Icon name="chevronLeft" size={14} /></button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === p.imagenes.length - 1} aria-label="Mover después"><Icon name="chevronRight" size={14} /></button>
                      <button type="button" onClick={() => set('imagenes', p.imagenes.filter((_, idx) => idx !== i))} aria-label="Quitar imagen"><Icon name="close" size={14} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="imgs__add">
              <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Pegar URL de imagen"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }} />
              <button type="button" className="btn btn--ghost btn--sm" onClick={addImageUrl}>Agregar</button>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
            <button type="button" className="btn btn--ghost btn--block" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Icon name="upload" size={16} /> {uploading ? 'Subiendo…' : 'Subir imagen'}
            </button>
            {imageError && <p className="field__error">{imageError}</p>}
          </section>
        </div>
      </div>

      <div className="pform__actions">
        {saveError && <p className="field__error" role="alert">{saveError}</p>}
        {Object.keys(errors).length > 0 && <p className="field__error">Revisá los campos marcados.</p>}
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar producto'}</button>
      </div>
    </form>
  );
}
