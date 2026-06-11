/* ============================================================
   COMPRAS CELSA — UI primitives + iconography
   ============================================================ */
import {
  useState, useEffect, useCallback, useContext, createContext,
  type ReactNode, type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

/* ---------- Icons (single-stroke lucide-style) ---------- */
const ICONS: Record<string,string> = {
  menu:        "M3 6h18M3 12h18M3 18h18",
  dot:         "M12 12h.01",
  chevronD:    "m6 9 6 6 6-6",
  chevronR:    "m9 6 6 6-6 6",
  chevronL:    "m15 18-6-6 6-6",
  chevronU:    "m6 15 6-6 6 6",
  arrowR:      "M5 12h14M13 5l7 7-7 7",
  arrowL:      "M19 12H5M11 19l-7-7 7-7",
  arrowUD:     "M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4",
  search:      "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.5-4.5",
  bell:        "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0",
  user:        "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 11l-3-3M19 8l-3 3",
  userCircle:  "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.4 7.6A6 6 0 0 1 11.6 16h.8a6 6 0 0 1 6 3.6",
  logout:      "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  settings:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.4 1a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2.1 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2.1 1.6 2 3.4 2.4-1a7 7 0 0 0 2.1 1.2L10 21h4l.5-2.6a7 7 0 0 0 2.1-1.2l2.4 1 2-3.4-2.1-1.6c.1-.4.1-.8.1-1.2Z",
  moon:        "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z",
  sun:         "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  check:       "M20 6 9 17l-5-5",
  checkCircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.1l-3-3",
  x:           "M18 6 6 18M6 6l18 12",
  xCircle:     "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20ZM15 9l-6 6M9 9l6 6",
  alert:       "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  info:        "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20ZM12 8h.01M11 12h1v4h1",
  clock:       "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20ZM12 6v6l4 2",
  flag:        "M4 22V4a1 1 0 0 1 1.6-.8L13 7l-7.4 4.8a1 1 0 0 0-.6 1V22",
  flame:       "M9 21c-3 0-6-2-6-6 0-3 3-5 3-8 0 0 3 0 4 3 1-2 3-4 5-4 0 3 4 5 4 9 0 4-3 6-6 6Z",
  box:         "M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7 12 12l8.7-5M12 22V12",
  truck:       "M3 17h13V5H3v12ZM16 8h4l3 3v6h-7M7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  building:    "M3 22V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18M3 22h18M21 22V11a2 2 0 0 0-2-2h-2M7 6h2M7 10h2M7 14h2M13 6h0M13 10h0M13 14h0",
  hammer:      "M15 12 9 6 5 10l6 6 4-4Zm0 0 7 7M3 8l8-8 3 3-8 8H3V8Z",
  cart:        "M2 3h2l3 14h12l3-10H6M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  fileText:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M9 13h6M9 17h4",
  image:       "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM21 15l-5-5-9 9",
  upload:      "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v13",
  download:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  trash:       "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6",
  edit:        "M11 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  plus:        "M12 5v14M5 12h14",
  filter:      "M22 3H2l8 9.5V19l4 2v-8.5L22 3Z",
  copy:        "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2M8 2h8v14H8z",
  eye:         "M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff:      "M2 2l20 20M6.7 6.7C3 9.5 2 12 2 12s4 8 10 8c2.1 0 4-.6 5.6-1.6M9.8 5C10.5 4.9 11.2 5 12 5c6 0 10 8 10 8s-1 1.9-3 3.7M14 14a3 3 0 1 1-4-4",
  grid:        "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list:        "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  kanban:      "M6 5v11M12 5v8M18 5v14M4 5h16M4 22h16",
  calendar:    "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM16 2v4M8 2v4M3 10h18",
  mail:        "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 6l-10 7L2 6",
  lock:        "M5 11h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM8 11V7a4 4 0 1 1 8 0v4",
  refresh:     "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  send:        "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
  history:     "M3 3v5h5M3.05 13a9 9 0 1 0 .5-4M12 7v5l3 2",
  trend:       "M22 7 13.5 15.5l-5-5L2 17M16 7h6v6",
  dollar:      "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  layers:      "m12 2 10 6-10 6L2 8l10-6Zm10 10-10 6L2 12m20 4-10 6L2 16",
};

export const Icon = ({ name, size = 16, stroke = 1.75, style, className }:
  { name:string; size?:number; stroke?:number; style?:CSSProperties; className?:string }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flex: "0 0 auto", display: "inline-block", verticalAlign: "-3px", ...style }}
    className={className}
    aria-hidden="true"
  >
    {(ICONS[name] || ICONS.dot).split(" M").map((d, i) => (
      <path key={i} d={i === 0 ? d : "M" + d} />
    ))}
  </svg>
);

