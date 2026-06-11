/* ============================================================
   COMPRAS CELSA — App shell (sidebar + topbar + content slot)
   ============================================================ */
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Icon, IconButton, Input, Badge } from "./ui";
// notifications removed per request

export const NAV_BY_ROLE: Record<string, any[]> = {
  Empleado: [
    { id:"nueva",     label:"Nueva solicitud",   icon:"plus" },
    { id:"mias",      label:"Mis solicitudes",   icon:"history" },
  ],
  TMLIMA: [
    { id:"nueva",     label:"Nueva solicitud",   icon:"plus" },
    { id:"mias",      label:"Mis solicitudes",   icon:"history" },
  ],
  JefeArea: [
    { id:"inbox",     label:"Bandeja de aprobación", icon:"checkCircle" },
    { id:"kanban",    label:"Vista Kanban",          icon:"kanban" },
    { id:"area",      label:"Mi área",               icon:"building" },
  ],
  Compras: [
    { id:"dashboard", label:"Dashboard",   icon:"trend" },
    { id:"gestion",   label:"Gestión",     icon:"cart" },
  ],
};

const ROLE_LABEL: Record<string,string> = {
  Empleado: "Panel de Colaborador",
  TMLIMA:   "Panel TMLIMA",
  JefeArea: "Panel de Jefe de Área",
  Compras:  "Panel de Compras",
};

interface ShellProps {
  user: any;
  theme: string;
  onToggleTheme: () => void;
  onLogout: () => void;
  onChangePassword: () => void;
  activeNav: string | null;
  onNav: (id:string) => void;
  children: ReactNode;
  page: string;
}

