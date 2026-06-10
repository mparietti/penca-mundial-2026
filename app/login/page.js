'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    login: '',
    clave: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);

    const emailFake = `${form.login}@penca.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email: emailFake,
      password: form.clave
    });

    setCargando(false);

    if (error) {
      setMensaje('Login o clave incorrectos.');
      return;
    }

    router.push('/dashboard');
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

          <Link href="/register" style={registerButtonStyle}>
            Registrarse
          </Link>
        </div>
      </header>

      <section style={loginContainerStyle}>
        <div style={loginCardStyle}>
          <div style={badgeStyle}>Mundial 2026</div>

          <h1 style={titleStyle}>Iniciar sesión</h1>

          <p style={subtitleStyle}>
            Entrá a tu cuenta para cargar pronósticos, ver posiciones y seguir la penca con los Ladris.
          </p>

          <form onSubmit={iniciarSesion} style={formStyle}>
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
                placeholder="Ingresá tu clave"
                value={form.clave}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>

            <button type="submit" style={submitButtonStyle} disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>

          {mensaje && (
            <div style={messageStyle}>
              {mensaje}
            </div>
          )}

          <div style={footerTextStyle}>
            ¿Todavía no tenés cuenta?{' '}
            <Link href="/register" style={footerLinkStyle}>
              Registrate acá
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

const registerButtonStyle = {
  color: '#07111f',
  backgroundColor: '#ffd21f',
  textDecoration: 'none',
  padding: '11px 20px',
  borderRadius: '999px',
  fontWeight: '900',
  boxShadow: '0 0 22px rgba(255,210,31,0.35)'
};

const loginContainerStyle = {
  minHeight: 'calc(100vh - 76px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '40px'
};

const loginCardStyle = {
  width: '100%',
  maxWidth: '500px',
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