/* ---------- Button ---------- */
const buttonBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "1px solid transparent",
  borderRadius: "var(--r-md)",
  padding: "0 14px",
  height: 36,
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: 0.1,
  cursor: "pointer",
  transition: "all .18s var(--ease-out)",
  whiteSpace: "nowrap",
  userSelect: "none",
};

export const Button = ({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  style,
  disabled,
  loading,
  ...rest
}: any) => {
  const sizes: any = {
    sm: { height: 30, padding: "0 10px", fontSize: 12 },
    md: { height: 36, padding: "0 14px", fontSize: 13 },
    lg: { height: 44, padding: "0 18px", fontSize: 14 },
  };
  const variants: any = {
    primary: {
      background: "var(--celsa-red-500)",
      color: "var(--fg-on-red)",
      borderColor: "var(--celsa-red-500)",
      boxShadow: "var(--sh-red)",
    },
    secondary: {
      background: "var(--bg-surface)",
      color: "var(--fg)",
      borderColor: "var(--border-strong)",
      boxShadow: "var(--sh-sm)",
    },
    ghost: {
      background: "transparent",
      color: "var(--fg)",
      borderColor: "transparent",
    },
    danger: {
      background: "var(--celsa-red-500)",
      color: "#fff",
      borderColor: "var(--celsa-red-500)",
    },
    success: {
      background: "var(--celsa-verde)",
      color: "#fff",
      borderColor: "var(--celsa-verde)",
    },
    dark: {
      background: "var(--ink-900)",
      color: "#fff",
      borderColor: "var(--ink-900)",
    },
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{
        ...buttonBaseStyle,
        ...sizes[size],
        ...variants[variant],
        opacity: disabled ? 0.55 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        ...style,
      }}
      onMouseEnter={(e:any) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.filter = "brightness(1.04)";
      }}
      onMouseLeave={(e:any) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.filter = "none";
      }}
    >
      {loading ? <Icon name="refresh" style={{animation:"spin-360 .9s linear infinite"}}/> : icon && <Icon name={icon} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} />}
    </button>
  );
};

export const IconButton = ({ icon, label, onClick, variant = "ghost", size = 32, style }: any) => (
  <button
    aria-label={label}
    title={label}
    onClick={onClick}
    style={{
      display:"inline-flex",alignItems:"center",justifyContent:"center",
      width:size,height:size,
      borderRadius:"var(--r-md)",
      border: variant==="outline"?"1px solid var(--border-strong)":"1px solid transparent",
      background: variant==="outline"?"var(--bg-surface)":"transparent",
      color:"var(--fg-muted)",
      cursor:"pointer",
      transition:"all .15s var(--ease-out)",
      ...style,
    }}
    onMouseEnter={(e:any)=>{ e.currentTarget.style.background="var(--ink-100)"; e.currentTarget.style.color="var(--fg)"; }}
    onMouseLeave={(e:any)=>{ e.currentTarget.style.background=variant==="outline"?"var(--bg-surface)":"transparent"; e.currentTarget.style.color="var(--fg-muted)"; }}
  >
    <Icon name={icon} size={16} />
  </button>
);

