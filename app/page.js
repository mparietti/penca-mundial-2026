import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={brandStyle}>Penca Ladri</div>

        <div style={navStyle}>
          <Link href="/login" style={loginButtonStyle}>
            Iniciar sesión
          </Link>

          <Link href="/register" style={registerButtonStyle}>
            Registrarse
          </Link>
        </div>
      </header>

      <section style={heroStyle}>
        <div style={imageWrapperStyle}>
          <img
            src="/Ladris_Mundial.png"
            alt="Penca Ladri Mundial 2026"
            style={imageStyle}
          />
        </div>

        <div style={contentStyle}>
          <h1 style={titleStyle}>
             Ladri Penca Mundial 2026
          </h1>

          <p style={subtitleStyle}>
            Pronosticá los resultados, competí con tus amigos y seguí la tabla durante todo el Mundial.
          </p>

          <div style={cardsStyle}>
            <div style={cardStyle}>⚽ Pronósticos</div>
            <div style={cardStyle}>🏆 Ranking</div>
            <div style={cardStyle}>📊 Estadísticas</div>
          </div>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top, #17345f 0%, #07111f 45%, #030712 100%)',
  color: 'white',
  fontFamily: 'Arial, sans-serif'
};

const headerStyle = {
  height: '76px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 48px',
  backgroundColor: 'rgba(3, 7, 18, 0.72)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255,255,255,0.12)'
};

const brandStyle = {
  fontSize: '22px',
  fontWeight: '900',
  letterSpacing: '0.5px'
};

const navStyle = {
  display: 'flex',
  gap: '14px'
};

const loginButtonStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '11px 18px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.35)',
  fontWeight: '700'
};

const registerButtonStyle = {
  color: '#07111f',
  backgroundColor: '#ffd21f',
  textDecoration: 'none',
  padding: '11px 20px',
  borderRadius: '999px',
  fontWeight: '900',
  boxShadow: '0 0 22px rgba(255,210,31,0.35)'
};

const heroStyle = {
  display: 'grid',
  gridTemplateColumns: '1.15fr 0.85fr',
  gap: '34px',
  alignItems: 'center',
  padding: '42px 56px 56px'
};

const imageWrapperStyle = {
  borderRadius: '28px',
  overflow: 'hidden',
  boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
  border: '1px solid rgba(255,255,255,0.18)'
};

const imageStyle = {
  width: '100%',
  display: 'block'
};

const contentStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.72)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '38px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
};

const titleStyle = {
  fontSize: '54px',
  lineHeight: '1.02',
  margin: '0 0 20px',
  fontWeight: '900'
};

const subtitleStyle = {
  fontSize: '20px',
  lineHeight: '1.5',
  color: '#dbeafe',
  marginBottom: '34px'
};

const cardsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
};

const cardStyle = {
  backgroundColor: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '18px',
  padding: '18px 20px',
  fontSize: '18px',
  fontWeight: '800'
};