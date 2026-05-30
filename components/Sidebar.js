import Link from 'next/link';

export default function Sidebar({ active, esAdmin }) {
  return (
    <aside style={menuStyle}>
      <h3 style={{ marginTop: 0 }}>Menú</h3>

      <Link href="/dashboard" style={active === 'partidos' ? activeMenuLinkStyle : menuLinkStyle}>
        ⚽ Partidos
      </Link>

      <Link href="/grupos" style={active === 'grupos' ? activeMenuLinkStyle : menuLinkStyle}>
        🌍 Grupos
      </Link>

      <Link href="/resultados" style={active === 'resultados' ? activeMenuLinkStyle : menuLinkStyle}>
        📅 Resultados
      </Link>

      <Link href="/apuestas-extras" style={active === 'apuestas' ? activeMenuLinkStyle : menuLinkStyle}>
        🎯 Apuestas extras
      </Link>

      <Link href="/posiciones" style={active === 'posiciones' ? activeMenuLinkStyle : menuLinkStyle}>
        🏆 Posiciones
      </Link>

      <Link href="/reglas" style={active === 'reglas' ? activeMenuLinkStyle : menuLinkStyle}>
        📋 Reglas de puntuación
      </Link>

      <Link href="/noticias" style={active === 'noticias' ? activeMenuLinkStyle : menuLinkStyle}>
        📰 Noticias
      </Link>

      {esAdmin && (
        <Link href="/admin" style={active === 'admin' ? activeMenuLinkStyle : menuLinkStyle}>
          ⚙️ Admin
        </Link>
      )}
    </aside>
  );
}

const menuStyle = {
  backgroundColor: 'white',
  borderRadius: '18px',
  padding: '24px',
  height: 'fit-content',
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  position: 'sticky',
  top: '104px'
};

const menuLinkStyle = {
  display: 'block',
  textDecoration: 'none',
  color: '#111',
  backgroundColor: '#f4f4f4',
  padding: '14px',
  borderRadius: '12px',
  marginBottom: '12px',
  fontWeight: '600'
};

const activeMenuLinkStyle = {
  ...menuLinkStyle,
  backgroundColor: '#111',
  color: 'white'
};