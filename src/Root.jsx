import { useEffect, useState } from 'react';
import App from './App.jsx';
import AdminApp from './AdminApp.jsx';

// Enrutamiento ligero por hash: "#admin" muestra el panel, cualquier otro valor la tienda.
// Usar hash evita configurar rewrites en el hosting.
const isAdminHash = () => window.location.hash.replace(/^#\/?/, '').startsWith('admin');

export default function Root() {
  const [isAdmin, setIsAdmin] = useState(isAdminHash);

  useEffect(() => {
    const onHash = () => setIsAdmin(isAdminHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return isAdmin ? <AdminApp /> : <App />;
}
