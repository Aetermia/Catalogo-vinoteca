import { useEffect, useState } from 'react';
import { detectMode, getSession, logout } from './services/productService.js';
import AdminGate from './components/admin/AdminGate.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';

export default function AdminApp() {
  const [mode, setMode] = useState(null);
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    document.title = 'Administración — Catálogo';
    detectMode().then(async (m) => {
      setMode(m);
      setSession(await getSession());
    });
  }, []);

  if (!mode || session === undefined) {
    return <p style={{ padding: 32, color: 'var(--color-ink-soft)' }}>Conectando…</p>;
  }

  if (!session) return <AdminGate mode={mode} onLogin={setSession} />;

  return (
    <AdminPanel
      mode={mode}
      session={session}
      onLogout={async () => {
        await logout();
        setSession(null);
      }}
    />
  );
}
