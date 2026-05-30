'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [extras, setExtras] = useState({
    campeon_id: '',
    goleador: '',
    equipo_menos_goleado_id: '',
    puntos_campeon: 10,
    puntos_goleador: 10,
    puntos_menos_goleado: 10
  });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarAdmin();
  }, []);

  const cargarAdmin = async () => {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push('/login');
      return;
    }

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('id, login, es_admin, activo')
      .eq('id', authData.user.id)
      .single();

    if (!perfil?.es_admin || !perfil?.activo) {
      router.push('/dashboard');
      return;
    }

    setUsuario(perfil);

    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, login, activo, es_admin')
      .order('login', { ascending: true });

    setUsuarios(usuariosData || []);

    const { data: equiposData } = await supabase
      .from('equipos')
      .select('id, nombre, bandera_url')
      .order('nombre', { ascending: true });

    setEquipos(equiposData || []);

    const { data: partidosData } = await supabase
      .from('partidos')
      .select(`
        id,
        fecha_hora,
        grupo,
        estado,
        goles_local,
        goles_visitante,
        equipo_local:equipos!partidos_equipo_local_id_fkey(nombre, bandera_url),
        equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre, bandera_url)
      `)
      .order('fecha_hora', { ascending: true });

    setPartidos(partidosData || []);
    setCargando(false);
  };

  const cambiarResultado = (partidoId, campo, valor) => {
    setResultados((prev) => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [campo]: valor
      }
    }));
  };

  const finalizarPartido = async (partidoId) => {
    const r = resultados[partidoId];

    if (!r || r.goles_local === '' || r.goles_visitante === '') {
      setMensaje('Completá los goles del partido.');
      return;
    }

    const { error } = await supabase.rpc('finalizar_partido', {
      p_partido_id: partidoId,
      p_goles_local: Number(r.goles_local),
      p_goles_visitante: Number(r.goles_visitante)
    });

    if (error) {
      console.error(error);
      setMensaje('Error al finalizar partido.');
      return;
    }

    setMensaje('Partido finalizado y puntos calculados.');
    cargarAdmin();
  };

  const cambiarExtra = (e) => {
    setExtras({
      ...extras,
      [e.target.name]: e.target.value
    });
  };

  const finalizarExtras = async (e) => {
    e.preventDefault();

    if (!extras.campeon_id || !extras.goleador || !extras.equipo_menos_goleado_id) {
      setMensaje('Completá campeón, goleador y equipo menos goleado.');
      return;
    }

    const { error } = await supabase.rpc('finalizar_pronosticos_extras', {
      p_campeon_id: extras.campeon_id,
      p_goleador: extras.goleador,
      p_equipo_menos_goleado_id: extras.equipo_menos_goleado_id,
      p_puntos_campeon: Number(extras.puntos_campeon),
      p_puntos_goleador: Number(extras.puntos_goleador),
      p_puntos_menos_goleado: Number(extras.puntos_menos_goleado)
    });

    if (error) {
		console.error('Error finalizar extras:', JSON.stringify(error, null, 2));
		setMensaje(`Error al finalizar pronósticos extra: ${error.message || 'sin detalle'}`);
		return;
	}

    setMensaje('Pronósticos extra finalizados. Se actualizaron los puntos extra en la tabla apuestas_extras.');
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (cargando) {
    return <main style={pageStyle}><p style={loadingStyle}>Cargando...</p></main>;
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/dashboard" style={brandStyle}>Penca Ladri Mundial 2026</Link>

        <details style={userMenuStyle}>
          <summary style={userNameStyle}>@{usuario?.login}</summary>
          <button onClick={cerrarSesion} style={logoutDropdownStyle}>Cerrar sesión</button>
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
          <Link href="/noticias" style={menuLinkStyle}>📰 Noticias</Link>
          <Link href="/admin" style={activeMenuLinkStyle}>⚙️ Admin</Link>
        </aside>

        <section style={contentStyle}>
          <div style={heroPanelStyle}>
            <div>
              <div style={badgeStyle}>Admin</div>
              <h1 style={titleStyle}>Panel de administración</h1>
              <p style={subtitleStyle}>Finalizá partidos, calculá puntos y administrá usuarios.</p>
            </div>
          </div>

          {mensaje && <div style={messageStyle}>{mensaje}</div>}

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>Usuarios</h2>

            <div style={tableHeaderStyle}>
              <span>Login</span>
              <span>Nombre</span>
              <span>Activo</span>
              <span>Admin</span>
            </div>

            {usuarios.map((u) => (
              <div key={u.id} style={tableRowStyle}>
                <strong>@{u.login}</strong>
                <span>{u.nombre} {u.apellido}</span>
                <span>{u.activo ? 'Sí' : 'No'}</span>
                <span>{u.es_admin ? 'Sí' : 'No'}</span>
              </div>
            ))}
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>Finalizar partidos</h2>

            <div style={matchesStyle}>
              {partidos.map((p) => (
                <div key={p.id} style={matchStyle}>
                  <div style={teamsStyle}>
                    <div style={teamStyle}>
                      {p.equipo_local?.bandera_url && <img src={p.equipo_local.bandera_url} style={flagStyle} />}
                      <strong>{p.equipo_local?.nombre}</strong>
                    </div>

                    <span style={vsStyle}>VS</span>

                    <div style={teamStyle}>
                      {p.equipo_visitante?.bandera_url && <img src={p.equipo_visitante.bandera_url} style={flagStyle} />}
                      <strong>{p.equipo_visitante?.nombre}</strong>
                    </div>
                  </div>

                  <p style={smallTextStyle}>Grupo {p.grupo} | Estado: <strong>{p.estado}</strong></p>

                  <div style={resultStyle}>
                    <input
                      type="number"
                      min="0"
                      placeholder={p.goles_local ?? 'Local'}
                      disabled={p.estado === 'FINALIZADO'}
                      onChange={(e) => cambiarResultado(p.id, 'goles_local', e.target.value)}
                      style={inputSmallStyle}
                    />

                    <span>-</span>

                    <input
                      type="number"
                      min="0"
                      placeholder={p.goles_visitante ?? 'Visitante'}
                      disabled={p.estado === 'FINALIZADO'}
                      onChange={(e) => cambiarResultado(p.id, 'goles_visitante', e.target.value)}
                      style={inputSmallStyle}
                    />

                    <button
                      disabled={p.estado === 'FINALIZADO'}
                      onClick={() => finalizarPartido(p.id)}
                      style={buttonStyle}
                    >
                      Finalizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>Finalizar pronósticos extras</h2>

            <form onSubmit={finalizarExtras} style={extrasGridStyle}>
              <label style={labelStyle}>
                Campeón real
                <select name="campeon_id" value={extras.campeon_id} onChange={cambiarExtra} style={selectStyle}>
                  <option value="">Seleccionar</option>
                  {equipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </label>

              <label style={labelStyle}>
                Puntos campeón
                <input name="puntos_campeon" type="number" value={extras.puntos_campeon} onChange={cambiarExtra} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Goleador real
                <input name="goleador" value={extras.goleador} onChange={cambiarExtra} placeholder="Ej: Darwin Núñez" style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Puntos goleador
                <input name="puntos_goleador" type="number" value={extras.puntos_goleador} onChange={cambiarExtra} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Equipo menos goleado real
                <select name="equipo_menos_goleado_id" value={extras.equipo_menos_goleado_id} onChange={cambiarExtra} style={selectStyle}>
                  <option value="">Seleccionar</option>
                  {equipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </label>

              <label style={labelStyle}>
                Puntos menos goleado
                <input name="puntos_menos_goleado" type="number" value={extras.puntos_menos_goleado} onChange={cambiarExtra} style={inputStyle} />
              </label>

              <button type="submit" style={wideButtonStyle}>
                Finalizar pronósticos extras
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #17345f 0%, #07111f 45%, #030712 100%)',
  color: 'white',
  fontFamily: 'Arial, sans-serif'
};

const loadingStyle = { textAlign: 'center', paddingTop: '80px', fontWeight: '800' };

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

const brandStyle = { fontSize: '22px', fontWeight: '900', color: 'white', textDecoration: 'none' };
const userMenuStyle = { position: 'relative' };
const userNameStyle = { listStyle: 'none', cursor: 'pointer', color: '#07111f', backgroundColor: '#ffd21f', padding: '11px 18px', borderRadius: '999px', fontWeight: '900' };
const logoutDropdownStyle = { position: 'absolute', right: 0, top: '52px', width: '160px', padding: '12px', border: 'none', borderRadius: '14px', backgroundColor: '#ef4444', color: 'white', fontWeight: '900', cursor: 'pointer' };

const layoutStyle = { display: 'grid', gridTemplateColumns: '270px 1fr', gap: '28px', padding: '32px 48px 48px' };
const sidebarStyle = { backgroundColor: 'rgba(7, 17, 31, 0.78)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '28px', padding: '24px', height: 'fit-content', position: 'sticky', top: '108px' };
const menuTitleStyle = { marginTop: 0, color: '#ffd21f', fontWeight: '900' };
const menuLinkStyle = { display: 'block', textDecoration: 'none', color: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: '14px', borderRadius: '16px', marginBottom: '12px', fontWeight: '800' };
const activeMenuLinkStyle = { ...menuLinkStyle, backgroundColor: '#ffd21f', color: '#07111f' };

const contentStyle = { maxWidth: '1100px', width: '100%', margin: '0 auto' };
const heroPanelStyle = { backgroundColor: 'rgba(7, 17, 31, 0.78)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '28px', padding: '30px', marginBottom: '22px' };
const badgeStyle = { display: 'inline-block', color: '#ffd21f', border: '1px solid rgba(255,210,31,0.45)', padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '900', marginBottom: '14px' };
const titleStyle = { fontSize: '44px', margin: '0 0 10px', fontWeight: '900' };
const subtitleStyle = { color: '#dbeafe', margin: 0 };

const messageStyle = { backgroundColor: 'rgba(34,197,94,0.16)', border: '1px solid rgba(34,197,94,0.45)', color: '#bbf7d0', padding: '14px', borderRadius: '16px', marginBottom: '20px', fontWeight: '800' };
const cardStyle = { backgroundColor: 'rgba(7, 17, 31, 0.82)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '28px', padding: '24px', marginBottom: '24px' };
const cardTitleStyle = { marginTop: 0, color: '#ffd21f' };

const tableHeaderStyle = { display: 'grid', gridTemplateColumns: '1fr 1.5fr 90px 90px', color: '#ffd21f', fontWeight: '900', marginBottom: '10px' };
const tableRowStyle = { display: 'grid', gridTemplateColumns: '1fr 1.5fr 90px 90px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.10)', color: '#dbeafe' };

const matchesStyle = { display: 'flex', flexDirection: 'column', gap: '14px' };
const matchStyle = { border: '1px solid rgba(255,255,255,0.14)', borderRadius: '20px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.06)' };
const teamsStyle = { display: 'grid', gridTemplateColumns: '1fr 50px 1fr', alignItems: 'center', gap: '10px' };
const teamStyle = { display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' };
const flagStyle = { width: '32px', height: '22px', objectFit: 'cover', borderRadius: '4px' };
const vsStyle = { textAlign: 'center', color: '#ffd21f', fontWeight: '900' };
const smallTextStyle = { textAlign: 'center', color: '#cbd5e1' };
const resultStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' };
const inputSmallStyle = { width: '70px', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.18)', textAlign: 'center' };

const buttonStyle = { padding: '11px 16px', border: 'none', borderRadius: '999px', backgroundColor: '#ffd21f', color: '#07111f', fontWeight: '900', cursor: 'pointer' };
const wideButtonStyle = { ...buttonStyle, gridColumn: '1 / -1', marginTop: '8px' };

const extrasGridStyle = { display: 'grid', gridTemplateColumns: '1fr 180px', gap: '16px' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '8px', color: '#e5e7eb', fontWeight: '800' };
const inputStyle = { padding: '13px 15px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.18)', backgroundColor: 'white', color: '#07111f', fontSize: '15px' };
const selectStyle = inputStyle;