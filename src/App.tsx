import { Routes, useNavigate, Route } from 'react-router-dom';
import { Home, User, Settings } from 'lucide-react'; // Iconos de ejemplo
import Login from './pages/login';
import MySolicitudes from './pages/misSolicitudes';
import MainPage from './pages/mainPage';
import LoginPage from './pages/login';
import ProtectedRoute from './utilities/ProtectedRoute';

export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/mis-solicitudes" element={<MySolicitudes />} />
      <Route
        path="/mainPage"
        element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}