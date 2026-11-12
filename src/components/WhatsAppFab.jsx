import { config } from '../data/config.js';
import { buildWhatsAppLink } from '../utils/whatsapp.js';
import Icon from './Icon.jsx';
import './WhatsAppFab.css';

export default function WhatsAppFab() {
  return (
    <a className="wa-fab" href={buildWhatsAppLink(config.whatsapp.phone, config.whatsapp.defaultMessage)}
      target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp">
      <Icon name="whatsapp" size={20} />
      <span className="wa-fab__label">Consultas</span>
    </a>
  );
}
