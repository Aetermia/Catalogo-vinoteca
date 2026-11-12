import { useState } from 'react';
import { config } from '../../data/config.js';
import { demoLogin, login } from '../../services/productService.js';
import Icon from '../Icon.jsx';
import './AdminGate.css';

export default function AdminGate({ mode, onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isDemo = mode === 'demo';

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      onLogin(await login(usuario.trim(), password));
    } catch (err) {
      setError(err.status === 429 ? err.message : err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="gate">
      <div className="gate__panel">
        <p className="kicker">{config.brand.name}</p>
        <h1 className="gate__title">Administración</h1>
        <p className="gate__mode">
          <span className={`gate__dot${isDemo ? ' is-demo' : ''}`} />
          {isDemo ? 'Modo demo: los cambios se guardan solo en este navegador.' : 'Conectado al servidor.'}
        </p>

        {isDemo && (
          <button type="button" className="btn btn--primary btn--block" onClick={() => onLogin(demoLogin())}>
            Acceso rápido al panel demo
          </button>
        )}

        <form className="gate__form" onSubmit={submit}>
          {isDemo && <p className="gate__divider"><span>o con usuario</span></p>}
          <label className="field">
            <span className="field__label">Usuario</span>
            <input className="input" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required={!isDemo} />
          </label>
          <label className="field">
            <span className="field__label">Contraseña</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required={!isDemo} />
          </label>
          {error && <p className="field__error" role="alert">{error}</p>}
          <button type="submit" className={`btn btn--block ${isDemo ? 'btn--ghost' : 'btn--primary'}`} disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <a href="#" className="gate__back"><Icon name="arrowLeft" size={16} /> Volver a la tienda</a>
      </div>
    </main>
  );
}
