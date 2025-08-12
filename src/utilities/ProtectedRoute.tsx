import { JSX, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { VerifyToken } from '../services/auth';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        setIsValid(false);
        return;
      }

      try {
        await VerifyToken(token);
        setIsValid(true);
      } catch (error) {
        console.log('Token inválido, cerrando sesión...');
        // Limpiar localStorage si el token es inválido
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('firstname');
        localStorage.removeItem('lastname');
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return children;
}