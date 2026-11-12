import { useRef, useState } from 'react';
import { config } from '../data/config.js';
import { useBodyLock, useFocusReturn } from '../utils/hooks.js';
import './AgeGateModal.css';

const KEY = config.storageKeys.ageGate;

const hasConfirmed = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export default function AgeGateModal() {
  const [status, setStatus] = useState(() => (hasConfirmed() ? 'ok' : 'pending'));
  const ref = useRef(null);
  const visible = status !== 'ok';
  useBodyLock(visible);
  useFocusReturn(visible, ref);

  if (!visible) return null;

  const confirm = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* sin almacenamiento: se vuelve a preguntar en la próxima visita */
    }
    setStatus('ok');
  };

  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title" tabIndex={-1} ref={ref}>
      <div className="age-gate__panel">
        <p className="kicker">{config.brand.name}</p>
        {status === 'pending' ? (
          <>
            <h2 id="age-gate-title" className="age-gate__title">¿Sos mayor de 18 años?</h2>
            <p className="age-gate__text">
              Para ingresar a la tienda necesitamos confirmar que tenés la edad legal para comprar bebidas alcohólicas.
            </p>
            <div className="age-gate__actions">
              <button type="button" className="btn btn--primary btn--block" onClick={confirm} autoFocus>
                Soy mayor de 18 años
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => setStatus('denied')}>
                Soy menor, salir
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="age-gate-title" className="age-gate__title">Volvé cuando cumplas 18</h2>
            <p className="age-gate__text">
              La venta de bebidas alcohólicas está prohibida a menores de 18 años (Ley 24.788). Gracias por tu visita.
            </p>
            <div className="age-gate__actions">
              <button type="button" className="btn btn--ghost btn--block" onClick={() => setStatus('pending')}>
                Me equivoqué, volver
              </button>
            </div>
          </>
        )}
        <p className="age-gate__legal">Beber con moderación. Prohibida su venta a menores de 18 años.</p>
      </div>
    </div>
  );
}
