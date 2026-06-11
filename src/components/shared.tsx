/* ============================================================
   COMPRAS CELSA — Shared modal / view components used by
   Jefes and Compras (DetailModal, ChangeStateModal,
   InlineStateSelect, KanbanView, ViewSwitcher, FilterSelect)
   ============================================================ */
import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Icon, Button, Modal, Badge, StatusBadge, PriorityBadge, TypeBadge,
  Field, Textarea, Select, fmtDate, fmtMoney,
} from "./ui";
import { ESTADOS } from "../data/celsa";

/* ---------- ViewSwitcher ---------- */
export const ViewSwitcher = ({ view, onChange }: any) => (
  <div style={{
    display:"inline-flex",
    background:"var(--bg-surface)",
    border:"1px solid var(--border-strong)",
    borderRadius:"var(--r-md)",padding:3,
  }}>
    {[
      { id:"inbox",  icon:"list",   label:"Inbox" },
      { id:"table",  icon:"grid",   label:"Tabla" },
      { id:"kanban", icon:"kanban", label:"Kanban" },
    ].map((o:any) => (
      <button key={o.id} onClick={()=>onChange(o.id)} style={{
        display:"inline-flex",alignItems:"center",gap:6,
        padding:"6px 10px",border:"none",
        borderRadius:"var(--r-sm)",
        background: view===o.id ? "var(--celsa-red-500)" : "transparent",
        color: view===o.id ? "#fff" : "var(--fg-muted)",
        fontSize:12.5,fontWeight:600,cursor:"pointer",
        transition:"all .15s var(--ease-out)",
      }}>
        <Icon name={o.icon} size={13}/>{o.label}
      </button>
    ))}
  </div>
);

/* ---------- FilterSelect ---------- */
export const FilterSelect = ({ label, value, onChange, options }: any) => (
  <Select value={value} onChange={(e:any)=>onChange(e.target.value)}>
    <option value="">{label}: todos</option>
    {options.map((o:string) => <option key={o}>{o}</option>)}
  </Select>
);

/* ---------- InlineStateSelect ---------- */
export const InlineStateSelect = ({ value, onChange, compact=false }: any) => {
  const styles: any = {
    Pendiente: { bg:"var(--status-pendiente-bg)", fg:"var(--status-pendiente-fg)", bd:"var(--status-pendiente-bd)"},
    Aprobado:  { bg:"var(--status-aprobado-bg)",  fg:"var(--status-aprobado-fg)",  bd:"var(--status-aprobado-bd)"},
    Rechazado: { bg:"var(--status-rechazado-bg)", fg:"var(--status-rechazado-fg)", bd:"var(--status-rechazado-bd)"},
  };
  const s = styles[value] || styles.Pendiente;
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{
      appearance:"none",
      padding: compact ? "3px 22px 3px 8px" : "4px 24px 4px 10px",
      borderRadius: 999,
      background: `${s.bg} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(s.fg)}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>") no-repeat right 6px center / 11px`,
      border:`1px solid ${s.bd}`,
      color: s.fg, fontSize: 11, fontWeight:700, letterSpacing:0.3, textTransform:"uppercase",
      cursor:"pointer", outline:"none",
    }}>
      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
    </select>
  );
};

/* ---------- Detail building blocks ---------- */
export const DetailSection = ({ icon, title, accent, bg, children, action }: any) => (
  <div style={{
    background: bg,
    border:`1px solid ${accent}33`,
    borderLeft:`3px solid ${accent}`,
    borderRadius:"var(--r-lg)",
    padding:"14px 16px",marginBottom:12,
  }}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Icon name={icon} size={14} style={{color:accent}}/>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:accent,textTransform:"uppercase"}}>{title}</span>
      </div>
      {action}
    </div>
    {children}
  </div>
);

export const DetailRow = ({ label, value, wide }: any) => (
  <div style={{display:"flex",gap:14,marginBottom:6,alignItems:wide?"flex-start":"center"}}>
    <span style={{fontSize:11,fontWeight:600,color:"var(--fg-muted)",letterSpacing:0.6,textTransform:"uppercase",minWidth:110}}>{label}</span>
    <span style={{fontSize:13,color:"var(--fg)",fontWeight:500,flex:1}}>{value}</span>
  </div>
);

