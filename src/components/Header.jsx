import { config } from '../data/config.js';
import { useCart } from '../context/CartContext.jsx';
import Icon from './Icon.jsx';
import './Header.css';

export default function Header() {
  const { count, open } = useCart();
  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#" className="header__brand" aria-label={`${config.brand.name}, inicio`}>
          <span className="header__mark"><Icon name="glass" size={18} /></span>
          <span className="header__name">{config.brand.name}</span>
        </a>
        <nav className="header__nav" aria-label="Principal">
          <a href="#catalogo">Catálogo</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <button type="button" className="header__cart" onClick={open} aria-label={`Abrir carrito, ${count} productos`}>
          <Icon name="bag" />
          <span className="header__cart-label">Carrito</span>
          {count > 0 && <span className="header__count num">{count}</span>}
        </button>
      </div>
    </header>
  );
}
