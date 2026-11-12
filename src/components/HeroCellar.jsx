import { config } from '../data/config.js';
import './HeroCellar.css';

const facts = [
  { title: 'Retiro en el local', text: config.brand.hours },
  { title: 'Envíos en el día', text: 'Dentro de CABA, pedidos antes de las 17 h' },
  { title: 'Medios de pago', text: config.paymentMethods.map((p) => p.label).join(', ') },
];

export default function HeroCellar() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="kicker">Vinoteca desde {config.brand.since}</p>
          <h1 id="hero-title" className="hero__title">
            Vinos con historia,<br />elegidos botella por botella.
          </h1>
          <p className="hero__lead">
            {config.brand.tagline}. Tintos de altura, blancos frescos, espumantes de método tradicional y destilados de
            pequeños productores. Armá tu pedido y confirmalo por WhatsApp.
          </p>
          <a href="#catalogo" className="btn btn--primary">Ver catálogo</a>
        </div>
        <dl className="hero__facts">
          {facts.map((f) => (
            <div key={f.title} className="hero__fact">
              <dt>{f.title}</dt>
              <dd>{f.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