export const Tile = ({ label, value, sub, highlight }: any) => (
  <div style={{
    background:"var(--bg-surface)",
    border:"1px solid var(--border)",
    borderRadius:"var(--r-md)",padding:"10px 12px",
  }}>
    <div style={{fontSize:10,fontWeight:700,color:"var(--fg-muted)",letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
    <div style={{fontSize: highlight?18:15,fontWeight: highlight?800:700,color: highlight?"var(--celsa-verde)":"var(--fg)",marginTop:4,letterSpacing:-0.2}}>{value}</div>
    {sub && <div style={{fontSize:11,color:"var(--fg-muted)",marginTop:2}}>{sub}</div>}
  </div>
);

/* ---------- DetailModal (readonly view, used by Jefes / MisSolicitudes) ---------- */
export const DetailModal = ({ open, row, onClose, onAction, onDownloadImg }: any) => {
  if (!row) return null;
  return (
    <Modal open={open} onClose={onClose} title={`RQ${row.id} · ${row.descripcion}`} width={720}
      footer={(
        <Fragment>
          {onDownloadImg && (
            <Button variant="secondary" icon="download" onClick={()=>onDownloadImg(row.id)} style={{marginRight:"auto"}}>
              Descargar adjunto
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {onAction && row.estado === "Pendiente" && (
            <Fragment>
              <Button variant="danger" icon="x" onClick={()=>onAction("Rechazado")}>Rechazar</Button>
              <Button variant="success" icon="check" onClick={()=>onAction("Aprobado")}>Aprobar</Button>
            </Fragment>
          )}
        </Fragment>
      )}>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <StatusBadge value={row.estado}/>
        <PriorityBadge value={row.prioridad}/>
        <TypeBadge value={row.tipo}/>
        <Badge color="plomo" icon="calendar">{fmtDate(row.fecha)}</Badge>
        {row.fechaAprobacion && <Badge color="green" icon="checkCircle">Aprobada {fmtDate(row.fechaAprobacion)}</Badge>}
      </div>

      <DetailSection icon="fileText" title="Información principal" accent="var(--celsa-plomo-acerado)" bg="var(--bg-sunken)">
        <DetailRow label="Solicitante" value={row.usuario}/>
        <DetailRow label="Área"        value={row.area}/>
        <DetailRow label="Descripción" value={row.descripcion} wide/>
        {row.maquina !== "—" && <DetailRow label="Máquina" value={row.maquina}/>}
      </DetailSection>

      <DetailSection icon="layers" title="Categorización" accent="#a87a05" bg="var(--status-pendiente-bg)">
        <DetailRow label="Familia"    value={row.familia}/>
        <DetailRow label="Subfamilia" value={row.subFamilia}/>
        <DetailRow label="Motivo"     value={row.motivo} wide/>
      </DetailSection>

      <DetailSection icon="dollar" title="Información comercial" accent="var(--celsa-azul)" bg="#eef3fa">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
          <Tile label="Cantidad" value={`${row.cantidad}`} sub={row.umedida}/>
          <Tile label="Moneda" value={row.moneda}/>
          <Tile label="Importe ref." value={fmtMoney(row.precio,row.moneda)} highlight/>
        </div>
      </DetailSection>

      {row.ordenCompra && (
        <DetailSection icon="cart" title="Orden de compra" accent="var(--celsa-verde)" bg="#e3f4e8">
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{
              fontFamily:"var(--font-mono)",fontSize:18,fontWeight:700,
              color:"var(--celsa-verde)",letterSpacing:0.5,
            }}>{row.ordenCompra}</div>
            <Badge color="green" icon="checkCircle">Confirmada</Badge>
          </div>
        </DetailSection>
      )}

      {row.comentarios && (
        <DetailSection icon="info" title="Comentarios" accent="#6366f1" bg="#eef0ff">
          <p style={{margin:0,fontSize:13,color:"var(--fg)",lineHeight:1.55}}>{row.comentarios}</p>
        </DetailSection>
      )}

      <DetailSection icon="clock" title="Trazabilidad" accent="var(--celsa-azul)" bg="#eef3fa">
        <TrazabilidadTimeline row={row}/>
      </DetailSection>
    </Modal>
  );
};

/* ---------- ChangeStateModal ---------- */
export const ChangeStateModal = ({ open, payload, onClose, onConfirm }: any) => {
  const [comment, setComment] = useState("");
  useEffect(() => { if (open) setComment(""); }, [open]);
  if (!open || !payload) return null;
  const { row, nuevoEstado } = payload;
  const isReject = nuevoEstado === "Rechazado";
  const accents: any = { Aprobado:"green", Rechazado:"red", Pendiente:"amber" };
  return (
    <Modal open={open} onClose={onClose} accent={accents[nuevoEstado]} width={500}
      title={isReject ? "Rechazar solicitud" : nuevoEstado === "Aprobado" ? "Aprobar solicitud" : "Cambiar estado"}
      footer={(
        <Fragment>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant={isReject?"danger":nuevoEstado==="Aprobado"?"success":"primary"} icon={isReject?"x":"check"}
            disabled={isReject && comment.trim().length < 4}
            onClick={()=>onConfirm(comment.trim() || null)}>
            Confirmar
          </Button>
        </Fragment>
      )}>
      <div style={{padding:12,background:"var(--bg-sunken)",borderRadius:"var(--r-lg)",border:"1px solid var(--border)",marginBottom:isReject?14:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontFamily:"var(--font-mono)",fontSize:12,fontWeight:600,color:"var(--celsa-red-600)"}}>RQ{row.id}</span>
          <PriorityBadge value={row.prioridad}/>
        </div>
        <div style={{fontSize:14,fontWeight:600,color:"var(--fg)",marginBottom:8}}>{row.descripcion}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12}}>
          <StatusBadge value={row.estado}/>
          <Icon name="arrowR" size={12} style={{color:"var(--fg-muted)"}}/>
          <StatusBadge value={nuevoEstado}/>
        </div>
      </div>
      {isReject && (
        <Field label="Comentario para el solicitante" required icon="fileText"
          error={comment.length>0 && comment.trim().length<4 ? "Mínimo 4 caracteres" : null}>
          <Textarea placeholder="Indica por qué rechazas esta solicitud y cómo puede corregirla…"
            value={comment} onChange={(e:any)=>setComment(e.target.value)} style={{minHeight:90}}/>
        </Field>
      )}
    </Modal>
  );
};

/* ---------- BulkActionModal ---------- */
export const BulkActionModal = ({ open, action, count, onClose, onConfirm }: any) => {
  const [comment, setComment] = useState("");
  useEffect(()=>{ if (open) setComment(""); }, [open]);
  if (!open) return null;
  const isReject = action === "rechazar";
  return (
    <Modal open={open} onClose={onClose} width={500} accent={isReject?"red":"green"}
      title={isReject ? `Rechazar ${count} solicitudes` : `Aprobar ${count} solicitudes`}
      footer={(
        <Fragment>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant={isReject?"danger":"success"} icon={isReject?"x":"check"}
            disabled={isReject && comment.trim().length < 4}
            onClick={()=>onConfirm(comment.trim()||null)}>
            Confirmar {action}
          </Button>
        </Fragment>
      )}>
      <p style={{margin:"0 0 14px",fontSize:13.5,color:"var(--fg-muted)",lineHeight:1.5}}>
        Vas a {isReject?"rechazar":"aprobar"} <strong style={{color:"var(--fg)"}}>{count}</strong> solicitudes en lote. Los solicitantes recibirán notificación inmediata.
      </p>
      {isReject && (
        <Field label="Comentario común" required icon="fileText"
          error={comment.length>0 && comment.trim().length<4 ? "Mínimo 4 caracteres" : null}>
          <Textarea placeholder="Motivo del rechazo en lote…" value={comment} onChange={(e:any)=>setComment(e.target.value)} style={{minHeight:80}}/>
        </Field>
      )}
    </Modal>
  );
};

/* ---------- KanbanView ---------- */
export const KanbanView = ({ rows, onOpen, onAct, onMove, onDownloadImg, role }: any) => {
  const cols = [
    { id:"Pendiente", title:"Pendientes",  color:"#f59e0b" },
    { id:"Aprobado",  title:"Aprobadas",   color:"var(--celsa-verde)" },
    { id:"Rechazado", title:"Rechazadas",  color:"var(--celsa-red-500)" },
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
      {cols.map(c => {
        const items = rows.filter((r:any) => r.estado === c.id);
        return (
          <div key={c.id} style={{
            background:"var(--bg-sunken)",
            border:"1px solid var(--border)",
            borderRadius:"var(--r-xl)",
            padding:14,minHeight:400,
            display:"flex",flexDirection:"column",gap:10,
          }}>
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"4px 4px 12px",borderBottom:"1px dashed var(--border-strong)",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:c.color}}/>
                <span style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{c.title}</span>
                <span style={{
                  fontSize:11,padding:"1px 7px",borderRadius:999,
                  background:"var(--bg-surface)",color:"var(--fg-muted)",fontWeight:700,
                }}>{items.length}</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,overflow:"auto",maxHeight:700}}>
              {items.slice(0,12).map((r:any) => (
                <div key={r.id} onClick={()=>onOpen(r)} style={{
                  background:"var(--bg-surface)",
                  border:"1px solid var(--border)",
                  borderRadius:"var(--r-md)",
                  padding:12,cursor:"pointer",
                  borderLeft:`3px solid ${r.prioridad==="Emergencia"?"var(--celsa-red-500)":r.prioridad==="Urgencia"?"#f59e0b":"var(--celsa-verde)"}`,
                  transition:"transform .15s",
                }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="none"}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--fg-muted)",fontWeight:600}}>RQ{r.id}</span>
                    <PriorityBadge value={r.prioridad}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--fg)",marginBottom:6,lineHeight:1.35,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{r.descripcion}</div>
                  <div style={{fontSize:11,color:"var(--fg-muted)",display:"flex",justifyContent:"space-between"}}>
                    <span>{r.usuario.split(" ")[0]}</span>
                    <strong style={{color:"var(--fg)"}}>{fmtMoney(r.precio,r.moneda)}</strong>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                    {c.id === "Pendiente" && (role === "JefeArea" || role === "ADMIN") && (
                      <Fragment>
                        <Button size="sm" variant="success" icon="check" onClick={()=>{ if(onAct) onAct(r,"Aprobado"); else if(onMove) onMove(r,"Aprobado"); }} style={{flex:1,height:26,fontSize:11}}>Aprobar</Button>
                        <Button size="sm" variant="secondary" icon="x" onClick={()=>{ if(onAct) onAct(r,"Rechazado"); else if(onMove) onMove(r,"Rechazado"); }} style={{flex:1,height:26,fontSize:11}}>Rechazar</Button>
                      </Fragment>
                    )}
                    {onDownloadImg && <button onClick={()=>onDownloadImg(r.id)} title="Descargar adjunto" style={{
                      marginLeft:"auto",width:26,height:26,padding:0,borderRadius:6,
                      border:"1px solid var(--border-strong)",background:"var(--bg-surface)",
                      color:"var(--fg-muted)",cursor:"pointer",
                      display:"inline-flex",alignItems:"center",justifyContent:"center",
                    }}><Icon name="download" size={12}/></button>}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{padding:20,textAlign:"center",fontSize:12,color:"var(--fg-subtle)"}}>Vacío</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- TrazabilidadTimeline ---------- */
export const TrazabilidadTimeline = ({ row }: any) => {
  const steps = [
    { label:"Creada", ts: row.createdAt, icon:"fileText", color:"var(--celsa-plomo-acerado)" },
    {
      label: row.estado === "Rechazado" ? "Rechazada" : "Aprobada",
      ts: row.approvedAt,
      icon: row.estado === "Rechazado" ? "x" : "check",
      color: row.estado === "Rechazado" ? "var(--celsa-red-500)" : "var(--celsa-verde)",
    },
    { label:"OC asignada", ts: row.ocAssignedAt, icon:"cart", color:"var(--celsa-azul)" },
  ];

  const fmt = (s:string) => s ? new Date(s).toLocaleString("es-PE",{ dateStyle:"medium", timeStyle:"short" }) : "—";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,padding:"6px 2px"}}>
      {steps.map((st,i)=>{
        const done = !!st.ts;
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{
              width:26,height:26,borderRadius:"50%",
              background: done ? st.color : "var(--bg-sunken)",
              color: done ? "#fff" : "var(--fg-subtle)",
              display:"flex",alignItems:"center",justifyContent:"center",
              border: done ? "none" : "1px dashed var(--border-strong)",
              flexShrink:0,
            }}>
              <span style={{fontSize:12,fontWeight:700}}>{i+1}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color: done ? "var(--fg)" : "var(--fg-muted)"}}>{st.label}</div>
              <div style={{fontSize:11,color:"var(--fg-muted)",fontFamily:"var(--font-mono)"}}>{fmt(st.ts)}</div>
            </div>
          </div>
        );
      })}
      {(row.tiempoAprobacionHoras != null || row.tiempoOCHoras != null) && (
        <div style={{
          marginTop:6,paddingTop:10,borderTop:"1px dashed var(--border)",
          display:"flex",gap:18,fontSize:11.5,color:"var(--fg-muted)",
        }}>
          {row.tiempoAprobacionHoras != null && <span><strong>{row.tiempoAprobacionHoras}h</strong> en aprobar</span>}
          {row.tiempoOCHoras != null && <span><strong>{row.tiempoOCHoras}h</strong> en OC</span>}
        </div>
      )}
    </div>
  );
};

/* Re-export sort helper used by tables */
// Filtros ahora se aplican en el backend. Esta función SOLO ordena por columna.
export const sortRows = (rows:any[], _filtersIgnored:any, sort:any) => {
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a:any,b:any) => {
    const av = a[sort.key], bv = b[sort.key];
    if (typeof av === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
};

/* useMemo wrapper re-exported here for convenience */
export { useMemo };
