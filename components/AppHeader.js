'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AppHeader({ usuario }) {
  const router = useRouter();

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header style={headerStyle}>
      <h1 style={headerTitleStyle}>Penca Ladri Mundial 2026</h1>

      <details style={userMenuStyle}>
        <summary style={userNameStyle}>@{usuario?.login || 'usuario'}</summary>

        <button onClick={cerrarSesion} style={logoutDropdownStyle}>
          Cerrar sesión
        </button>
      </details>
    </header>
  );
}

const headerStyle = {
  height: '72px',
  backgroundColor: 'white',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 32px',
  position: 'sticky',
  top: 0,
  zIndex: 20
};

const headerTitleStyle = {
  margin: 0,
  fontSize: '26px',
  color: '#111'
};

const userMenuStyle = {
  position: 'relative'
};

const userNameStyle = {
  listStyle: 'none',
  cursor: 'pointer',
  backgroundColor: '#f4f4f4',
  padding: '10px 16px',
  borderRadius: '12px',
  color: '#111',
  fontWeight: '700'
};

const logoutDropdownStyle = {
  position: 'absolute',
  right: 0,
  top: '46px',
  width: '150px',
  padding: '12px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#ef4444',
  color: 'white',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
};