import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown, LogOut, User, ArrowLeft } from 'lucide-react';
import bg6 from '../assets/bg2.jpg'; // Importa la imagen de fondo
import logo from '../assets/logo.jpg'; // Importa el logo
import MySolicitudesComponent from '../utilities/misSolicitudes'; // El componente que ya tienes
import LoadingScreen from '../utilities/LoadingScreen';

export default function MisSolicitudesPage() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const firstName = localStorage.getItem('firstname') || '';
  const lastName = localStorage.getItem('lastname') || '';
  const email = localStorage.getItem('email') || '';
  const fullName = `${firstName} ${lastName}`;

  const handleLogout = () => {
    setIsLoggingOut(true);
    setIsDropdownOpen(false);
    
    setTimeout(() => {
      localStorage.clear();
      navigate('/');
    }, 1500);
  };

  const handleBackToMain = () => {
    navigate('/mainPage');
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
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
          zIndex: 1000,
        }}
      >
        {/* Logo y botón de regreso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleBackToMain}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#333',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f8f8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          
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

        {/* Center Section - Title */}
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
            Mis Solicitudes
          </h1>
          <div
            style={{
              fontSize: '0.85rem',
              color: '#666',
              backgroundColor: '#f0f0f0',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              marginTop: '0.25rem',
              fontWeight: 500,
            }}
          >
            Panel Personal
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
                zIndex: 9999,
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

      {/* Main Content - Sin condiciones de rol */}
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
          <MySolicitudesComponent />
        </div>
      </div>

      {/* CSS para animaciones */}
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

      {/* Pantalla de carga para logout */}
      {isLoggingOut && (
        <LoadingScreen message="Cerrando sesión..." />
      )}
    </div>
  );
}