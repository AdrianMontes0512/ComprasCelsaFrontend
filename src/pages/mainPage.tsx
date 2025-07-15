import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import bg6 from '../assets/bg2.jpg'; // Importa la imagen de fondo
import logo from '../assets/logo.jpg'; // Importa el logo
import Formulario from '../utilities/Formulario';
import Confirmation from '../utilities/confirmation';
import Jefes from '../utilities/Jefes'; // Asegúrate de importar el componente

export default function MainPage() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const firstName = localStorage.getItem('firstname') || '';
  const lastName = localStorage.getItem('lastname') || '';
  const email = localStorage.getItem('email') || '';
  const fullName = `${firstName} ${lastName}`;
  const userRole = localStorage.getItem('role') || '';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f5f5f5',
        color: '#333',
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
          backgroundColor: userRole === 'TMLIMA' 
            ? 'rgba(0, 0, 0, 0.4)'  // Azul oscuro para TMLIMA
            : 'rgba(0, 0, 0, 0.4)',      // Negro para otros roles
          backdropFilter: 'blur(2px)',
          zIndex: 1,
        }}
      />

      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          backgroundColor: '#f8f9fa',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 1000, // Aumentar z-index del header
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={logo}
            alt="Logo"
            style={{
              height: '50px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Center Section - Title and Role */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#333',
              letterSpacing: '0.5px',
            }}
          >
            Sistema de Compras Celsa
          </h1>
          <div
            style={{
              fontSize: '0.85rem',
              color: '#666',
              backgroundColor: userRole === 'TMLIMA' ? 'rgba(59, 130, 246, 0.1)' : '#f0f0f0',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              marginTop: '0.25rem',
              fontWeight: 500,
              border: userRole === 'TMLIMA' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
            }}
          >
            {localStorage.getItem('role') === 'Empleado' && 'Panel de Colaborador'}
            {localStorage.getItem('role') === 'Compras' && 'Panel de Compras'}
            {localStorage.getItem('role') === 'JefeArea' && 'Panel de Jefe de Área'}
            {localStorage.getItem('role') === 'TMLIMA' && 'Panel de TMLIMA'}
          </div>
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }} data-dropdown>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: isDropdownOpen ? '#f0f0f0' : 'transparent',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#333',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.backgroundColor = '#f8f8f8';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <User size={18} />
            <span>{fullName}</span>
            <ChevronDown
              size={16}
              style={{
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                minWidth: '250px',
                zIndex: 9999, // Z-index muy alto
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {/* User Info */}
              <div
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
                  Nombre: {fullName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  Correo: {email}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#d32f2f',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          overflowY: 'auto',
          justifyContent: 'flex-start',
          paddingTop: '0',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {localStorage.getItem('role') === 'Empleado' && <Formulario />}
        {localStorage.getItem('role') === 'TMLIMA' && <Formulario />}
        {localStorage.getItem('role') === 'Compras' && (
          <div
            style={{
              width: '100%',
              maxWidth: 1500,
              minHeight: 200,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              marginTop: '0',
              marginBottom: '0',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <Confirmation />
          </div>
        )}
        {localStorage.getItem('role') === 'JefeArea' && (
          <div
            style={{
              width: '100%',
              maxWidth: 1500,
              minHeight: 200,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              marginTop: '0',
              marginBottom: '0',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <Jefes />
          </div>
        )}
      </div>

      {/* Agregar estilos CSS para la animación */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}