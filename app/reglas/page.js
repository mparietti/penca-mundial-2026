'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ReglasPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push('/login');
      return;
    }

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('login, es_admin')
      .eq('id', authData.user.id)
      .single();

    setUsuario(perfil);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/dashboard" style={brandStyle}>
          Penca Ladri Mundial 2026
        </Link>

        <details style={userMenuStyle}>
          <summary style={userNameStyle}>
            {usuario?.login || 'usuario'}
          </summary>

          <button onClick={cerrarSesion} style={logoutDropdownStyle}>
            Cerrar sesión
          </button>
        </details>
      </header>

      <div style={layoutStyle}>
        <aside style={sidebarStyle}>
          <h3 style={menuTitleStyle}>Menú</h3>

          <Link href="/dashboard" style={menuLinkStyle}>⚽ Partidos</Link>
          <Link href="/grupos" style={menuLinkStyle}>🌍 Grupos</Link>
          <Link href="/resultados" style={menuLinkStyle}>📅 Resultados</Link>
          <Link href="/pronosticos-extras" style={menuLinkStyle}>🎯 Pronósticos extras</Link>
          <Link href="/posiciones" style={menuLinkStyle}>🏆 Posiciones</Link>
          <Link href="/reglas" style={activeMenuLinkStyle}>📋 Reglas de puntuación</Link>

          {usuario?.es_admin && (
            <Link href="/admin" style={menuLinkStyle}>⚙️ Admin</Link>
          )}
        </aside>

        <section style={contentStyle}>
          <div style={heroPanelStyle}>
            <div>
              <div style={badgeStyle}>Reglas</div>

              <h1 style={titleStyle}>Sistema de puntos</h1>

              <p style={subtitleStyle}>
                Así se calculan los puntos de partidos, pronósticos extras y desempates.
              </p>
            </div>
          </div>

          <h2 style={sectionTitleStyle}>⚽ Pronósticos de partidos</h2>

          <div style={rulesContainerStyle}>
            <RuleCard
              points="8"
              icon="🎯"
              title="Resultado exacto"
              description="Acertás exactamente los goles de ambos equipos."
              color="#22c55e"
            />

            <RuleCard
              points="5"
              icon="📊"
              title="Diferencia de goles"
              description="No acertás el resultado exacto, pero sí la diferencia de goles."
              color="#38bdf8"
            />

            <RuleCard
              points="3"
              icon="✅"
              title="Ganador o empate"
              description="No acertás exacto ni diferencia, pero sí el ganador o el empate."
              color="#ffd21f"
            />

            <RuleCard
              points="0"
              icon="❌"
              title="Sin acierto"
              description="No acertás resultado exacto, diferencia ni ganador."
              color="#94a3b8"
            />
          </div>

          <div style={exampleBoxStyle}>
            <h2 style={exampleTitleStyle}>Ejemplo</h2>

            <p style={exampleTextStyle}>
              Si el partido termina <strong>Uruguay 2 - 1 Argentina</strong>:
            </p>

            <div style={exampleGridStyle}>
              <ExampleItem pronostico="2 - 1" puntos="8 pts" texto="Resultado exacto" />
              <ExampleItem pronostico="3 - 2" puntos="5 pts" texto="Misma diferencia" />
              <ExampleItem pronostico="2 - 0" puntos="3 pts" texto="Mismo ganador" />
              <ExampleItem pronostico="0 - 1" puntos="0 pts" texto="No acierta" />
            </div>
          </div>

          <div style={extrasBoxStyle}>
            <h2 style={sectionTitleStyle}>🎯 Pronósticos extras</h2>

            <p style={exampleTextStyle}>
              Estos pronósticos solo se pueden cargar antes del inicio del partido inaugural del Mundial.
              Una vez comenzado el torneo, quedan cerrados.
            </p>

            <div style={extrasGridStyle}>
              <ExtraRule icon="🏆" title="Campeón" points="+10 pts" />
              <ExtraRule icon="⚽" title="Goleador" points="+10 pts" />
              <ExtraRule icon="🛡️" title="Equipo menos goleado" points="+10 pts" />
              <ExtraRule icon="🔥" title="Equipo más goleador" points="+10 pts" />
            </div>

            <p style={exampleTextStyle}>
              Los puntos de los pronósticos extras se suman al puntaje total de la tabla de posiciones
              cuando finalice el Mundial y el administrador cargue los resultados reales.
            </p>
          </div>

          <div style={extrasBoxStyle}>
            <h2 style={sectionTitleStyle}>📊 Desempates</h2>

            <ol style={tieListStyle}>
              <li>Mayor cantidad de puntos totales.</li>
              <li>Mayor cantidad de resultados exactos, es decir, pronósticos de 8 puntos.</li>
              <li>Mayor cantidad de aciertos por diferencia de goles, es decir, pronósticos de 5 puntos.</li>
              <li>Mayor cantidad de aciertos por ganador o empate, es decir, pronósticos de 3 puntos.</li>
              <li>Orden alfabético del usuario.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}

