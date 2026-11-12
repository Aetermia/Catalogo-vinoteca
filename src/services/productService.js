// Capa de datos híbrida: intenta la API PHP y, si no responde (error de red, 404,
// respuesta no JSON), opera en modo demo con catalog.js + localStorage.
import { catalog } from '../data/catalog.js';
import { config } from '../data/config.js';

const API_URL = (import.meta.env.VITE_API_URL || '/backend/api').replace(/\/$/, '');
const KEYS = config.storageKeys;

let mode = null; // 'api' | 'demo'
let modePromise = null;

const safeStorage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* almacenamiento lleno o bloqueado: se ignora */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

/* ---------- Normalización ---------- */

const parseJSON = (value, fallback) => {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export function normalizeProduct(raw) {
  const ficha = parseJSON(raw.ficha_tecnica, {}) || {};
  const variantes = (parseJSON(raw.variantes, []) || []).map((v, i) => ({
    id: v.id ?? `v-${i}`,
    nombre: v.nombre ?? '',
    descripcion: v.descripcion ?? '',
    precio: v.precio === '' || v.precio == null ? null : Number(v.precio),
  }));
  return {
    id: Number(raw.id) || raw.id,
    nombre: raw.nombre ?? '',
    categoria: raw.categoria ?? '',
    es_caja: raw.es_caja === true || Number(raw.es_caja) === 1,
    presentacion: raw.presentacion ?? '',
    descripcion: raw.descripcion ?? '',
    ficha_tecnica: {
      bodega: ficha.bodega ?? '',
      cepa: ficha.cepa ?? '',
      region: ficha.region ?? '',
      crianza: ficha.crianza ?? '',
      maridaje: ficha.maridaje ?? '',
    },
    precio: Number(raw.precio) || 0,
    imagenes: (parseJSON(raw.imagenes, []) || []).filter(Boolean),
    variantes,
    descuento_porcentaje: Number(raw.descuento_porcentaje) || 0,
    tipo_promocion: raw.tipo_promocion || 'NONE',
    descuento_segunda_unidad: Number(raw.descuento_segunda_unidad) || 0,
    etiqueta: raw.etiqueta || null,
    activo: raw.activo === undefined ? true : raw.activo === true || Number(raw.activo) === 1,
  };
}

/* ---------- API ---------- */

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const res = await fetch(`${API_URL}/${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    const err = new Error(`Respuesta inválida del servidor (${res.status})`);
    err.status = res.status;
    err.network = true;
    throw err;
  }
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    const err = new Error(json.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** Detecta (una sola vez) si la API PHP está disponible. */
export function detectMode() {
  if (mode) return Promise.resolve(mode);
  if (!modePromise) {
    modePromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const json = await request('products.php', { signal: controller.signal });
        clearTimeout(timer);
        mode = Array.isArray(json.data) ? 'api' : 'demo';
      } catch {
        mode = 'demo';
      }
      return mode;
    })();
  }
  return modePromise;
}

export const getMode = () => mode;

/* ---------- Modo demo ---------- */

function demoRead() {
  const stored = safeStorage.get(KEYS.demoProducts);
  return Array.isArray(stored) ? stored.map(normalizeProduct) : catalog.map(normalizeProduct);
}
const demoWrite = (list) => safeStorage.set(KEYS.demoProducts, list);

export function resetDemoCatalog() {
  safeStorage.remove(KEYS.demoProducts);
  return demoRead();
}

/* ---------- Productos ---------- */

export async function getProducts({ includeInactive = false } = {}) {
  if ((await detectMode()) === 'api') {
    const json = await request(`products.php${includeInactive ? '?all=1' : ''}`);
    return json.data.map(normalizeProduct);
  }
  const list = demoRead();
  return includeInactive ? list : list.filter((p) => p.activo);
}

export async function saveProduct(product) {
  const payload = normalizeProduct(product);
  if ((await detectMode()) === 'api') {
    const isNew = !product.id;
    const json = await request(isNew ? 'products.php' : `products.php?id=${encodeURIComponent(product.id)}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeProduct(json.data);
  }
  const list = demoRead();
  if (product.id) {
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx === -1) throw new Error('Producto no encontrado');
    list[idx] = payload;
  } else {
    payload.id = list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
    list.push(payload);
  }
  demoWrite(list);
  return payload;
}

export async function deleteProduct(id) {
  if ((await detectMode()) === 'api') {
    await request(`products.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return;
  }
  demoWrite(demoRead().filter((p) => p.id !== id));
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD = 5 * 1024 * 1024;

export async function uploadImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Formato no permitido. Usá JPG, PNG o WEBP.');
  if (file.size > MAX_UPLOAD) throw new Error('La imagen supera los 5 MB.');

  if ((await detectMode()) === 'api') {
    const form = new FormData();
    form.append('imagen', file);
    const json = await request('upload.php', { method: 'POST', body: form });
    return json.data.url;
  }
  // Demo: se guarda como data URL (localStorage tiene ~5 MB en total, conviene usar imágenes livianas).
  if (file.size > 600 * 1024) throw new Error('En modo demo, usá imágenes de menos de 600 KB o pegá una URL.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

/* ---------- Autenticación ---------- */

export async function getSession() {
  if ((await detectMode()) === 'api') {
    try {
      const json = await request('me.php');
      return json.data?.authenticated ? json.data : null;
    } catch {
      return null;
    }
  }
  try {
    return sessionStorage.getItem(KEYS.demoSession) ? { authenticated: true, usuario: 'demo' } : null;
  } catch {
    return null;
  }
}

export async function login(usuario, password) {
  if ((await detectMode()) === 'api') {
    const json = await request('login.php', { method: 'POST', body: JSON.stringify({ usuario, password }) });
    return json.data;
  }
  return demoLogin();
}

export function demoLogin() {
  try {
    sessionStorage.setItem(KEYS.demoSession, '1');
  } catch {
    /* noop */
  }
  return { authenticated: true, usuario: 'demo' };
}

export async function logout() {
  if ((await detectMode()) === 'api') {
    await request('logout.php', { method: 'POST' }).catch(() => {});
    return;
  }
  try {
    sessionStorage.removeItem(KEYS.demoSession);
  } catch {
    /* noop */
  }
}

export { safeStorage };
