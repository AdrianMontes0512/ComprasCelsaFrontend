/* ============================================================
   COMPRAS CELSA — Login screen (backend real localhost:8080)
   ============================================================ */
import { useState, useEffect } from "react";
import {
  Icon, Button, Field, Input, useToast,
} from "../components/ui";
import { apiLogin } from "../services/api";

const CELSA_LOGO_URL = "https://storage.googleapis.com/celsa-web-assets/Logos/celsa-no-tilde.png";

const CelsaMark = ({ size = 48 }: any) => (
  <img
    src={CELSA_LOGO_URL}
    alt="CELSA"
    style={{ height: size, width: "auto", display: "block" }}
  />
);

interface LoginProps { onLogin: (user:any) => void; }

const Login = ({ onLogin }: LoginProps) => {
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  const validate = () => {
    const e: any = {};
    if (!email) e.email = "Correo requerido";
    if (!password) e.password = "Contraseña requerida";
    else if (password.length < 4) e.password = "Mínimo 4 caracteres";
    return e;
  };

  useEffect(() => {
    if (Object.keys(touched).length) setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const submit = async (e: any) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setTouched({ email: true, password: true });
    if (Object.keys(v).length) {
      push({ kind:"error", title:"Revisa el formulario", message:"Hay campos por completar."});
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (!data?.token) throw new Error("Sin token");
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", email);
      localStorage.setItem("role", data.role || "");
      localStorage.setItem("userId", String(data.id ?? ""));
      localStorage.setItem("firstname", data.firstname || "");
      localStorage.setItem("lastname", data.lastname || "");
      if (data.area) localStorage.setItem("area", data.area);
      onLogin({
        rol: data.role,
        userId: data.id,
        firstname: data.firstname,
        lastname: data.lastname,
        email,
        area: data.area || "",
      });
      push({ kind:"success", title:`Bienvenido, ${data.firstname || ""}`.trim(), message:"Sesión iniciada correctamente."});
    } catch (err: any) {
      const msg = err?.response?.status === 401
        ? "Usuario o contraseña incorrectos"
        : err?.message?.includes("Network")
          ? "No se pudo conectar al servidor (localhost:8080)"
          : "No se pudo iniciar sesión";
      push({ kind:"error", title:"Error al iniciar sesión", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh",
      display:"grid",
      gridTemplateColumns:"minmax(0,1fr) minmax(0,1.1fr)",
      background:"var(--bg-app)",
    }}>
      {/* LEFT: form */}
      <section style={{
        display:"flex",alignItems:"center",justifyContent:"center",
        padding:"40px 48px",position:"relative",
      }}>
        <div style={{width:"100%",maxWidth:380}} className="fade-in">
          <div style={{marginBottom:32}}>
            <CelsaMark size={42} />
          </div>

          <div style={{marginBottom:28}}>
            <div style={{
              fontSize:11,fontWeight:700,letterSpacing:3,
              color:"var(--celsa-red-500)",marginBottom:10,
              textTransform:"uppercase",
            }}>Compras Celsa · v2</div>
            <h1 style={{
              margin:0,fontSize:32,fontWeight:800,lineHeight:1.1,
              letterSpacing:-0.5,color:"var(--fg)",
            }}>Iniciá sesión<br/>en tu panel.</h1>
            <p style={{margin:"12px 0 0",color:"var(--fg-muted)",fontSize:14,lineHeight:1.55}}>
              Gestiona solicitudes de compra, aprobaciones y órdenes en un solo lugar.
            </p>
          </div>

          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:18}}>
            <Field label="Correo corporativo" icon="mail" required error={touched.email && errors.email}>
              <Input
                type="email"
                placeholder="usuario@celsa.com.pe"
                value={email}
                leftIcon="mail"
                onChange={(e:any)=>setEmail(e.target.value)}
                onBlur={()=>setTouched((t:any)=>({...t,email:true}))}
                error={touched.email && errors.email}
              />
            </Field>

            <Field label="Contraseña" icon="lock" required error={touched.password && errors.password}>
              <Input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                leftIcon="lock"
                onChange={(e:any)=>setPassword(e.target.value)}
                onBlur={()=>setTouched((t:any)=>({...t,password:true}))}
                error={touched.password && errors.password}
                rightSlot={
                  <button type="button" onClick={()=>setShowPwd(p=>!p)} style={{
                    background:"transparent",border:"none",cursor:"pointer",
                    padding:6,color:"var(--fg-subtle)",borderRadius:6,
                  }} aria-label={showPwd?"Ocultar":"Mostrar"}>
                    <Icon name={showPwd?"eyeOff":"eye"} size={15}/>
                  </button>
                }
              />
            </Field>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12}}>
              <label style={{display:"flex",alignItems:"center",gap:6,color:"var(--fg-muted)",cursor:"pointer"}}>
                <input type="checkbox" defaultChecked style={{accentColor:"var(--celsa-red-500)"}}/>
                Mantener sesión iniciada
              </label>
              <a href="#" onClick={e=>{e.preventDefault();push({kind:"info",title:"Recuperación",message:"Contacta a TI para resetear tu acceso."});}}
                 style={{color:"var(--celsa-red-600)",fontWeight:600,textDecoration:"none"}}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button variant="primary" size="lg" type="submit" loading={loading} iconRight="arrowR">
              Iniciar sesión
            </Button>
          </form>

          <div style={{
            marginTop:32,paddingTop:18,borderTop:"1px solid var(--border)",
            fontSize:11,color:"var(--fg-subtle)",
          }}>
            <span>© {new Date().getFullYear()} CELSA — Compras</span>
          </div>
        </div>
      </section>

      {/* RIGHT: brand panel */}
      <aside style={{
        position:"relative",overflow:"hidden",
        background:"linear-gradient(140deg, #1a1b27 0%, var(--celsa-plomo-acerado) 60%, #1f1213 100%)",
        color:"#fff",
        display:"flex",alignItems:"center",justifyContent:"center",
        padding:"40px 48px",
      }}>
        <svg viewBox="0 0 600 600" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.35}} aria-hidden="true">
          <defs>
            <pattern id="orla-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M0 0 L12 0 L0 12 Z" fill="rgba(229,32,29,0.5)"/>
              <path d="M60 60 L48 60 L60 48 Z" fill="rgba(229,32,29,0.5)"/>
            </pattern>
          </defs>
          <rect width="600" height="600" fill="url(#orla-grid)"/>
        </svg>
        <div style={{
          position:"absolute",bottom:-200,right:-200,
          width:560,height:560,
          background:"radial-gradient(circle, rgba(229,32,29,0.35) 0%, transparent 65%)",
          filter:"blur(10px)",
        }}/>

      </aside>

      <style>{`@media (max-width: 900px) { aside { display: none !important; } }`}</style>
    </div>
  );
};

export default Login;
