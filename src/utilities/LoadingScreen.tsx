import logo from '../assets/logo.jpg';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      {/* Logo con animación */}
      <div
        style={{
          marginBottom: '2rem',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        <img
          src={logo}
          alt="Logo Celsa"
          style={{
            width: '120px',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          }}
        />
      </div>

      {/* Spinner */}
      <div
        style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #f73317',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1.5rem',
        }}
      />

      {/* Mensaje */}
      <p
        style={{
          color: '#374151',
          fontSize: '1.1rem',
          fontWeight: 500,
          margin: 0,
          textAlign: 'center',
        }}
      >
        {message}
      </p>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 1;
            }
            50% { 
              transform: scale(1.05);
              opacity: 0.8;
            }
          }
        `}
      </style>
    </div>
  );
}
