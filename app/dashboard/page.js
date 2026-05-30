'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardPage() {
  const router = useRouter();

  const [usuarioAuth, setUsuarioAuth] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [pronosticos, setPronosticos] = useState({});
  const [mensajes, setMensajes] = useState({});
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

    const { data: partidosData, error: partidosError } = await supabase
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
        equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre, codigo_fifa, bandera_url)
      `)
      .neq('estado', 'FINALIZADO')
      .order('fecha_hora', { ascending: true });

    if (partidosError) {
      console.error(partidosError);
      setCargando(false);
      return;
    }

    setPartidos(partidosData || []);

    const { data: pronosticosData, error: pronosticosError } = await supabase
      .from('pronosticos')
      .select('id, partido_id, goles_local, goles_visitante')
      .eq('usuario_id', authData.user.id);

    if (pronosticosError) {
      console.error(pronosticosError);
    }

    const pronosticosIniciales = {};

    (partidosData || []).forEach((partido) => {
      const pronosticoExistente = pronosticosData?.find(
        (p) => p.partido_id === partido.id
      );

      pronosticosIniciales[partido.id] = {
        goles_local: pronosticoExistente?.goles_local ?? '',
        goles_visitante: pronosticoExistente?.goles_visitante ?? '',
        guardado: !!pronosticoExistente
      };
    });

    setPronosticos(pronosticosIniciales);
    setCargando(false);
  };

  const cambiarPronostico = (partidoId, campo, valor) => {
    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [campo]: valor
      }
    }));

    setMensajes((prev) => ({
      ...prev,
      [partidoId]: ''
    }));
  };

  const guardarPronostico = async (partidoId) => {
    const pronostico = pronosticos[partidoId];

    if (pronostico.goles_local === '' || pronostico.goles_visitante === '') {
      setMensajes((prev) => ({
        ...prev,
        [partidoId]: 'Completá ambos resultados.'
      }));
      return;
    }

    const golesLocal = Number(pronostico.goles_local);
    const golesVisitante = Number(pronostico.goles_visitante);

    if (
      Number.isNaN(golesLocal) ||
      Number.isNaN(golesVisitante) ||
      golesLocal < 0 ||
      golesVisitante < 0
    ) {
      setMensajes((prev) => ({
        ...prev,
        [partidoId]: 'Los goles deben ser números mayores o iguales a 0.'
      }));
      return;
    }

    const { error } = await supabase
      .from('pronosticos')
      .upsert(
        {
          usuario_id: usuarioAuth.id,
          partido_id: partidoId,
          goles_local: golesLocal,
          goles_visitante: golesVisitante,
          fecha_modificacion: new Date().toISOString()
        },
        {
          onConflict: 'usuario_id,partido_id'
        }
      );

    if (error) {
      console.error(error);
      setMensajes((prev) => ({
        ...prev,
        [partidoId]: 'Error al guardar el pronóstico.'
      }));
      return;
    }

    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        guardado: true
      }
    }));

    setMensajes((prev) => ({
      ...prev,
      [partidoId]: 'Pronóstico guardado.'
    }));
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

          <Link href="/dashboard" style={activeMenuLinkStyle}>⚽ Partidos</Link>
          <Link href="/grupos" style={menuLinkStyle}>🌍 Grupos</Link>
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

              <h1 style={titleStyle}>Partidos pendientes</h1>

              <p style={subtitleStyle}>
                Cargá tus pronósticos antes de que empiece cada partido.
              </p>
            </div>

            <div style={statsMiniBoxStyle}>
              <strong>{partidos.length}</strong>
              <span>partidos pendientes</span>
            </div>
          </div>

          {partidos.length === 0 && (
            <div style={emptyStyle}>
              No hay partidos pendientes para pronosticar.
            </div>
          )}

          <div style={matchesContainerStyle}>
            {partidos.map((partido) => {
              const pronostico = pronosticos[partido.id] || {};

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

                    <strong style={versusStyle}>VS</strong>

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

                  <div style={predictionBoxStyle}>
                    <span style={predictionLabelStyle}>Tu pronóstico</span>

                    <div style={predictionStyle}>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={pronostico.goles_local ?? ''}
                        onChange={(e) =>
                          cambiarPronostico(partido.id, 'goles_local', e.target.value)
                        }
                        style={inputStyle}
                      />

                      <span style={predictionSeparatorStyle}>-</span>

                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={pronostico.goles_visitante ?? ''}
                        onChange={(e) =>
                          cambiarPronostico(partido.id, 'goles_visitante', e.target.value)
                        }
                        style={inputStyle}
                      />

                      <button
                        onClick={() => guardarPronostico(partido.id)}
                        style={saveButtonStyle}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  <div style={statusRowStyle}>
                    <span>Estado: {partido.estado}</span>

                    {!pronostico.guardado && (
                      <span style={alertStyle}>⚠ Falta pronóstico</span>
                    )}

                    {pronostico.guardado && (
                      <span style={savedStyle}>✓ Pronóstico cargado</span>
                    )}
                  </div>

                  {mensajes[partido.id] && (
                    <p style={messageStyle}>
                      {mensajes[partido.id]}
                    </p>
                  )}
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
  background:
    'radial-gradient(circle at top, #17345f 0%, #07111f 45%, #030712 100%)',
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
  letterSpacing: '0.5px',
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
  minWidth: '160px',
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '22px',
  padding: '20px',
  textAlign: 'center',
  color: '#dbeafe'
};

const rulesBoxStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.78)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '24px',
  padding: '20px',
  marginBottom: '22px',
  boxShadow: '0 14px 36px rgba(0,0,0,0.28)'
};

const rulesTitleStyle = {
  margin: '0 0 14px',
  color: '#ffd21f'
};

const rulesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12px'
};

const ruleItemStyle = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '14px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  color: '#dbeafe'
};

const emptyStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.78)',
  border: '1px solid rgba(255,255,255,0.14)',
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
  width: '100%',
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '26px',
  padding: '24px',
  boxShadow: '0 18px 45px rgba(0,0,0,0.32)'
};

const matchHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '18px'
};

const groupPillStyle = {
  backgroundColor: 'rgba(255,210,31,0.12)',
  color: '#ffd21f',
  border: '1px solid rgba(255,210,31,0.45)',
  padding: '7px 12px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: '900'
};

const dateStyle = {
  color: '#cbd5e1',
  fontWeight: '800',
  fontSize: '14px'
};

const teamsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 80px 1fr',
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
  fontWeight: '900',
  color: 'white'
};

const flagStyle = {
  width: '38px',
  height: '26px',
  objectFit: 'cover',
  borderRadius: '5px',
  border: '1px solid rgba(255,255,255,0.35)'
};

const versusStyle = {
  fontSize: '22px',
  color: '#ffd21f'
};

const predictionBoxStyle = {
  marginTop: '20px',
  backgroundColor: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '20px',
  padding: '16px'
};

const predictionLabelStyle = {
  display: 'block',
  marginBottom: '12px',
  color: '#dbeafe',
  fontWeight: '900',
  textAlign: 'center'
};

const predictionStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px'
};

const inputStyle = {
  width: '62px',
  padding: '11px',
  fontSize: '16px',
  textAlign: 'center',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '14px',
  color: 'white',
  backgroundColor: 'rgba(255,255,255,0.08)',
  outline: 'none'
};

const predictionSeparatorStyle = {
  fontWeight: '900',
  color: '#ffd21f'
};

const saveButtonStyle = {
  padding: '12px 18px',
  border: 'none',
  borderRadius: '999px',
  backgroundColor: '#ffd21f',
  color: '#07111f',
  fontWeight: '900',
  cursor: 'pointer',
  boxShadow: '0 0 18px rgba(255,210,31,0.25)'
};

const statusRowStyle = {
  marginTop: '14px',
  display: 'flex',
  justifyContent: 'center',
  gap: '18px',
  flexWrap: 'wrap',
  fontSize: '14px',
  color: '#cbd5e1'
};

const alertStyle = {
  color: '#fbbf24',
  fontWeight: '900'
};

const savedStyle = {
  color: '#22c55e',
  fontWeight: '900'
};

const messageStyle = {
  marginTop: '12px',
  fontSize: '14px',
  color: '#dbeafe',
  textAlign: 'center',
  fontWeight: '800'
};