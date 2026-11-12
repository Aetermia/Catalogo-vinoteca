import { config } from '../data/config.js';
import { buildWhatsAppLink } from '../utils/whatsapp.js';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  const phone = config.whatsapp.phone;
  const pretty = `+${phone.slice(0, 2)} ${phone.slice(2, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 9)}-${phone.slice(9)}`;
  return (
    <footer className="footer" id="contacto">
      <div className="container footer__grid">
        <div>
          <p className="footer__brand">{config.brand.name}</p>
          <p className="footer__text">{config.brand.tagline}.</p>
        </div>
        <div>
          <p className="kicker">Visitanos</p>
          <p className="footer__text">{config.brand.address}</p>
          <p className="footer__text">{config.brand.hours}</p>
        </div>
        <div>
          <p className="kicker">Contacto</p>
          <a className="footer__text footer__link" href={buildWhatsAppLink(phone, config.whatsapp.defaultMessage)} target="_blank" rel="noopener noreferrer">
            WhatsApp {pretty}
          </a>
          <a className="footer__text footer__link" href={`https://instagram.com/${config.brand.instagram}`} target="_blank" rel="noopener noreferrer">
            Instagram @{config.brand.instagram}
          </a>
        </div>
      </div>
      <div className="container footer__legal">
        <p>Beber con moderación. Prohibida la venta de bebidas alcohólicas a menores de 18 años.</p>
        <p className="num">© {year} {config.brand.name} · <a href="#admin">Administración</a></p>
      </div>
    </footer>
  );
}
