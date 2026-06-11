/* ============================================================
   COMPRAS CELSA — App entry
   ============================================================ */
import { useState, useEffect, Fragment } from "react";
import { ToastProvider } from "./components/ui";
import { Shell, NAV_BY_ROLE } from "./components/Shell";
import ChangePasswordModal from "./components/ChangePasswordModal";
import Login from "./pages/Login";
import FormularioPage from "./pages/FormularioPage";
import MisSolicitudesPage from "./pages/MisSolicitudesPage";
import JefesPage from "./pages/JefesPage";
import ComprasPage from "./pages/ComprasPage";

const PAGE_LABEL: Record<string,string> = {
  nueva: "Nueva solicitud",
  mias:  "Mis solicitudes",
  inbox: "Bandeja de aprobación",
  kanban: "Vista Kanban",
  area:  "Mi área",
  dashboard: "Dashboard",
  gestion: "Gestión de solicitudes",
  ordenes: "Órdenes de compra",
  proveedores: "Proveedores",
};

const restoreSession = (): any | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const rol = localStorage.getItem("role") || "";
  const userId = Number(localStorage.getItem("userId") || 0);
  const firstname = localStorage.getItem("firstname") || "";
  const lastname = localStorage.getItem("lastname") || "";
  const email = localStorage.getItem("email") || "";
  const area = localStorage.getItem("area") || "";
  if (!rol) return null;
  return { rol, userId, firstname, lastname, email, area };
};

const AppInner = () => {
  const [user, setUser] = useState<any>(() => restoreSession());
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");
  const [activeNav, setActiveNav] = useState<string|null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      const first = (NAV_BY_ROLE[user.rol] || [])[0];
      setActiveNav(first?.id || null);
    } else {
      setActiveNav(null);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    localStorage.removeItem("area");
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={setUser}/>;
  }

  const page = activeNav;

  const renderPage = () => {
    if (user.rol === "Empleado" || user.rol === "TMLIMA") {
      if (page === "mias") return <MisSolicitudesPage user={user}/>;
      return <FormularioPage user={user} page={page||undefined}/>;
    }
    if (user.rol === "JefeArea") {
      return <JefesPage user={user} page={page||undefined}/>;
    }
    if (user.rol === "Compras") {
      return <ComprasPage user={user} page={page}/>;
    }
    return null;
  };

  return (
    <Fragment>
      <Shell
        user={user}
        theme={theme}
        onToggleTheme={()=>setTheme(t=>t==="light"?"dark":"light")}
        onLogout={handleLogout}
        onChangePassword={()=>setPwdOpen(true)}
        activeNav={activeNav}
        onNav={setActiveNav}
        page={PAGE_LABEL[activeNav||""] || ""}
      >
        <div key={activeNav} className="fade-in">
          {renderPage()}
        </div>
      </Shell>
      <ChangePasswordModal open={pwdOpen} userId={user.userId} onClose={()=>setPwdOpen(false)}/>
    </Fragment>
  );
};

const App = () => (
  <Fragment>
    <ToastProvider>
      <AppInner/>
    </ToastProvider>
  </Fragment>
);

export default App;