/* ---------- Badge / Status / Priority ---------- */
export const Badge = ({ children, color="neutral", style, icon }: any) => {
  const palette: any = {
    neutral: { bg:"var(--ink-100)", fg:"var(--ink-700)", bd:"var(--border)" },
    red:     { bg:"var(--celsa-red-50)", fg:"var(--celsa-red-700)", bd:"#f3b9b6" },
    blue:    { bg:"#e8eef9", fg:"var(--celsa-azul)", bd:"#c2d2ee" },
    green:   { bg:"#e3f4e8", fg:"#1a6c34", bd:"#9bdbab" },
    amber:   { bg:"var(--status-pendiente-bg)", fg:"var(--status-pendiente-fg)", bd:"var(--status-pendiente-bd)" },
    violet:  { bg:"#f0eaff", fg:"#5b21b6", bd:"#d5c4f7" },
    plomo:   { bg:"#ededf2", fg:"var(--celsa-plomo-acerado)", bd:"#cccfd9" },
  };
  const p = palette[color] || palette.neutral;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:"3px 9px",borderRadius:"var(--r-pill)",
      fontSize:11,fontWeight:600,letterSpacing:0.3,
      textTransform:"uppercase",
      background:p.bg,color:p.fg,border:`1px solid ${p.bd}`,
      ...style,
    }}>
      {icon && <Icon name={icon} size={11} stroke={2.2}/>}
      {children}
    </span>
  );
};

export const StatusBadge = ({ value }: { value:string }) => {
  const map: any = {
    Pendiente: { color:"amber",  icon:"clock" },
    Aprobado:  { color:"green",  icon:"checkCircle" },
    Rechazado: { color:"red",    icon:"xCircle" },
  };
  const m = map[value] || { color:"neutral" };
  return <Badge color={m.color} icon={m.icon}>{value}</Badge>;
};

export const PriorityBadge = ({ value }: { value:string }) => {
  const styles: any = {
    Emergencia: { bg:"var(--celsa-red-500)", fg:"#fff", icon:"flame" },
    Urgencia:   { bg:"#f59e0b",              fg:"#fff", icon:"alert" },
    Estándar:   { bg:"var(--celsa-verde)",   fg:"#fff", icon:"flag" },
  };
  const s = styles[value] || styles.Estándar;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:"3px 9px",borderRadius:"var(--r-pill)",
      fontSize:11,fontWeight:700,letterSpacing:0.4,
      textTransform:"uppercase",background:s.bg,color:s.fg,
    }}>
      <Icon name={s.icon} size={11} stroke={2.4}/>
      {value}
    </span>
  );
};

export const TypeBadge = ({ value }: { value:string }) => {
  const map: any = { Producto: "blue", Servicio: "violet", Activo: "plomo" };
  return <Badge color={map[value]||"neutral"}>{value}</Badge>;
};

/* ---------- Input / Select / Textarea ---------- */
const fieldStyle: CSSProperties = {
  width:"100%",
  height:38,
  padding:"0 12px",
  borderRadius:"var(--r-md)",
  border:"1px solid var(--border-strong)",
  background:"var(--bg-surface)",
  color:"var(--fg)",
  fontSize:13,
  transition:"all .15s var(--ease-out)",
  outline:"none",
};

export const Field = ({ label, hint, error, required, icon, children, style }: any) => (
  <label style={{ display:"flex", flexDirection:"column", gap:6, ...style }}>
    {label && (
      <span style={{
        fontSize:11,fontWeight:600,letterSpacing:0.4,textTransform:"uppercase",
        color: error ? "var(--celsa-red-600)" : "var(--fg-muted)",
        display:"flex",alignItems:"center",gap:5,
      }}>
        {icon && <Icon name={icon} size={11} stroke={2.2}/>}
        {label}{required && <span style={{color:"var(--celsa-red-500)"}}>*</span>}
      </span>
    )}
    {children}
    {error && <span style={{fontSize:11,color:"var(--celsa-red-600)",display:"flex",alignItems:"center",gap:4}}><Icon name="alert" size={11}/>{error}</span>}
    {hint && !error && <span style={{fontSize:11,color:"var(--fg-subtle)"}}>{hint}</span>}
  </label>
);

