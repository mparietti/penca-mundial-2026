'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PronosticosExtrasPage() {
  const router = useRouter();

  const [usuarioAuth, setUsuarioAuth] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [mundialComenzado, setMundialComenzado] = useState(false);
  const [form, setForm] = useState({
    campeon_id: '',
    goleador: '',
    equipo_menos_goleado_id: ''
  });
  const [mensaje, setMensaje] = useState('');
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
      .select('login, es_admin')
      .eq('id', authData.user.id)
      .single();

    setUsuario(perfil);

    const { data: primerPartido } = await supabase
      .from('partidos')
      .select('fecha_hora')
      .order('fecha_hora', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (primerPartido) {
      setMundialComenzado(new Date() >= new Date(primerPartido.fecha_hora));
    }

    const { data: equiposData } = await supabase
      .from('equipos')
      .select('id, nombre, bandera_url')
      .order('nombre', { ascending: true });

    setEquipos(equiposData || []);

    const { data: apuesta } = await supabase
      .from('apuestas_extras')
      .select('campeon_id, goleador, equipo_menos_goleado_id')
      .eq('usuario_id', authData.user.id)
      .maybeSingle();

    if (apuesta) {
      setForm({
        campeon_id: apuesta.campeon_id || '',
        goleador: apuesta.goleador || '',
        equipo_menos_goleado_id: apuesta.equipo_menos_goleado_id || ''
      });
    }

    setCargando(false);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setMensaje('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (mundialComenzado) {
      setMensaje('Ya no se permiten estas apuestas, el Mundial ha comenzado.');
      return;
    }

    const { error } = await supabase
      .from('apuestas_extras')
      .upsert(
        {
          usuario_id: usuarioAuth.id,
          campeon_id: form.campeon_id || null,
          goleador: form.goleador.trim() || null,
          equipo_menos_goleado_id: form.equipo_menos_goleado_id || null,
          fecha_modificacion: new Date().toISOString()
        },
        {
          onConflict: 'usuario_id'
        }
      );

    if (error) {
      console.error('Error apuestas extras:', JSON.stringify(error, null, 2));
      setMensaje(`Error al guardar: ${error.message || 'sin detalle'}`);
      return;
    }

    setMensaje('Pronósticos extra guardados correctamente.');
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
          <Link href="/resultados" style={menuLinkStyle}>📅 Resultados</Link>
          <Link href="/pronosticos-extras" style={activeMenuLinkStyle}>🎯 Pronósticos extras</Link>
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
              <div style={badgeStyle}>Extras</div>

              <h1 style={titleStyle}>Pronósticos extras</h1>

              <p style={subtitleStyle}>
                Estos pronósticos sumarán puntos al finalizar el Mundial.
              </p>
            </div>
          </div>

          <div
            style={{
              ...warningBoxStyle,
              borderColor: mundialComenzado
                ? 'rgba(248,113,113,0.55)'
                : 'rgba(255,210,31,0.45)',
              backgroundColor: mundialComenzado
                ? 'rgba(248,113,113,0.14)'
                : 'rgba(255,210,31,0.12)',
              color: mundialComenzado ? '#fecaca' : '#fff7cc'
            }}
          >
            {!mundialComenzado ? (
              <>
                <strong>⚠️ Importante</strong>
                <p>
                  Estas apuestas no se podrán realizar luego del inicio del partido inaugural de la Copa del Mundo.
                </p>
              </>
            ) : (
              <>
                <strong>🔒 Pronósticos extras cerrados</strong>
                <p>
                  Ya no se permiten estas apuestas, el Mundial ha comenzado.
                </p>
              </>
            )}
          </div>

          <form onSubmit={guardar} style={formCardStyle}>
            <label style={labelStyle}>
              Campeón
              <select
                name="campeon_id"
                value={form.campeon_id}
                onChange={handleChange}
                disabled={mundialComenzado}
                style={{
                  ...selectStyle,
                  opacity: mundialComenzado ? 0.55 : 1,
                  cursor: mundialComenzado ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Seleccionar campeón</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Goleador
              <input
                type="text"
                name="goleador"
                placeholder="Ej: Darwin Núñez"
                value={form.goleador}
                onChange={handleChange}
                disabled={mundialComenzado}
                style={{
                  ...inputStyle,
                  opacity: mundialComenzado ? 0.55 : 1,
                  cursor: mundialComenzado ? 'not-allowed' : 'text'
                }}
              />
            </label>

            <label style={labelStyle}>
              Equipo menos goleado
              <select
                name="equipo_menos_goleado_id"
                value={form.equipo_menos_goleado_id}
                onChange={handleChange}
                disabled={mundialComenzado}
                style={{
                  ...selectStyle,
                  opacity: mundialComenzado ? 0.55 : 1,
                  cursor: mundialComenzado ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Seleccionar equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={mundialComenzado}
              style={{
                ...submitButtonStyle,
                opacity: mundialComenzado ? 0.55 : 1,
                cursor: mundialComenzado ? 'not-allowed' : 'pointer'
              }}
            >
              Guardar pronósticos extras
            </button>

            {mensaje && (
              <div
                style={{
                  ...messageStyle,
                  backgroundColor: mensaje.startsWith('Error') || mensaje.startsWith('Ya no')
                    ? 'rgba(239,68,68,0.16)'
                    : 'rgba(34,197,94,0.16)',
                  borderColor: mensaje.startsWith('Error') || mensaje.startsWith('Ya no')
                    ? 'rgba(239,68,68,0.45)'
                    : 'rgba(34,197,94,0.45)',
                  color: mensaje.startsWith('Error') || mensaje.startsWith('Ya no')
                    ? '#fecaca'
                    : '#bbf7d0'
                }}
              >
                {mensaje}
              </div>
            )}
          </form>
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
  maxWidth: '760px',
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

const warningBoxStyle = {
  border: '1px solid',
  borderRadius: '22px',
  padding: '18px 22px',
  marginBottom: '22px',
  fontWeight: '800'
};

const formCardStyle = {
  backgroundColor: 'rgba(7, 17, 31, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '30px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: '#e5e7eb',
  fontWeight: '800'
};

const inputStyle = {
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.18)',
  backgroundColor: 'rgba(255,255,255,0.08)',
  color: 'white',
  fontSize: '16px',
  outline: 'none'
};

const selectStyle = {
  ...inputStyle,
  color: '#07111f',
  backgroundColor: 'white'
};

const submitButtonStyle = {
  marginTop: '8px',
  padding: '15px 18px',
  border: 'none',
  borderRadius: '999px',
  backgroundColor: '#ffd21f',
  color: '#07111f',
  fontWeight: '900',
  fontSize: '16px',
  cursor: 'pointer'
};

const messageStyle = {
  marginTop: '4px',
  padding: '13px 15px',
  borderRadius: '14px',
  border: '1px solid',
  fontWeight: '800'
};