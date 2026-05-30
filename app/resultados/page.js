'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResultadosPage() {
  const router = useRouter();

  const [usuarioAuth, setUsuarioAuth] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push('/login');
      return;
    }

    setUsuarioAuth(authData.user);

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('nombre, apellido, login, es_admin')
      .eq('id', authData.user.id)
      .single();

    setUsuario(perfil);

    const { data, error } = await supabase
      .from('partidos')
      .select(`
        id,
        fecha_hora,
        fase,
        grupo,
        estado,
        goles_local,
        goles_visitante,
        equipo_local:equipos!partidos_equipo_local_id_fkey(nombre, codigo_fifa, bandera_url),
        equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre, codigo_fifa, bandera_url),
        pronosticos(id, usuario_id, goles_local, goles_visitante, puntos_obtenidos)
      `)
      .eq('estado', 'FINALIZADO')
      .order('fecha_hora', { ascending: true });

    if (error) {
      console.error(error);
      setCargando(false);
      return;
    }

    setPartidos(data || []);
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

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/dashboard" style={brandStyle}>
          Penca Ladri Mundial 2026
        </Link>

        <details style={userMenuStyle}>
          <summary style={userNameStyle}>@{usuario?.login}</summary>

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
          <Link href="/resultados" style={activeMenuLinkStyle}>📅 Resultados</Link>
          <Link href="/pronosticos-extras" style={menuLinkStyle}>🎯 Pronosticos extras</Link>
          <Link href="/posiciones" style={menuLinkStyle}>🏆 Posiciones</Link>
          <Link href="/reglas" style={menuLinkStyle}>📋 Reglas de puntuación</Link>
          <Link href="/noticias" style={menuLinkStyle}>📰 Noticias</Link>

          {usuario?.es_admin && (
            <Link href="/admin" style={menuLinkStyle}>⚙️ Admin</Link>
          )}
        </aside>

        <section style={contentStyle}>
          <div style={heroPanelStyle}>
            <div>
              <div style={badgeStyle}>Resultados</div>

              <h1 style={titleStyle}>Partidos finalizados</h1>

              <p style={subtitleStyle}>
                Consultá los resultados oficiales, tu pronóstico y los puntos obtenidos.
              </p>
            </div>

            <div style={statsMiniBoxStyle}>
              <strong>{partidos.length}</strong>
              <span>finalizados</span>
            </div>
          </div>

          {partidos.length === 0 && (
            <div style={emptyStyle}>
              Todavía no hay partidos finalizados.
            </div>
          )}

          <div style={matchesContainerStyle}>
            {partidos.map((partido) => {
              const miPronostico = partido.pronosticos?.find(
                (p) => p.usuario_id === usuarioAuth?.id
              );

              return (
                <div key={partido.id} style={matchCardStyle}>
                  <div style={matchHeaderStyle}>
                    <span style={groupPillStyle}>Grupo {partido.grupo}</span>
                    <span style={dateStyle}>{formatearFecha(partido.fecha_hora)}</span>
                  </div>

                  <div style={teamsStyle}>
                    <div style={teamStyle}>
                      {partido.equipo_local?.bandera_url && (
                        <img
                          src={partido.equipo_local.bandera_url}
                          alt={partido.equipo_local.nombre}
                          style={flagStyle}
                        />
                      )}

                      <span style={teamNameStyle}>
                        {partido.equipo_local?.nombre}
                      </span>
                    </div>

                    <strong style={scoreStyle}>
                      {partido.goles_local} - {partido.goles_visitante}
                    </strong>

                    <div style={teamStyle}>
                      {partido.equipo_visitante?.bandera_url && (
                        <img
                          src={partido.equipo_visitante.bandera_url}
                          alt={partido.equipo_visitante.nombre}
                          style={flagStyle}
                        />
                      )}

                      <span style={teamNameStyle}>
                        {partido.equipo_visitante?.nombre}
                      </span>
                    </div>
                  </div>

                  <div style={resultInfoStyle}>
                    {miPronostico ? (
                      <>
                        <div>
                          <span style={infoLabelStyle}>Tu pronóstico</span>
                          <strong>
                            {miPronostico.goles_local} - {miPronostico.goles_visitante}
                          </strong>
                        </div>

                        <div>
                          <span style={infoLabelStyle}>Puntos</span>
                          <strong style={pointsStyle}>
                            {miPronostico.puntos_obtenidos ?? 0}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <span style={alertStyle}>
                        No cargaste pronóstico para este partido.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  cursor: 'pointer'
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
  marginBottom: '22px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
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

const statsMiniBoxStyle = {
  minWidth: '150px',
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: '22px',
  padding: '20px',
  textAlign: 'center',
  color: '#dbeafe'
};

const emptyStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.78)',
  padding: '26px',
  borderRadius: '22px',
  color: '#dbeafe',
  fontWeight: '800'
};

const matchesContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
};

const matchCardStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '26px',
  padding: '24px'
};

const matchHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '18px'
};

const groupPillStyle = {
  color: '#ffd21f',
  border: '1px solid rgba(255,210,31,0.45)',
  padding: '7px 12px',
  borderRadius: '999px',
  fontWeight: '900'
};

const dateStyle = {
  color: '#cbd5e1',
  fontWeight: '800'
};

const teamsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 90px 1fr',
  alignItems: 'center',
  gap: '12px'
};

const teamStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px'
};

const teamNameStyle = {
  fontSize: '21px',
  fontWeight: '900'
};

const flagStyle = {
  width: '38px',
  height: '26px',
  objectFit: 'cover',
  borderRadius: '5px'
};

const scoreStyle = {
  fontSize: '28px',
  color: '#ffd21f',
  textAlign: 'center'
};

const resultInfoStyle = {
  marginTop: '20px',
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderRadius: '20px',
  padding: '16px',
  display: 'flex',
  justifyContent: 'center',
  gap: '50px',
  textAlign: 'center'
};

const infoLabelStyle = {
  display: 'block',
  color: '#cbd5e1',
  fontSize: '13px',
  marginBottom: '6px'
};

const pointsStyle = {
  color: '#ffd21f',
  fontSize: '24px'
};

const alertStyle = {
  color: '#fbbf24',
  fontWeight: '900'
};