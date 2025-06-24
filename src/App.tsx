import { Routes, useNavigate, Route } from 'react-router-dom';
import Sidebar from './utilities/sidebar';
import { SidebarItem } from './utilities/sidebaritem';
import { Home, User, Settings } from 'lucide-react'; // Iconos de ejemplo
import Login from './pages/login';
import MainPage from './pages/mainPage';
import LoginPage from './pages/login';
import ProtectedRoute from './utilities/ProtectedRoute';

export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
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