export const Shell = ({ user, theme, onToggleTheme, onLogout, onChangePassword, activeNav, onNav, children, page }: ShellProps) => {
  const navItems = NAV_BY_ROLE[user.rol] || [];
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    const off = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);

  const initials = ((user.firstname?.[0] || "?") + (user.lastname?.[0] || "")).toUpperCase();

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"var(--sidebar-w) 1fr",
      minHeight:"100vh",
      background:"var(--bg-app)",
    }}>
      {/* SIDEBAR */}
      <aside style={{
        background:"var(--bg-sidebar)",
        color:"var(--fg-on-dark)",
        display:"flex",flexDirection:"column",
        borderRight:"1px solid rgba(255,255,255,0.04)",
        position:"sticky",top:0,height:"100vh",
      }}>
        <div style={{
          padding:"22px 22px 18px",
          display:"flex",alignItems:"center",gap:10,
        }}>
          <img
            src="https://storage.googleapis.com/celsa-web-assets/Logos/celsa-no-tilde.png"
            alt="CELSA"
            style={{height:32,width:"auto",display:"block"}}
          />
          <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
            <span style={{fontSize:9.5,letterSpacing:2.5,color:"rgba(255,255,255,0.5)",fontWeight:600}}>COMPRAS · V2</span>
          </div>
        </div>

        <nav style={{padding:"8px 12px",flex:1,display:"flex",flexDirection:"column",gap:2}}>
          <div style={{
            fontSize:10,letterSpacing:2.4,fontWeight:700,
            color:"rgba(255,255,255,0.4)",padding:"14px 10px 6px",
            textTransform:"uppercase",
          }}>{ROLE_LABEL[user.rol]}</div>

          {navItems.map((item:any) => {
            const active = activeNav === item.id;
            return (
              <button key={item.id} onClick={()=>onNav(item.id)} style={{
                display:"flex",alignItems:"center",gap:11,
                padding:"10px 12px",
                background: active ? "var(--bg-sidebar-hi)" : "transparent",
                border:"none",
                borderRadius:"var(--r-md)",
                color: active ? "#fff" : "rgba(255,255,255,0.75)",
                cursor:"pointer",
                fontSize:13,fontWeight: active?600:500,
                textAlign:"left",position:"relative",
                transition:"all .15s var(--ease-out)",
              }}
                onMouseEnter={e=>{ if(!active) (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)"; }}
                onMouseLeave={e=>{ if(!active) (e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
              >
                {active && (
                  <span style={{
                    position:"absolute",left:-12,top:8,bottom:8,width:3,
                    background:"var(--celsa-red-500)",borderRadius:"0 3px 3px 0",
                  }}/>
                )}
                <Icon name={item.icon} size={16} stroke={active?2.2:1.8}/>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize:10,fontWeight:700,
                    padding:"2px 7px",borderRadius:999,
                    background:"var(--celsa-red-500)",color:"#fff",
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}

          <div style={{flex:1}}/>

          <div style={{padding:"12px 10px",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:12}}>
            <div style={{
              display:"flex",gap:10,alignItems:"center",
              padding:"10px 8px",
            }}>
              <div style={{
                width:32,height:32,borderRadius:"50%",
                background:"linear-gradient(135deg,#e5201d,#a01513)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontWeight:700,fontSize:12,color:"#fff",
              }}>{initials}</div>
              <div style={{flex:1,minWidth:0,lineHeight:1.2}}>
                <div style={{fontSize:12,fontWeight:600,color:"#fff",textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>
                  {user.firstname} {user.lastname}
                </div>
                <div style={{fontSize:10.5,color:"rgba(255,255,255,0.5)",textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>
                  {user.area}
                </div>
              </div>
              <button onClick={onLogout} title="Cerrar sesión" style={{
                background:"transparent",border:"none",cursor:"pointer",
                color:"rgba(255,255,255,0.55)",padding:6,borderRadius:6,
              }}><Icon name="logout" size={15}/></button>
            </div>
          </div>
        </nav>
      </aside>

      {/* MAIN */}
      <main style={{display:"flex",flexDirection:"column",minWidth:0}}>
        <header style={{
          height:"var(--header-h)",
          borderBottom:"1px solid var(--border)",
          background:"var(--bg-surface)",
          padding:"0 28px",
          display:"flex",alignItems:"center",gap:18,
          position:"sticky",top:0,zIndex:50,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--fg-muted)"}}>
            <span style={{color:"var(--fg-subtle)"}}>Compras Celsa</span>
            <Icon name="chevronR" size={12} stroke={2}/>
            <span style={{color:"var(--fg)",fontWeight:600}}>{page}</span>
          </div>

          <div style={{flex:1}}/>

          <IconButton icon={theme==="dark"?"sun":"moon"} label="Tema" onClick={onToggleTheme} variant="outline"/>

          {/* user menu */}
          <div ref={menuRef} style={{position:"relative"}}>
            <button onClick={()=>setUserMenu(o=>!o)} style={{
              display:"flex",alignItems:"center",gap:10,
              padding:"4px 10px 4px 4px",
              border:"1px solid var(--border-strong)",
              borderRadius:30,
              background:"var(--bg-surface)",
              cursor:"pointer",
              transition:"all .15s var(--ease-out)",
            }}>
              <span style={{
                width:28,height:28,borderRadius:"50%",
                background:"linear-gradient(135deg,#e5201d,#a01513)",
                color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:700,
              }}>{initials}</span>
              <span style={{fontSize:12.5,fontWeight:600,color:"var(--fg)"}}>{user.firstname}</span>
              <Icon name="chevronD" size={12} style={{color:"var(--fg-muted)",transform:userMenu?"rotate(180deg)":"none",transition:"transform .2s"}}/>
            </button>
            {userMenu && (
              <div className="fade-in" style={{
                position:"absolute",top:"calc(100% + 8px)",right:0,
                width:240,background:"var(--bg-surface)",
                border:"1px solid var(--border)",
                borderRadius:"var(--r-lg)",
                boxShadow:"var(--sh-lg)",
                overflow:"hidden",zIndex:100,
              }}>
                <div style={{padding:"14px",background:"var(--bg-sunken)",borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--fg)"}}>{user.firstname} {user.lastname}</div>
                  <div style={{fontSize:11.5,color:"var(--fg-muted)",marginTop:2}}>{user.email}</div>
                  <Badge color="red" style={{marginTop:8}}>{user.rol}</Badge>
                </div>
                <button onClick={()=>{ setUserMenu(false); onChangePassword(); }} style={{
                  width:"100%",display:"flex",alignItems:"center",gap:10,
                  padding:"10px 14px",border:"none",background:"transparent",
                  color:"var(--fg)",cursor:"pointer",fontSize:13,textAlign:"left",
                }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="var(--bg-sunken)"}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}>
                  <Icon name="lock" size={14} style={{color:"var(--fg-muted)"}}/>Cambiar contraseña
                </button>
                <div style={{borderTop:"1px solid var(--border)"}}>
                  <button onClick={onLogout} style={{
                    width:"100%",display:"flex",alignItems:"center",gap:10,
                    padding:"10px 14px",border:"none",background:"transparent",
                    color:"var(--celsa-red-600)",cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left",
                  }}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="var(--celsa-red-50)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}>
                    <Icon name="logout" size={14}/> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div style={{flex:1,padding:"28px 28px 60px",minWidth:0,overflow:"auto"}}>
          {children}
        </div>
      </main>
    </div>
  );
};
