'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    login: '',
    clave: '',
    repetirClave: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const crearCuenta = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (form.clave !== form.repetirClave) {
      setMensaje('Las claves no coinciden.');
      return;
    }

    setCargando(true);

    const emailFake = `${form.login}@penca.local`;

    const { data, error } = await supabase.auth.signUp({
      email: emailFake,
      password: form.clave
    });

    if (error) {
      setCargando(false);
      setMensaje(error.message);
      return;
    }

    const userId = data.user?.id;

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        id: userId,
        nombre: form.nombre,
        apellido: form.apellido,
        login: form.login
      });

    setCargando(false);

    if (insertError) {
      setMensaje(insertError.message);
      return;
    }

    router.push('/login');
  };

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/" style={brandStyle}>
          Penca Ladri
        </Link>

        <div style={navStyle}>
          <Link href="/" style={ghostButtonStyle}>
            Inicio
          </Link>

          <Link href="/login" style={loginButtonStyle}>
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section style={registerContainerStyle}>
        <div style={registerCardStyle}>
          <div style={badgeStyle}>Mundial 2026</div>

          <h1 style={titleStyle}>Crear cuenta</h1>

          <p style={subtitleStyle}>
            Registrate para cargar tus pronósticos y competir con los Ladris durante todo el Mundial.
          </p>

          <form onSubmit={crearCuenta} style={formStyle}>
            <label style={labelStyle}>
              Nombre
              <input
                type="text"
                name="nombre"
                placeholder="Ej: Martín"
                value={form.nombre}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Apellido
              <input
                type="text"
                name="apellido"
                placeholder="Ej: gonzalez"
                value={form.apellido}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Usuario
              <input
                type="text"
                name="login"
                placeholder="Ej: pedro"
                value={form.login}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Clave
              <input
                type="password"
                name="clave"
                placeholder="Ingresá una clave"
                value={form.clave}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Repetir clave
              <input
                type="password"
                name="repetirClave"
                placeholder="Repetí la clave"
                value={form.repetirClave}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>

            <button type="submit" style={submitButtonStyle} disabled={cargando}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {mensaje && (
            <div style={messageStyle}>
              {mensaje}
            </div>
          )}

          <div style={footerTextStyle}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" style={footerLinkStyle}>
              Iniciá sesión acá
            </Link>
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
  letterSpacing: '0.5px',
  color: 'white',
  textDecoration: 'none'
};

const navStyle = {
  display: 'flex',
  gap: '14px'
};

const ghostButtonStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '11px 18px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.35)',
  fontWeight: '700'
};

const loginButtonStyle = {
  color: '#07111f',
  backgroundColor: '#ffd21f',
  textDecoration: 'none',
  padding: '11px 20px',
  borderRadius: '999px',
  fontWeight: '900',
  boxShadow: '0 0 22px rgba(255,210,31,0.35)'
};

const registerContainerStyle = {
  minHeight: 'calc(100vh - 76px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '40px'
};

const registerCardStyle = {
  width: '100%',
  maxWidth: '540px',
  backgroundColor: 'rgba(7, 17, 31, 0.78)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '28px',
  padding: '40px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
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
  marginBottom: '18px'
};

const titleStyle = {
  fontSize: '46px',
  lineHeight: '1.05',
  margin: '0 0 14px',
  fontWeight: '900'
};

const subtitleStyle = {
  fontSize: '17px',
  lineHeight: '1.5',
  color: '#dbeafe',
  marginBottom: '28px'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
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

const submitButtonStyle = {
  marginTop: '8px',
  padding: '15px 18px',
  border: 'none',
  borderRadius: '999px',
  backgroundColor: '#ffd21f',
  color: '#07111f',
  fontWeight: '900',
  fontSize: '16px',
  cursor: 'pointer',
  boxShadow: '0 0 22px rgba(255,210,31,0.35)'
};

const messageStyle = {
  marginTop: '18px',
  padding: '13px 15px',
  borderRadius: '14px',
  backgroundColor: 'rgba(239,68,68,0.16)',
  border: '1px solid rgba(239,68,68,0.45)',
  color: '#fecaca',
  fontWeight: '700'
};

const footerTextStyle = {
  marginTop: '22px',
  color: '#cbd5e1',
  fontSize: '15px'
};

const footerLinkStyle = {
  color: '#ffd21f',
  fontWeight: '900',
  textDecoration: 'none'
};