export const Input = ({ error, leftIcon, rightSlot, style, ...rest }: any) => (
  <div style={{ position:"relative" }}>
    {leftIcon && (
      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--fg-subtle)"}}>
        <Icon name={leftIcon} size={14}/>
      </span>
    )}
    <input
      {...rest}
      style={{
        ...fieldStyle,
        paddingLeft: leftIcon ? 36 : 12,
        paddingRight: rightSlot ? 36 : 12,
        borderColor: error ? "var(--celsa-red-500)" : "var(--border-strong)",
        ...style,
      }}
      onFocus={(e:any) => {
        e.target.style.borderColor = "var(--celsa-red-500)";
        e.target.style.boxShadow = "var(--sh-focus)";
        rest.onFocus && rest.onFocus(e);
      }}
      onBlur={(e:any) => {
        e.target.style.borderColor = error ? "var(--celsa-red-500)" : "var(--border-strong)";
        e.target.style.boxShadow = "none";
        rest.onBlur && rest.onBlur(e);
      }}
    />
    {rightSlot && (
      <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)"}}>{rightSlot}</span>
    )}
  </div>
);

export const Select = ({ children, error, style, ...rest }: any) => (
  <div style={{ position:"relative" }}>
    <select
      {...rest}
      style={{
        ...fieldStyle,
        appearance:"none",
        paddingRight:36,
        cursor:"pointer",
        borderColor: error ? "var(--celsa-red-500)" : "var(--border-strong)",
        ...style,
      }}
      onFocus={(e:any) => {
        e.target.style.borderColor = "var(--celsa-red-500)";
        e.target.style.boxShadow = "var(--sh-focus)";
        rest.onFocus && rest.onFocus(e);
      }}
      onBlur={(e:any) => {
        e.target.style.borderColor = error ? "var(--celsa-red-500)" : "var(--border-strong)";
        e.target.style.boxShadow = "none";
        rest.onBlur && rest.onBlur(e);
      }}
    >
      {children}
    </select>
    <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"var(--fg-subtle)"}}>
      <Icon name="chevronD" size={14}/>
    </span>
  </div>
);

export const Textarea = ({ error, style, ...rest }: any) => (
  <textarea
    {...rest}
    style={{
      ...fieldStyle,
      height:"auto",minHeight:80,padding:"10px 12px",
      borderColor: error ? "var(--celsa-red-500)" : "var(--border-strong)",
      resize:"vertical",
      ...style,
    }}
    onFocus={(e:any) => {
      e.target.style.borderColor = "var(--celsa-red-500)";
      e.target.style.boxShadow = "var(--sh-focus)";
    }}
    onBlur={(e:any) => {
      e.target.style.borderColor = error ? "var(--celsa-red-500)" : "var(--border-strong)";
      e.target.style.boxShadow = "none";
    }}
  />
);