function RuleCard({ points, icon, title, description, color }) {
  return (
    <div style={{ ...ruleCardStyle, borderColor: color }}>
      <div style={{ ...pointsCircleStyle, color, borderColor: color }}>
        {points}
      </div>

      <div>
        <h2 style={ruleTitleStyle}>
          {icon} {title}
        </h2>

        <p style={ruleDescriptionStyle}>
          {description}
        </p>
      </div>
    </div>
  );
}

function ExampleItem({ pronostico, puntos, texto }) {
  return (
    <div style={exampleItemStyle}>
      <strong style={exampleScoreStyle}>{pronostico}</strong>
      <span style={examplePointsStyle}>{puntos}</span>
      <small style={exampleSmallStyle}>{texto}</small>
    </div>
  );
}

function ExtraRule({ icon, title, points }) {
  return (
    <div style={extraCardStyle}>
      <strong>{icon} {title}</strong>
      <span style={extraPointsStyle}>{points}</span>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #17345f 0%, #07111f 45%, #030712 100%)',
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
  borderBottom: '1px solid rgba(255,255,255,0.12)',
  position: 'sticky',
  top: 0,
  zIndex: 20
};

const brandStyle = {
  fontSize: '22px',
  fontWeight: '900',
  color: 'white',
  textDecoration: 'none'
};

const userMenuStyle = {
  position: 'relative'
};

const userNameStyle = {
  listStyle: 'none',
  cursor: 'pointer',
  color: '#07111f',
  backgroundColor: '#ffd21f',
  padding: '11px 18px',
  borderRadius: '999px',
  fontWeight: '900'
};

const logoutDropdownStyle = {
  position: 'absolute',
  right: 0,
  top: '52px',
  width: '160px',
  padding: '12px',
  border: 'none',
  borderRadius: '14px',
  backgroundColor: '#ef4444',
  color: 'white',
  fontWeight: '900',
  cursor: 'pointer',
  textAlign: 'center'
};

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: '270px 1fr',
  gap: '28px',
  padding: '32px 48px 48px'
};

const sidebarStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.78)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '24px',
  height: 'fit-content',
  position: 'sticky',
  top: '108px'
};

const menuTitleStyle = {
  marginTop: 0,
  color: '#ffd21f',
  fontWeight: '900'
};

const menuLinkStyle = {
  display: 'block',
  textDecoration: 'none',
  color: '#e5e7eb',
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '14px',
  borderRadius: '16px',
  marginBottom: '12px',
  fontWeight: '800'
};

const activeMenuLinkStyle = {
  ...menuLinkStyle,
  backgroundColor: '#ffd21f',
  color: '#07111f'
};

const contentStyle = {
  maxWidth: '980px',
  width: '100%',
  margin: '0 auto'
};

const heroPanelStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.78)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '30px',
  marginBottom: '22px'
};

const badgeStyle = {
  display: 'inline-block',
  color: '#ffd21f',
  border: '1px solid rgba(255,210,31,0.45)',
  padding: '8px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: '900',
  marginBottom: '14px'
};

const titleStyle = {
  fontSize: '44px',
  margin: '0 0 10px',
  fontWeight: '900'
};

const subtitleStyle = {
  color: '#dbeafe',
  margin: 0
};

const sectionTitleStyle = {
  color: '#ffd21f',
  margin: '0 0 18px',
  fontSize: '26px',
  fontWeight: '900'
};

const rulesContainerStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '18px',
  marginBottom: '24px'
};

const ruleCardStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '2px solid',
  borderRadius: '26px',
  padding: '24px',
  display: 'grid',
  gridTemplateColumns: '76px 1fr',
  gap: '18px',
  alignItems: 'center'
};

const pointsCircleStyle = {
  width: '62px',
  height: '62px',
  borderRadius: '50%',
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
  fontWeight: '900'
};

const ruleTitleStyle = {
  margin: '0 0 8px',
  color: 'white',
  fontSize: '20px'
};

const ruleDescriptionStyle = {
  margin: 0,
  color: '#cbd5e1',
  lineHeight: '1.45'
};

const exampleBoxStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '26px',
  padding: '26px',
  marginBottom: '24px'
};

const exampleTitleStyle = {
  marginTop: 0,
  color: '#ffd21f'
};

const exampleTextStyle = {
  color: '#dbeafe',
  lineHeight: '1.5'
};

const exampleGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '14px',
  marginTop: '18px'
};

const exampleItemStyle = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '18px',
  padding: '16px',
  textAlign: 'center'
};

const exampleScoreStyle = {
  display: 'block',
  fontSize: '24px',
  color: 'white'
};

const examplePointsStyle = {
  display: 'block',
  color: '#ffd21f',
  fontWeight: '900',
  margin: '6px 0'
};

const exampleSmallStyle = {
  color: '#cbd5e1'
};

const extrasBoxStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '26px',
  padding: '26px',
  marginBottom: '24px'
};

const extrasGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px',
  margin: '20px 0'
};

const extraCardStyle = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '18px',
  padding: '18px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px'
};

const extraPointsStyle = {
  color: '#ffd21f',
  fontWeight: '900'
};

const tieListStyle = {
  color: '#dbeafe',
  lineHeight: '1.8',
  fontWeight: '700',
  marginBottom: 0
};