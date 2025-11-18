import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isValid = password === confirmPassword && password.length >= 6;

  const handleChangePassword = async () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (!userId) {
      setMessage({ type: 'error', text: 'Usuario no encontrado en sesión' });
      return;
    }

    if (!token) {
      setMessage({ type: 'error', text: 'Token de autenticación no encontrado' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await axios.put(`http://192.168.0.113:8080/user/${userId}/change-password`, {
        newPassword: password
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente. Cerrando sesión...' });
      setPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        localStorage.clear();
        navigate('/');
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña. Por favor, contacte al equipo de TI.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '28rem', margin: '0 auto', padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        Cambiar Contraseña
      </h2>
      
      {/* Advertencia */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.375rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
          ⚠️ Si tiene algún inconveniente después de cambiar la contraseña, 
          comuníquese con el equipo de TI para restablecer la contraseña.
        </p>
      </div>

      {/* Input Nueva Contraseña */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Nueva Contraseña
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', outline: 'none' }}
          placeholder="Mínimo 6 caracteres"
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* Input Confirmar Contraseña */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Confirmar Contraseña
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', outline: 'none' }}
          placeholder="Repita la contraseña"
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* Toggle Mostrar/Ocultar */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#374151' }}>Mostrar contraseñas</span>
        </label>
      </div>

      {/* Validación visual */}
      {password && confirmPassword && (
        <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          {password !== confirmPassword && (
            <p style={{ color: '#ef4444' }}>❌ Las contraseñas no coinciden</p>
          )}
          {password.length < 6 && (
            <p style={{ color: '#ef4444' }}>❌ La contraseña debe tener al menos 6 caracteres</p>
          )}
        </div>
      )}

      {/* Mensajes */}
      {message && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b'
        }}>
          {message.text}
        </div>
      )}

      {/* Botón Cambiar */}
      <button
        onClick={handleChangePassword}
        disabled={!isValid || loading}
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          fontWeight: 'bold',
          color: 'white',
          border: 'none',
          cursor: isValid && !loading ? 'pointer' : 'not-allowed',
          backgroundColor: isValid && !loading ? '#dc2626' : '#d1d5db',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (isValid && !loading) {
            e.currentTarget.style.backgroundColor = '#b91c1c';
          }
        }}
        onMouseLeave={(e) => {
          if (isValid && !loading) {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }
        }}
      >
        {loading ? 'Cambiando...' : 'Cambiar'}
      </button>
    </div>
  );
};

export default ChangePassword;
