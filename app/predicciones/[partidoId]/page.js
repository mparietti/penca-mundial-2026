'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PrediccionesPartidoPage() {
  const router = useRouter();
  const params = useParams();
  const partidoId = params.partidoId;

  const [usuario, setUsuario] = useState(null);
  const [partido, setPartido] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [pronosticos, setPronosticos] = useState([]);
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

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('login, es_admin')
      .eq('id', authData.user.id)
      .single();

    setUsuario(perfil);

    const { data: partidoData, error: partidoError } = await supabase
      .from('partidos')
      .select(`
        id,
        fecha_hora,
        grupo,
        estadio,
        ciudad,
        estado,
        goles_local,
        goles_visitante,
        equipo_local:equipos!partidos_equipo_local_id_fkey(nombre, bandera_url),
        equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre, bandera_url)
      `)
      .eq('id', partidoId)
      .single();

    if (partidoError) {
      console.error(partidoError);
      setCargando(false);
      return;
    }

    setPartido(partidoData);

    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, login, activo')
      .eq('activo', true)
      .order('login', { ascending: true });

    setUsuarios(usuariosData || []);

    const { data: pronosticosData } = await supabase
      .from('pronosticos')
      .select('usuario_id, goles_local, goles_visitante, puntos_obtenidos')
      .eq('partido_id', partidoId);

    setPronosticos(pronosticosData || []);
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

  if (!partido) {
    return (
      <main style={pageStyle}>
        <p style={loadingStyle}>No se encontró el partido.</p>
      </main>
    );
  }

  const partidoComenzado = new Date() >= new Date(partido.fecha_hora);
  const partidoFinalizado = partido.estado === 'FINALIZADO';

  const estadoVisual =
    partidoFinalizado
      ? 'FINALIZADO'
      : partidoComenzado
      ? 'EN JUEGO'
      : 'PROGRAMADO';

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
          <Link href="/resultados" style={menuLinkStyle}>📅 Resultados</Link>
          <Link href="/pronosticos-extras" style={menuLinkStyle}>🎯 Pronósticos extras</Link>
          <Link href="/posiciones" style={menuLinkStyle}>🏆 Posiciones</Link>
          <Link href="/reglas" style={menuLinkStyle}>📋 Reglas</Link>

          {usuario?.es_admin && (
            <Link href="/admin" style={menuLinkStyle}>⚙️ Admin</Link>
          )}
        </aside>

        <section style={contentStyle}>
          <div style={heroPanelStyle}>
            <div>
              <div style={badgeStyle}>Pronósticos del grupo</div>

              <h1 style={titleStyle}>
                {partido.equipo_local?.nombre} vs {partido.equipo_visitante?.nombre}
              </h1>

              <p style={subtitleStyle}>
                Estado: <strong>{estadoVisual}</strong>
              </p>

              <p style={subtitleStyle}>
                {formatearFecha(partido.fecha_hora)}
              </p>

              {(partido.estadio || partido.ciudad) && (
                <p style={subtitleStyle}>
                  🏟️ {partido.estadio || 'Estadio a confirmar'}
                  {partido.ciudad ? ` · ${partido.ciudad}` : ''}
                </p>
              )}
            </div>
          </div>

          <div style={matchCardStyle}>
            <div style={teamsStyle}>
              <div style={teamStyle}>
                {partido.equipo_local?.bandera_url && (
                  <img src={partido.equipo_local.bandera_url} style={flagStyle} />
                )}
                <strong>{partido.equipo_local?.nombre}</strong>
              </div>

              <strong style={scoreStyle}>
                {partidoFinalizado
                  ? `${partido.goles_local} - ${partido.goles_visitante}`
                  : 'VS'}
              </strong>

              <div style={teamStyle}>
                {partido.equipo_visitante?.bandera_url && (
                  <img src={partido.equipo_visitante.bandera_url} style={flagStyle} />
                )}
                <strong>{partido.equipo_visitante?.nombre}</strong>
              </div>
            </div>
          </div>

          {!partidoComenzado && (
            <div style={closedBoxStyle}>
              🔒 Los pronósticos de este partido estarán disponibles cuando comience el partido.
            </div>
          )}

          {partidoComenzado && (
            <div style={rankingPanelStyle}>
              <div style={tableHeaderStyle}>
                <span>Usuario</span>
                <span>Pronóstico</span>
                {partidoFinalizado && <span>Puntos</span>}
              </div>

              {usuarios.map((u) => {
                const pronostico = pronosticos.find(
                  (p) => p.usuario_id === u.id
                );

                return (
                  <div key={u.id} style={rowStyle}>
                    <strong>@{u.login}</strong>

                    <span>
                      {pronostico
                        ? `${pronostico.goles_local} - ${pronostico.goles_visitante}`
                        : 'No pronosticó'}
                    </span>

                    {partidoFinalizado && (
                      <strong style={pointsStyle}>
                        {pronostico?.puntos_obtenidos ?? 0}
                      </strong>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href={partidoFinalizado ? '/resultados' : '/dashboard'}
            style={backButtonStyle}
          >
            Volver
          </Link>
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

const userMenuStyle = { position: 'relative' };

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

const contentStyle = {
  maxWidth: '900px',
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
  fontSize: '40px',
  margin: '0 0 10px',
  fontWeight: '900'
};

const subtitleStyle = {
  color: '#dbeafe',
  margin: '6px 0'
};

const matchCardStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '26px',
  padding: '24px',
  marginBottom: '22px'
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
  gap: '10px',
  fontSize: '20px'
};

const flagStyle = {
  width: '38px',
  height: '26px',
  objectFit: 'cover',
  borderRadius: '5px'
};

const scoreStyle = {
  textAlign: 'center',
  color: '#ffd21f',
  fontSize: '28px'
};

const closedBoxStyle = {
  backgroundColor: 'rgba(248,113,113,0.14)',
  border: '1px solid rgba(248,113,113,0.55)',
  color: '#fecaca',
  borderRadius: '22px',
  padding: '18px 22px',
  fontWeight: '900',
  marginBottom: '22px'
};

const rankingPanelStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '26px',
  padding: '24px',
  marginBottom: '22px'
};

const tableHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 140px 100px',
  color: '#ffd21f',
  fontWeight: '900',
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.12)'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 140px 100px',
  padding: '14px 0',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#dbeafe',
  alignItems: 'center'
};

const pointsStyle = {
  color: '#ffd21f'
};

const backButtonStyle = {
  display: 'inline-block',
  textDecoration: 'none',
  backgroundColor: '#ffd21f',
  color: '#07111f',
  padding: '13px 18px',
  borderRadius: '999px',
  fontWeight: '900'
};