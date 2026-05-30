'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PosicionesPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRanking();
  }, []);

  const cargarRanking = async () => {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push('/login');
      return;
    }

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('nombre, apellido, login, es_admin')
      .eq('id', authData.user.id)
      .single();

    setUsuario(perfil);

    const { data, error } = await supabase
	  .from('usuarios')
	  .select(`
		id,
		nombre,
		apellido,
		login,
		activo,
		pronosticos (
		  puntos_obtenidos
		),
		apuestas_extras (
		  puntos_campeon,
		  puntos_goleador,
		  puntos_equipo_menos_goleado
		)
	  `)
	  .eq('activo', true);

    if (error) {
      console.error(error);
      setCargando(false);
      return;
    }

    const rankingCalculado = (data || [])
		  .map((u) => {
	  const puntosPartidos = u.pronosticos?.reduce(
		(total, p) => total + (p.puntos_obtenidos || 0),
		0
	  ) || 0;

	  const puntosExtras =
		  (u.apuestas_extras?.puntos_campeon || 0) +
		  (u.apuestas_extras?.puntos_goleador || 0) +
		  (u.apuestas_extras?.puntos_equipo_menos_goleado || 0);

	  const puntos = puntosPartidos + puntosExtras;

	  const pronosticosCargados = u.pronosticos?.length || 0;

	  const exactos = u.pronosticos?.filter(
		(p) => p.puntos_obtenidos === 8
	  ).length || 0;

	  return {
		id: u.id,
		login: u.login,
		iniciales: obtenerIniciales(u.login),
		puntos,
		puntosPartidos,
		puntosExtras,
		pronosticosCargados,
		exactos
	  };
	})
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.exactos !== a.exactos) return b.exactos - a.exactos;
        return a.login.localeCompare(b.login);
      });

    setRanking(rankingCalculado);
    setCargando(false);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (cargando) {
    return (
      <main style={pageStyle}>
        <p style={loadingStyle}>Cargando...</p>
      </main>
    );
  }

  const primero = ranking[0];
  const segundo = ranking[1];
  const tercero = ranking[2];
  const resto = ranking.slice(3);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/dashboard" style={brandStyle}>
          Penca Ladri Mundial 2026
        </Link>

        <details style={userMenuStyle}>
          <summary style={userNameStyle}>{usuario?.login}</summary>

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
          <Link href="/pronosticos-extras" style={menuLinkStyle}>🎯 Pronosticos extras</Link>
          <Link href="/posiciones" style={activeMenuLinkStyle}>🏆 Posiciones</Link>
          <Link href="/reglas" style={menuLinkStyle}>📋 Reglas de puntuación</Link>
          <Link href="/noticias" style={menuLinkStyle}>📰 Noticias</Link>

          {usuario?.es_admin && (
            <Link href="/admin" style={menuLinkStyle}>⚙️ Admin</Link>
          )}
        </aside>

        <section style={contentStyle}>
          <div style={heroPanelStyle}>
            <div>
              <div style={badgeStyle}>Ranking</div>

              <h1 style={titleStyle}>Posiciones</h1>

              <p style={subtitleStyle}>
                Tabla general ordenada por puntos. En caso de empate, define la cantidad de resultados exactos.
              </p>
            </div>

            <div style={statsMiniBoxStyle}>
              <strong>{ranking.length}</strong>
              <span>participantes</span>
            </div>
          </div>

          <div style={podiumPanelStyle}>
            <div style={podiumStyle}>
              {segundo && (
                <PodiumUser
                  usuario={segundo}
                  puesto={2}
                  color="#e5e7eb"
                  blockGradient="linear-gradient(180deg, #f1f5f9, #64748b)"
                  height={105}
                />
              )}

              {primero && (
                <PodiumUser
                  usuario={primero}
                  puesto={1}
                  color="#ffd21f"
                  blockGradient="linear-gradient(180deg, #ffd21f, #a16207)"
                  height={145}
                  principal
                />
              )}

              {tercero && (
                <PodiumUser
                  usuario={tercero}
                  puesto={3}
                  color="#fb923c"
                  blockGradient="linear-gradient(180deg, #fb923c, #7c2d12)"
                  height={85}
                />
              )}
            </div>
          </div>

          <div style={rankingPanelStyle}>
            <div style={tableHeaderStyle}>
              <span>#</span>
              <span>Usuario</span>
              <span>Puntos</span>
              <span>Pronósticos</span>
              <span>Exactos</span>
            </div>

            {resto.length === 0 && (
              <div style={emptyStyle}>
                Todavía no hay más participantes debajo del podio.
              </div>
            )}

            <div style={listStyle}>
              {resto.map((u, index) => (
                <div key={u.id} style={rowStyle}>
                  <strong style={positionNumberStyle}>{index + 4}</strong>

                  <div style={participantStyle}>
                    <div style={avatarSmallStyle}>
                      {u.iniciales}
                    </div>

                    <strong>@{u.login}</strong>
                  </div>

                  <strong style={pointsRowStyle}>{u.puntos}</strong>
                  <span>{u.pronosticosCargados}</span>
                  <span>{u.exactos}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PodiumUser({ usuario, puesto, color, blockGradient, height, principal }) {
  return (
    <div style={podiumUserStyle}>
      <div style={{ ...medalStyle, backgroundColor: color }}>
        {puesto}
      </div>

      <div
        style={{
          ...avatarStyle,
          borderColor: color,
          width: principal ? '92px' : '78px',
          height: principal ? '92px' : '78px',
          fontSize: principal ? '30px' : '24px'
        }}
      >
        {usuario.iniciales}
      </div>

      <h3 style={podiumNameStyle}>{usuario.login}</h3>

      <strong style={{ ...podiumPointsStyle, color }}>
        {usuario.puntos}
      </strong>

      <span style={podiumPtsLabelStyle}>pts</span>

      <div
        style={{
          ...podiumBlockStyle,
          height,
          background: blockGradient
        }}
      >
        {puesto}
      </div>
    </div>
  );
}

function obtenerIniciales(login) {
  if (!login) return '?';
  return login.substring(0, 2).toUpperCase();
}

const pageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #17345f 0%, #07111f 45%, #030712 100%)',
  color: 'white',
  fontFamily: 'Arial, sans-serif'
};

const loadingStyle = {
  textAlign: 'center',
  paddingTop: '80px',
  color: 'white',
  fontWeight: '800'
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
  fontWeight: '900',
  boxShadow: '0 0 22px rgba(255,210,31,0.35)'
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
  boxShadow: '0 12px 28px rgba(0,0,0,0.35)'
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
  boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
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
  color: '#07111f',
  boxShadow: '0 0 22px rgba(255,210,31,0.25)'
};

const contentStyle = {
  maxWidth: '1080px',
  width: '100%',
  margin: '0 auto'
};

const heroPanelStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.78)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '30px',
  marginBottom: '22px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px'
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: 'rgba(255,210,31,0.12)',
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
  lineHeight: '1.05',
  margin: '0 0 10px',
  fontWeight: '900'
};

