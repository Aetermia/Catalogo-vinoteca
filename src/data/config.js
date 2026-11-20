// Configuración de marca y negocio. Es el primer archivo a editar al adaptar
// la plantilla a un nuevo cliente.
export const config = {
  brand: {
    name: 'Bodega del Puerto',
    tagline: 'Vinoteca de barrio, selección de autor',
    since: 1998,
    address: 'Av. Pedro de Mendoza 1840, La Boca, CABA',
    hours: 'Lunes a sábado de 10 a 21 h',
    instagram: 'bodegadelpuerto',
  },

  // Número en formato internacional, sin "+", espacios ni guiones.
  whatsapp: {
    phone: '5492494367045',
    // Cómo se muestra el número en el sitio.
    display: '+54 9 249 436-7045',
    defaultMessage: 'Hola, quería hacer una consulta sobre la vinoteca.',
  },

  currency: {
    locale: 'es-AR',
    code: 'ARS',
  },

  delivery: {
    pickupLabel: 'Retiro en vinoteca',
    shippingLabel: 'Envío a domicilio',
    shippingNote: 'Envíos en el día dentro de CABA para pedidos confirmados antes de las 17 h. El costo se coordina por WhatsApp.',
  },

  paymentMethods: [
    { id: 'transferencia', label: 'Transferencia' },
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'mercadopago', label: 'Mercado Pago' },
  ],

  // El id se guarda en la base; el label es lo que ve el cliente.
  categories: [
    { id: 'tintos', label: 'Tintos' },
    { id: 'blancos', label: 'Blancos' },
    { id: 'rosados', label: 'Rosados' },
    { id: 'espumantes', label: 'Espumantes' },
    { id: 'destilados', label: 'Destilados' },
    { id: 'cajas', label: 'Cajas Cerradas' },
  ],

  promotionTypes: [
    { id: 'NONE', label: 'Sin promoción' },
    { id: '2X1', label: '2x1' },
    { id: '3X2', label: '3x2' },
    { id: '2DA_UNIDAD_DESCUENTO', label: '2da unidad con descuento' },
  ],

  storageKeys: {
    ageGate: 'vinoteca_age_ok',
    cart: 'vinoteca_cart',
    customer: 'vinoteca_customer',
    demoProducts: 'vinoteca_demo_products',
    demoSession: 'vinoteca_demo_admin',
  },
};

export const getCategoryLabel = (id) =>
  config.categories.find((c) => c.id === id)?.label ?? id;