/* ---------- Modal ---------- */
export const Modal = ({ open, onClose, title, children, footer, width = 540, accent = "red" }: any) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e:KeyboardEvent) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  const accents: any = {
    red: "var(--celsa-red-500)",
    blue: "var(--celsa-azul)",
    green: "var(--celsa-verde)",
    amber: "#f59e0b",
    plomo: "var(--celsa-plomo-acerado)",
  };
  return createPortal(
    <div
      onClick={(e:any) => { if (e.target === e.currentTarget) onClose && onClose(); }}
      style={{
        position:"fixed",
        top:0,left:0,right:0,bottom:0,
        zIndex:9000,
        background:"rgba(14,14,20,0.55)",
        backdropFilter:"blur(6px)",
        WebkitBackdropFilter:"blur(6px)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        padding:"24px",
        animation:"fade-in .2s var(--ease-out)",
      }}>
      <div style={{
        background:"var(--bg-surface)",
        borderRadius:"var(--r-2xl)",
        width:"100%",
        maxWidth: typeof width === "number" ? `${width}px` : width,
        maxHeight:"calc(100vh - 48px)",
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
        boxShadow:"var(--sh-xl)",
        animation:"modal-pop .3s var(--ease-out)",
        borderTop:`3px solid ${accents[accent]}`,
        margin:"auto",
      }}>
        {title && (
          <div style={{
            padding:"18px 22px",
            borderBottom:"1px solid var(--border)",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            gap:12,
            flexShrink:0,
            background:"var(--bg-surface)",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
              <span className="orla" style={{width:18,height:18,transform:"scale(1)"}}></span>
              <h2 style={{
                margin:0,
                fontSize:16,fontWeight:700,letterSpacing:0.2,
                fontFamily:"var(--font-sans)",
                color:"var(--fg)",
                textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap",
              }}>{title}</h2>
            </div>
            <IconButton icon="x" label="Cerrar" onClick={onClose}/>
          </div>
        )}
        <div style={{
          padding:"20px 22px",
          overflowY:"auto",
          overflowX:"hidden",
          flex:"1 1 auto",
          minHeight:0,
          scrollbarGutter:"stable",
        }}>{children}</div>
        {footer && (
          <div style={{
            padding:"14px 22px",
            borderTop:"1px solid var(--border)",
            background:"var(--bg-sunken)",
            display:"flex",justifyContent:"flex-end",gap:8,
            flexShrink:0,
            flexWrap:"wrap",
          }}>{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
};

export const Skeleton = ({ w = "100%", h = 14, style }: any) => (
  <span className="skeleton" style={{ display:"inline-block", width: w, height: h, borderRadius: 6, ...style }} />
);

/* ---------- Toast system ---------- */
interface Toast { id:string; kind?:string; title?:string; message?:string; duration?:number; }
const ToastContext = createContext<{ push: (t:Partial<Toast>) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((toast:Partial<Toast>) => {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = { id, kind: "info", duration: 4000, ...toast };
    setToasts(curr => [...curr, t]);
    if ((t.duration ?? 0) > 0) {
      setTimeout(() => setToasts(curr => curr.filter(x => x.id !== id)), t.duration);
    }
  }, []);
  const dismiss = (id:string) => setToasts(curr => curr.filter(x => x.id !== id));

  const kinds: any = {
    success: { icon:"checkCircle", color:"var(--celsa-verde)", bg:"#e9f8ee" },
    error:   { icon:"xCircle",     color:"var(--celsa-red-500)", bg:"#fde9e8" },
    warn:    { icon:"alert",       color:"#f59e0b", bg:"#fdf3dc" },
    info:    { icon:"info",        color:"var(--celsa-azul)", bg:"#e9eff9" },
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div style={{
        position:"fixed", top:20, right:20, zIndex:11000,
        display:"flex", flexDirection:"column", gap:10, pointerEvents:"none",
        maxWidth:380,
      }}>
        {toasts.map(t => {
          const k = kinds[t.kind || "info"] || kinds.info;
          return (
            <div key={t.id} style={{
              pointerEvents:"auto",
              background:"var(--bg-surface)",
              border:`1px solid var(--border)`,
              borderLeft:`3px solid ${k.color}`,
              borderRadius:"var(--r-lg)",
              boxShadow:"var(--sh-lg)",
              padding:"12px 14px 12px 12px",
              display:"flex", gap:10, alignItems:"flex-start",
              minWidth:280,
              animation:"toast-in .3s var(--ease-out)",
            }}>
              <span style={{
                width:24,height:24,borderRadius:"50%",
                background:k.bg, color:k.color,
                display:"flex",alignItems:"center",justifyContent:"center",
                flex:"0 0 auto",
              }}>
                <Icon name={k.icon} size={14} stroke={2.4}/>
              </span>
              <div style={{flex:1, minWidth:0}}>
                {t.title && <div style={{fontWeight:600,fontSize:13,color:"var(--fg)",marginBottom:t.message?2:0}}>{t.title}</div>}
                {t.message && <div style={{fontSize:12,color:"var(--fg-muted)",lineHeight:1.4}}>{t.message}</div>}
              </div>
              <button onClick={()=>dismiss(t.id)} style={{
                background:"transparent",border:"none",cursor:"pointer",
                color:"var(--fg-subtle)",padding:2,
              }} aria-label="Cerrar"><Icon name="x" size={14}/></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/* ---------- Helpers ---------- */
export const fmtMoney = (n:any, moneda:string) => {
  const sym: any = { Soles:"S/.", Dolares:"US$", Euros:"€" };
  return `${sym[moneda] || ""} ${Number(n||0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
};

export const fmtDate = (s:string) => {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"});
};

export const relTime = (s:string) => {
  if (!s) return "";
  const d = new Date(s);
  const diff = (Date.now() - d.getTime()) / 86400000;
  if (diff < 1)  return "hoy";
  if (diff < 2)  return "ayer";
  if (diff < 30) return `hace ${Math.floor(diff)}d`;
  return fmtDate(s);
};

/* ---------- PageHeader + Card ---------- */
export const PageHeader = ({ eyebrow, title, subtitle, actions, stats }: any) => (
  <div style={{
    display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:24,
    marginBottom:24,
  }} className="fade-in">
    <div style={{minWidth:0,flex:1}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span className="orla" style={{width:20,height:20}}></span>
        {eyebrow && (
          <span style={{
            fontSize:10.5,fontWeight:700,letterSpacing:3,
            color:"var(--celsa-red-600)",textTransform:"uppercase",
          }}>{eyebrow}</span>
        )}
      </div>
      <h1 style={{
        margin:0,fontSize:28,fontWeight:800,letterSpacing:-0.5,
        color:"var(--fg)",lineHeight:1.15,
      }}>{title}</h1>
      {subtitle && (
        <p style={{margin:"8px 0 0",color:"var(--fg-muted)",fontSize:14,maxWidth:680,lineHeight:1.55}}>{subtitle}</p>
      )}
      {stats && (
        <div style={{display:"flex",gap:28,marginTop:18,flexWrap:"wrap"}}>
          {stats.map((s:any)=>(
            <div key={s.label}>
              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.3,color:"var(--fg)"}}>{s.value}</div>
              <div style={{fontSize:11,fontWeight:600,color:"var(--fg-muted)",letterSpacing:1.2,textTransform:"uppercase",marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
    {actions && <div style={{display:"flex",gap:8,flexShrink:0}}>{actions}</div>}
  </div>
);

export const Card = ({ children, padded = true, style }: any) => (
  <div style={{
    background:"var(--bg-surface)",
    border:"1px solid var(--border)",
    borderRadius:"var(--r-xl)",
    boxShadow:"var(--sh-sm)",
    padding: padded ? 20 : 0,
    ...style,
  }}>{children}</div>
);

/* ---------- Empty state ---------- */
export const EmptyState = ({ icon, title, subtitle, action }: any) => (
  <div style={{
    padding:"40px 20px",textAlign:"center",
    border:"1px dashed var(--border-strong)",borderRadius:"var(--r-lg)",
    background:"var(--bg-sunken)",
  }}>
    <div style={{
      width:46,height:46,borderRadius:"50%",margin:"0 auto 12px",
      background:"var(--bg-surface)",color:"var(--fg-muted)",
      display:"flex",alignItems:"center",justifyContent:"center",
      border:"1px solid var(--border)",
    }}><Icon name={icon} size={20}/></div>
    <div style={{fontSize:14,fontWeight:700,color:"var(--fg)"}}>{title}</div>
    <div style={{fontSize:12.5,color:"var(--fg-muted)",marginTop:4}}>{subtitle}</div>
    {action && <div style={{marginTop:14}}>{action}</div>}
  </div>
);

/* ---------- SummaryRow + Tile (used in detail modals & summaries) ---------- */
export const SummaryRow = ({ label, value, highlight }: any) => (
  <div style={{
    display:"flex",alignItems:"center",justifyContent:"space-between",
    padding:"6px 0",borderBottom:"1px dashed var(--border)",
    fontSize:12.5,
  }}>
    <span style={{color:"var(--fg-muted)",letterSpacing:0.3,textTransform:"uppercase",fontWeight:600,fontSize:10.5}}>{label}</span>
    <span style={{
      color:"var(--fg)",fontWeight: highlight?700:500,
      fontSize: highlight?14:12.5,
    }}>{value}</span>
  </div>
);
