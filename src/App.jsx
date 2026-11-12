import { useEffect, useMemo, useState } from 'react';
import { CartProvider } from './context/CartContext.jsx';
import { getProducts } from './services/productService.js';
import AgeGateModal from './components/AgeGateModal.jsx';
import Header from './components/Header.jsx';
import HeroCellar from './components/HeroCellar.jsx';
import CategoryFilter from './components/CategoryFilter.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import ProductModal from './components/ProductModal.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import WhatsAppFab from './components/WhatsAppFab.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('todos');
  const [cepa, setCepa] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((e) => {
        setError(e.message);
        setProducts([]);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (category !== 'todos' && p.categoria !== category) return false;
      if (cepa && !p.ficha_tecnica.cepa.toLowerCase().includes(cepa.toLowerCase())) return false;
      return true;
    });
  }, [products, category, cepa]);

  return (
    <CartProvider products={products}>
      <AgeGateModal />
      <Header />
      <main id="contenido">
        <HeroCellar />
        <section className="container" aria-labelledby="catalogo-titulo" id="catalogo">
          <CategoryFilter
            products={products || []}
            category={category}
            onCategoryChange={setCategory}
            cepa={cepa}
            onCepaChange={setCepa}
            resultCount={filtered.length}
          />
          <ProductGrid
            products={filtered}
            loading={products === null}
            error={error}
            onSelect={setSelected}
            onResetFilters={() => {
              setCategory('todos');
              setCepa('');
            }}
          />
        </section>
      </main>
      <Footer />
      <WhatsAppFab />
      <CartDrawer />
      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </CartProvider>
  );
}
