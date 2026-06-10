'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GruposPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState(null);
  const [grupos, setGrupos] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
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

    const { data: equipos, error: equiposError } = await supabase
      .from('equipos')
      .select('id, nombre, codigo_fifa, grupo, bandera_url')
      .order('grupo', { ascending: true })
      .order('nombre', { ascending: true });

    if (equiposError) {
      console.error(equiposError);
      setCargando(false);
      return;
    }

    const { data: partidos, error: partidosError } = await supabase
      .from('partidos')
      .select('equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, estado')
      .eq('estado', 'FINALIZADO');

    if (partidosError) {
      console.error(partidosError);
    }

    const tabla = {};

    equipos?.forEach((equipo) => {
      if (!tabla[equipo.grupo]) {
        tabla[equipo.grupo] = [];
      }

      tabla[equipo.grupo].push({
        ...equipo,
        pj: 0,
        puntos: 0,
        gf: 0,
        gc: 0,
        dg: 0
      });
    });

    partidos?.forEach((partido) => {
      const local = buscarEquipo(tabla, partido.equipo_local_id);
      const visitante = buscarEquipo(tabla, partido.equipo_visitante_id);

      if (!local || !visitante) return;
      if (partido.goles_local === null || partido.goles_visitante === null) return;

      local.pj += 1;
      visitante.pj += 1;

      local.gf += partido.goles_local;
      local.gc += partido.goles_visitante;

      visitante.gf += partido.goles_visitante;
      visitante.gc += partido.goles_local;

      local.dg = local.gf - local.gc;
      visitante.dg = visitante.gf - visitante.gc;

      if (partido.goles_local > partido.goles_visitante) {
        local.puntos += 3;
      } else if (partido.goles_local < partido.goles_visitante) {
        visitante.puntos += 3;
      } else {
        local.puntos += 1;
        visitante.puntos += 1;
      }
    });

    Object.keys(tabla).forEach((grupo) => {
      tabla[grupo].sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.nombre.localeCompare(b.nombre);
      });
    });

    setGrupos(tabla);
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
          <Link href="/grupos" style={activeMenuLinkStyle}>🌍 Grupos</Link>
          <Link href="/resultados" style={menuLinkStyle}>📅 Resultados</Link>
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
              <div style={badgeStyle}>Mundial 2026</div>

              <h1 style={titleStyle}>Grupos</h1>

              <p style={subtitleStyle}>
                Tabla de posiciones de cada grupo según los partidos finalizados.
              </p>
            </div>

            <div style={statsMiniBoxStyle}>
              <strong>{Object.keys(grupos).length}</strong>
              <span>grupos</span>
            </div>
          </div>

          <div style={groupsGridStyle}>
            {Object.keys(grupos).sort().map((grupo) => (
              <div key={grupo} style={groupCardStyle}>
                <div style={groupHeaderStyle}>
                  <h2 style={groupTitleStyle}>Grupo {grupo}</h2>
                </div>

                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thTeamStyle}>Selección</th>
                      <th style={thStyle}>PJ</th>
                      <th style={thStyle}>Pts</th>
                      <th style={thStyle}>GF</th>
                      <th style={thStyle}>GC</th>
                      <th style={thStyle}>DG</th>
                    </tr>
                  </thead>

                  <tbody>
                    {grupos[grupo].map((equipo, index) => (
                      <tr key={equipo.id}>
                        <td style={tdTeamStyle}>
                          <span style={positionStyle}>{index + 1}</span>

                          {equipo.bandera_url && (
                            <img
                              src={equipo.bandera_url}
                              alt={equipo.nombre}
                              style={flagStyle}
                            />
                          )}

                          <strong>{equipo.nombre}</strong>
                        </td>

                        <td style={tdStyle}>{equipo.pj}</td>
                        <td style={tdPointsStyle}>{equipo.puntos}</td>
                        <td style={tdStyle}>{equipo.gf}</td>
                        <td style={tdStyle}>{equipo.gc}</td>
                        <td style={tdStyle}>{equipo.dg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function buscarEquipo(tabla, equipoId) {
  for (const grupo of Object.keys(tabla)) {
    const equipo = tabla[grupo].find((e) => e.id === equipoId);
    if (equipo) return equipo;
  }

  return null;
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

const groupsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))',
  gap: '22px'
};

const groupCardStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '26px',
  padding: '24px',
  boxShadow: '0 18px 45px rgba(0,0,0,0.32)'
};

const groupHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const groupTitleStyle = {
  margin: 0,
  color: 'white',
  fontSize: '24px',
  fontWeight: '900'
};

const groupBadgeStyle = {
  color: '#ffd21f',
  border: '1px solid rgba(255,210,31,0.45)',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '900'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const thTeamStyle = {
  textAlign: 'left',
  padding: '12px 10px',
  color: '#ffd21f',
  borderBottom: '1px solid rgba(255,255,255,0.14)',
  fontSize: '13px'
};

const thStyle = {
  textAlign: 'center',
  padding: '12px 8px',
  color: '#ffd21f',
  borderBottom: '1px solid rgba(255,255,255,0.14)',
  fontSize: '13px'
};

const tdTeamStyle = {
  padding: '13px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: 'white',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
};

const tdStyle = {
  textAlign: 'center',
  padding: '13px 8px',
  color: '#dbeafe',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  fontWeight: '700'
};

const tdPointsStyle = {
  ...tdStyle,
  color: '#ffd21f',
  fontWeight: '900'
};

const positionStyle = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.08)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#dbeafe',
  fontSize: '12px',
  fontWeight: '900'
};

const flagStyle = {
  width: '32px',
  height: '22px',
  objectFit: 'cover',
  borderRadius: '5px',
  border: '1px solid rgba(255,255,255,0.35)'
};