const subtitleStyle = {
  fontSize: '17px',
  lineHeight: '1.5',
  color: '#dbeafe',
  margin: 0
};

const statsMiniBoxStyle = {
  minWidth: '150px',
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '22px',
  padding: '20px',
  textAlign: 'center',
  color: '#dbeafe',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const podiumPanelStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '34px 28px 0',
  marginBottom: '24px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
  overflow: 'hidden'
};

const podiumStyle = {
  minHeight: '380px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: '34px'
};

const podiumUserStyle = {
  width: '220px',
  textAlign: 'center'
};

const medalStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  color: '#07111f',
  fontWeight: '900',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 10px'
};

const avatarStyle = {
  borderRadius: '50%',
  border: '3px solid',
  backgroundColor: 'rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 14px',
  fontWeight: '900',
  color: 'white'
};

const podiumNameStyle = {
  margin: 0,
  fontSize: '19px',
  color: 'white'
};

const podiumPointsStyle = {
  fontSize: '36px',
  display: 'block',
  marginTop: '12px'
};

const podiumPtsLabelStyle = {
  color: '#cbd5e1',
  fontWeight: '900'
};

const podiumBlockStyle = {
  marginTop: '18px',
  borderRadius: '18px 18px 0 0',
  fontSize: '42px',
  fontWeight: '900',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const rankingPanelStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
};

const tableHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '60px 1fr 120px 130px 100px',
  padding: '0 16px 14px',
  color: '#ffd21f',
  fontWeight: '900',
  fontSize: '14px'
};

const emptyStyle = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '18px',
  borderRadius: '18px',
  color: '#dbeafe',
  fontWeight: '800'
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '60px 1fr 120px 130px 100px',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '18px',
  padding: '14px 16px',
  color: '#dbeafe',
  fontWeight: '800'
};

const positionNumberStyle = {
  color: '#ffd21f'
};

const participantStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  color: 'white'
};

const avatarSmallStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#ffd21f',
  color: '#07111f',
  fontWeight: '900',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const pointsRowStyle = {
  color: '#ffd21f',
  fontSize: '18px'
};