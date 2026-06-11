/* ============================================================
   COMPRAS CELSA — Mis solicitudes (Empleado/TMLIMA)
   Página completa con histórico paginado del usuario logueado.
   ============================================================ */
import { useEffect, useMemo, useState, Fragment } from "react";
import {
  Icon, Button, Input, Badge, Card, PageHeader, EmptyState,
  PriorityBadge, TypeBadge, StatusBadge,
  useToast, fmtMoney, fmtDate, relTime,
} from "../components/ui";
import { FilterSelect, DetailModal } from "../components/shared";
import { PRIORIDADES, TIPOS, ESTADOS } from "../data/celsa";
import { apiGetSolicitudesUsuario, apiDownloadImagen } from "../services/api";
import { ActividadReciente } from "../components/ActividadReciente";

interface Props { user: any; }

const MisSolicitudesPage = ({ user }: Props) => {
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({ prioridad:"", tipo:"", estado:"", q:"" });
  const [detail, setDetail] = useState<any>(null);
  const pageSize = 12;

  const handleDownload = async (id:number) => {
    try { await apiDownloadImagen(id); }
    catch { push({ kind:"error", title:"Sin adjunto", message:`RQ${id} no tiene archivo descargable.` }); }
  };

  useEffect(() => { setPageNum(0); }, [filters.prioridad, filters.tipo, filters.estado, filters.q]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      apiGetSolicitudesUsuario(user.userId, pageNum, pageSize, {
        prioridad: filters.prioridad,
        tipo: filters.tipo,
        estado: filters.estado,
        descripcionQuery: filters.q,
      })
        .then(({ rows, totalPages }) => { setRows(rows); setTotalPages(totalPages); })
        .catch(() => push({ kind:"error", title:"No se pudo cargar", message:"Verifica la conexión con el backend." }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, user.userId, filters.prioridad, filters.tipo, filters.estado, filters.q]);

  const filtered = rows;

  const counts = useMemo(() => ({
    total: rows.length,
    pendientes: rows.filter((r:any) => r.estado === "Pendiente").length,
    aprobadas:  rows.filter((r:any) => r.estado === "Aprobado").length,
    rechazadas: rows.filter((r:any) => r.estado === "Rechazado").length,
  }), [rows]);

  return (
    <Fragment>
      <PageHeader
        eyebrow="Tu historial"
        title="Mis solicitudes"
        subtitle="Todas las solicitudes que has enviado, con su estado actual, orden de compra asignada y fecha de aprobación."
        stats={[
          { label:"Total en la página", value: counts.total },
          { label:"Pendientes",         value: counts.pendientes },
          { label:"Aprobadas",          value: counts.aprobadas },
          { label:"Rechazadas",         value: counts.rechazadas },
        ]}
      />

      <div style={{marginBottom:16}}>
        <ActividadReciente limit={8}/>
      </div>

      <Card padded={false} style={{marginBottom:16}}>
        <div style={{
          padding:"12px 16px",
          display:"grid",
          gridTemplateColumns:"160px 140px 140px 1fr auto",
          gap:10,alignItems:"center",
        }}>
          <FilterSelect value={filters.prioridad} onChange={(v:string)=>setFilters((f:any)=>({...f,prioridad:v}))} label="Prioridad" options={PRIORIDADES}/>
          <FilterSelect value={filters.tipo}      onChange={(v:string)=>setFilters((f:any)=>({...f,tipo:v}))}      label="Tipo"      options={TIPOS}/>
          <FilterSelect value={filters.estado}    onChange={(v:string)=>setFilters((f:any)=>({...f,estado:v}))}    label="Estado"    options={ESTADOS}/>
          <Input leftIcon="search" placeholder="Buscar por descripción o ID…" value={filters.q} onChange={(e:any)=>setFilters((f:any)=>({...f,q:e.target.value}))}/>
          <Button size="md" variant="ghost" icon="refresh" onClick={()=>setFilters({prioridad:"",tipo:"",estado:"",q:""})}>Limpiar</Button>
        </div>
      </Card>

      {loading ? (
        <div style={{padding:"40px",textAlign:"center",color:"var(--fg-muted)",fontSize:13}}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="history"
          title={rows.length === 0 ? "Aún no tienes solicitudes" : "Sin coincidencias"}
          subtitle={rows.length === 0 ? "Cuando envíes solicitudes desde 'Nueva solicitud' aparecerán aquí." : "Ajusta los filtros para ver más resultados."}
        />
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((s:any) => (
            <Card key={s.id} style={{cursor:"pointer",transition:"all .15s var(--ease-out)"}}
              onClick={()=>setDetail(s)}
              onMouseEnter={(e:any)=>{ e.currentTarget.style.borderColor="var(--celsa-red-500)"; e.currentTarget.style.boxShadow="var(--sh-md)"; }}
              onMouseLeave={(e:any)=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.boxShadow="var(--sh-sm)"; }}>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:14,alignItems:"flex-start"}}>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--fg-muted)",fontWeight:700}}>RQ{s.id}</span>
                    <PriorityBadge value={s.prioridad}/>
                    <TypeBadge value={s.tipo}/>
                    <StatusBadge value={s.estado}/>
                    {s.fecha && (
                      <span style={{fontSize:11,color:"var(--fg-subtle)",display:"inline-flex",alignItems:"center",gap:4}}>
                        <Icon name="calendar" size={11}/> Creada {relTime(s.fecha)}
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:14.5,fontWeight:700,color:"var(--fg)",marginBottom:4}}>{s.descripcion}</div>
                  <div style={{fontSize:12,color:"var(--fg-muted)",display:"flex",gap:14,flexWrap:"wrap"}}>
                    <span><Icon name="layers" size={11}/> {s.familia} · {s.subFamilia}</span>
                    {s.maquina && s.maquina !== "—" && <span><Icon name="hammer" size={11}/> {s.maquina}</span>}
                    <span><Icon name="info" size={11}/> {s.motivo}</span>
                  </div>
                  {s.estado === "Rechazado" && s.comentarios && (
                    <div style={{
                      marginTop:10,padding:"8px 10px",
                      background:"var(--status-rechazado-bg)",border:"1px solid var(--status-rechazado-bd)",
                      borderRadius:"var(--r-md)",
                      fontSize:12,color:"var(--status-rechazado-fg)",
                    }}>
                      <strong>Motivo del rechazo:</strong> {s.comentarios}
                    </div>
                  )}
                  {s.ordenCompra && (
                    <div style={{
                      marginTop:10,display:"inline-flex",alignItems:"center",gap:6,
                      padding:"4px 10px",borderRadius:999,
                      background:"#e3f4e8",color:"#166534",
                      fontSize:11.5,fontWeight:600,fontFamily:"var(--font-mono)",
                      border:"1px solid #9bdbab",
                    }}>
                      <Icon name="cart" size={12}/> {s.ordenCompra}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.3,color:"var(--fg)"}}>
                    {fmtMoney(s.precio, s.moneda)}
                  </div>
                  <div style={{fontSize:11,color:"var(--fg-muted)"}}>{s.cantidad} {s.umedida}</div>
                  {s.fechaAprobacion && (
                    <Badge color="green" icon="checkCircle">Aprobada {fmtDate(s.fechaAprobacion)}</Badge>
                  )}
                  <Button size="sm" variant="ghost" icon="download" onClick={(e:any)=>{ e.stopPropagation(); handleDownload(s.id); }}>
                    Adjunto
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:16}}>
          <Button size="sm" variant="secondary" icon="chevronL" onClick={()=>setPageNum(p=>Math.max(0,p-1))} disabled={pageNum===0}>Anterior</Button>
          <span style={{fontSize:12,color:"var(--fg-muted)"}}>Página {pageNum+1} de {totalPages}</span>
          <Button size="sm" variant="secondary" iconRight="chevronR" onClick={()=>setPageNum(p=>Math.min(totalPages-1,p+1))} disabled={pageNum>=totalPages-1}>Siguiente</Button>
        </div>
      )}

      <DetailModal open={!!detail} row={detail} onClose={()=>setDetail(null)} onDownloadImg={handleDownload}/>
    </Fragment>
  );
};

export default MisSolicitudesPage;
