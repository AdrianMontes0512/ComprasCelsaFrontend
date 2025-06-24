import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.jpg';
import bg6 from '../assets/bg2.jpg';
import { Login } from '../services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await Login({ username: email, password });
      console.log('Login exitoso:', data);
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', email);
        localStorage.setItem('role', data.role || '');
        localStorage.setItem('userId', data.id.toString() || '');
        localStorage.setItem('firstname', data.firstname || '');
        localStorage.setItem('lastname', data.lastname || '');
        navigate('/mainPage');
      }
    } catch (error) {
      alert('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        backgroundImage: `url(${bg6})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />
      
      {/* Login Card */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#f8f9fa',
          borderRadius: '20px',
          padding: '3rem 2.5rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '400px',
          maxWidth: '450px',
          width: '90%',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img
              src={logo}
              alt="logo"
              style={{
                width: '120px',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>
          <h1 style={{ 
            color: '#1f2937', 
            fontSize: '2rem', 
            fontWeight: 700, 
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            Bienvenido
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1rem', 
            margin: 0,
            fontWeight: 400
          }}>
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Email Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#374151', 
              fontSize: '0.95rem', 
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>
              <Mail size={18} style={{ color: '#f73317' }} />
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@celsa.com.pe"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: '#f8f9fa',
                border: '2px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '0.95rem',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f73317';
                e.target.style.boxShadow = '0 0 0 3px rgba(247, 51, 23, 0.1)';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#374151', 
              fontSize: '0.95rem', 
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>
              <Lock size={18} style={{ color: '#f73317' }} />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: '#f8f9fa',
                border: '2px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '0.95rem',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f73317';
                e.target.style.boxShadow = '0 0 0 3px rgba(247, 51, 23, 0.1)';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(247, 51, 23, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(247, 51, 23, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(247, 51, 23, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Iniciando sesión...
              </>
            ) : (
              <>
                <User size={20} />
                Iniciar sesión
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '0.85rem', 
            margin: 0 
          }}>
            Sistema de Compras Celsa © 2025
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}