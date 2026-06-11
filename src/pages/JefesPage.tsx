/* ============================================================
   COMPRAS CELSA — Jefes (Aprobación de solicitudes)
   ============================================================ */
import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Icon, Button, Input, Badge, PriorityBadge, TypeBadge, StatusBadge,
  Card, PageHeader, EmptyState, useToast, fmtMoney, relTime,
  IconButton, SummaryRow,
} from "../components/ui";
import {
  ViewSwitcher, FilterSelect, InlineStateSelect,
  DetailModal, ChangeStateModal, BulkActionModal, KanbanView, sortRows,
} from "../components/shared";
import { PRIORIDADES, TIPOS, ESTADOS } from "../data/celsa";
import { apiGetSolicitudesJefe, apiPatchSolicitud, apiDownloadImagen } from "../services/api";
import { ActividadReciente } from "../components/ActividadReciente";

const InboxView = ({ rows, aprobados, rechazados, onOpen, onAct, onDownloadImg, selected, setSelected }: any) => {
  const sorted = useMemo(() => {
    const order: any = { Emergencia:0, Urgencia:1, Estándar:2 };
    return [...rows].sort((a:any,b:any) => order[a.prioridad] - order[b.prioridad] || +new Date(a.fecha) - +new Date(b.fecha));
  }, [rows]);

  const toggle = (id:number) => setSelected((s:Set<number>) => {
    const ns = new Set(s); ns.has(id) ? ns.delete(id) : ns.add(id);
    return ns;
  });

  if (sorted.length === 0) {
    return <EmptyState icon="checkCircle" title="No hay pendientes" subtitle="Todo tu equipo está al día. Buen trabajo."/>;
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",gap:20,alignItems:"flex-start"}}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sorted.map((r:any) => {
          const isSel = selected.has(r.id);
          const ageDays = Math.floor((Date.now() - new Date(r.fecha).getTime()) / 86400000);
          const aging = ageDays > 5;
          return (
            <div key={r.id} style={{
              background:"var(--bg-surface)",
              border: `1px solid ${isSel ? "var(--celsa-red-500)" : "var(--border)"}`,
              borderLeft: `4px solid ${r.prioridad==="Emergencia"?"var(--celsa-red-500)":r.prioridad==="Urgencia"?"#f59e0b":"var(--celsa-verde)"}`,
              borderRadius:"var(--r-lg)",
              padding:16,
              display:"grid",
              gridTemplateColumns:"auto 1fr auto",
              gap:14,
              alignItems:"flex-start",
              boxShadow: isSel ? "var(--sh-md)" : "var(--sh-sm)",
              cursor:"pointer",
              transition:"all .15s var(--ease-out)",
            }}
            onClick={()=>onOpen(r)}
            onMouseEnter={e=>{ (e.currentTarget as HTMLDivElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLDivElement).style.boxShadow="var(--sh-md)"; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLDivElement).style.transform="none"; if(!isSel) (e.currentTarget as HTMLDivElement).style.boxShadow="var(--sh-sm)"; }}
            >
              <label onClick={e=>e.stopPropagation()} style={{cursor:"pointer",paddingTop:2}}>
                <input type="checkbox" checked={isSel} onChange={()=>toggle(r.id)} style={{accentColor:"var(--celsa-red-500)",width:16,height:16}}/>
              </label>

              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:11.5,fontWeight:600,color:"var(--fg-muted)"}}>RQ{r.id}</span>
                  <PriorityBadge value={r.prioridad}/>
                  <TypeBadge value={r.tipo}/>
                  {aging && <Badge color="amber" icon="clock">{ageDays}d esperando</Badge>}
                </div>
                <div style={{fontSize:14.5,fontWeight:700,color:"var(--fg)",marginBottom:4}}>{r.descripcion}</div>
                <div style={{fontSize:12,color:"var(--fg-muted)",display:"flex",gap:14,flexWrap:"wrap"}}>
                  <span><Icon name="userCircle" size={11}/> {r.usuario}</span>
                  <span><Icon name="layers" size={11}/> {r.familia} · {r.subFamilia}</span>
                  <span><Icon name="calendar" size={11}/> {relTime(r.fecha)}</span>
                  {r.maquina !== "—" && <span><Icon name="hammer" size={11}/> {r.maquina}</span>}
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
                <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.3,color:"var(--fg)"}}>
                  {fmtMoney(r.precio, r.moneda)}
                </div>
                <div style={{fontSize:11,color:"var(--fg-muted)"}}>{r.cantidad} {r.umedida}</div>
                <div style={{display:"flex",gap:6,marginTop:4}} onClick={e=>e.stopPropagation()}>
                  <Button size="sm" variant="success" icon="check" onClick={()=>onAct(r,"Aprobado")}>Aprobar</Button>
                  <Button size="sm" variant="secondary" icon="x" onClick={()=>onAct(r,"Rechazado")}>Rechazar</Button>
                  <IconButton icon="download" label="Adjunto" onClick={()=>onDownloadImg(r.id)}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{position:"sticky",top:"calc(var(--header-h) + 28px)",display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"var(--celsa-red-600)",textTransform:"uppercase",marginBottom:10}}>Resumen del día</div>
          <SummaryRow label="Pendientes" value={<strong>{rows.length}</strong>}/>
          <SummaryRow label="Aprobados (acumulado)" value={aprobados}/>
          <SummaryRow label="Rechazados (acumulado)" value={rechazados}/>
        </Card>
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <Icon name="info" size={16} style={{color:"var(--celsa-azul)"}}/>
            <div style={{fontSize:12.5,fontWeight:700}}>Tip de productividad</div>
          </div>
          <div style={{fontSize:12,color:"var(--fg-muted)",lineHeight:1.6}}>
            Marca varias casillas para aprobar o rechazar en lote. Al rechazar siempre se pide comentario para que el solicitante sepa cómo corregir.
          </div>
        </Card>
        <ActividadReciente limit={8}/>
      </div>
    </div>
  );
};

const TableView = ({ rows, sort, setSort, selected, setSelected, onOpen, onChangeEstado, onDownloadImg, pageNum, setPageNum, pageSize, totalPages }: any) => {
  const page = rows;
  const allSelected = page.length > 0 && page.every((r:any) => selected.has(r.id));

  const headers = [
    { key:"id",         label:"ID",        w:80 },
    { key:"prioridad",  label:"Prioridad", w:120 },
    { key:"tipo",       label:"Tipo",      w:110 },
    { key:"descripcion",label:"Descripción", w: "minmax(220px, 1fr)" },
    { key:"cantidad",   label:"Cant.",     w:78 },
    { key:"precio",     label:"Importe",   w:130 },
    { key:"usuario",    label:"Solicitante", w:160 },
    { key:"fecha",      label:"Fecha",     w:100 },
    { key:"estado",     label:"Estado",    w:150 },
    { key:"ordenCompra",label:"OC",        w:140 },
    { key:"_actions",   label:"",          w:90 },
  ];
  const cols = `40px ${headers.map(h => typeof h.w === "number" ? `${h.w}px` : h.w).join(" ")}`;

  const toggleAll = () => {
    const ns = new Set(selected);
    if (allSelected) page.forEach((r:any) => ns.delete(r.id));
    else page.forEach((r:any) => ns.add(r.id));
    setSelected(ns);
  };

  return (
    <Card padded={false}>
      <div style={{overflow:"auto"}}>
        <div style={{minWidth:1200}}>
          <div style={{
            display:"grid",gridTemplateColumns: cols,
            padding:"0 14px",
            background:"var(--bg-sunken)",
            borderBottom:"1px solid var(--border)",
            position:"sticky",top:0,zIndex:5,
          }}>
            <div style={{display:"flex",alignItems:"center",padding:"10px 0"}}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{accentColor:"var(--celsa-red-500)",width:15,height:15}}/>
            </div>
            {headers.map(h => {
              const sortable = h.key !== "_actions" && h.key !== "descripcion";
              return (
                <button key={h.key} onClick={()=>sortable && setSort({key:h.key, dir: sort.key===h.key && sort.dir==="asc"?"desc":"asc"})}
                  disabled={!sortable}
                  style={{
                    background:"transparent",border:"none",cursor: sortable?"pointer":"default",
                    padding:"10px 6px",textAlign:"left",
                    fontSize:10.5,fontWeight:700,letterSpacing:1.2,
                    color:"var(--fg-muted)",textTransform:"uppercase",
                    display:"flex",alignItems:"center",gap:4,
                  }}>
                  {h.label}
                  {sortable && (
                    <Icon name={sort.key===h.key ? (sort.dir==="asc"?"chevronU":"chevronD") : "arrowUD"} size={10}
                      style={{opacity: sort.key===h.key?1:0.4}}/>
                  )}
                </button>
              );
            })}
          </div>

          {page.length === 0 ? (
            <div style={{padding:30}}><EmptyState icon="search" title="Sin resultados" subtitle="Ajusta los filtros para ver más solicitudes."/></div>
          ) : page.map((r:any, i:number) => {
            const isSel = selected.has(r.id);
            return (
              <div key={r.id} onClick={()=>onOpen(r)} style={{
                display:"grid",gridTemplateColumns: cols,
                padding:"0 14px",
                background: isSel ? "var(--celsa-red-50)" : i%2 ? "var(--bg-sunken)" : "var(--bg-surface)",
                borderBottom:"1px solid var(--border)",
                cursor:"pointer",
                transition:"background .12s",
              }}>
                <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center"}}>
                  <input type="checkbox" checked={isSel} onChange={()=>{
                    const ns = new Set(selected); ns.has(r.id)?ns.delete(r.id):ns.add(r.id); setSelected(ns);
                  }} style={{accentColor:"var(--celsa-red-500)",width:15,height:15}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px"}}>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:12,fontWeight:600,color:"var(--celsa-red-600)"}}>RQ{r.id}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px"}}><PriorityBadge value={r.prioridad}/></div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px"}}><TypeBadge value={r.tipo}/></div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:13,color:"var(--fg)",fontWeight:500,textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}} title={r.descripcion}>{r.descripcion}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px"}}>
                  <span style={{padding:"2px 8px",background:"#e3f4e8",color:"#1a6c34",borderRadius:6,fontSize:11.5,fontWeight:600,fontFamily:"var(--font-mono)"}}>{r.cantidad}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:13,fontWeight:600,color:"var(--fg)"}}>{fmtMoney(r.precio,r.moneda)}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:12.5,color:"var(--fg-muted)",textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>{r.usuario}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:12,color:"var(--fg-muted)"}}>{relTime(r.fecha)}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px"}} onClick={e=>e.stopPropagation()}>
                  <InlineStateSelect value={r.estado} onChange={(nuevo:string)=> nuevo!==r.estado && onChangeEstado(r,nuevo)}/>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:12,color:"var(--fg-muted)"}}>
                  {r.ordenCompra ? <Badge color="green">{r.ordenCompra}</Badge> : <span style={{fontStyle:"italic",color:"var(--fg-subtle)"}}>Sin asignar</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",justifyContent:"flex-end",gap:4}} onClick={e=>e.stopPropagation()}>
                  <IconButton icon="download" label="Imagen" onClick={()=>onDownloadImg(r.id)}/>
                  <IconButton icon="chevronR" label="Detalles" onClick={()=>onOpen(r)}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"12px 16px",borderTop:"1px solid var(--border)",
      }}>
        <span style={{fontSize:12.5,color:"var(--fg-muted)"}}>
          Mostrando <strong style={{color:"var(--fg)"}}>{page.length}</strong> · página {pageNum+1} / {totalPages}
        </span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Button size="sm" variant="secondary" icon="chevronL" onClick={()=>setPageNum((p:number)=>Math.max(0,p-1))} disabled={pageNum===0}>Anterior</Button>
          <span style={{fontSize:12,color:"var(--fg-muted)"}}>Página {pageNum+1} / {totalPages}</span>
          <Button size="sm" variant="secondary" iconRight="chevronR" onClick={()=>setPageNum((p:number)=>Math.min(totalPages-1,p+1))} disabled={pageNum>=totalPages-1}>Siguiente</Button>
        </div>
      </div>
    </Card>
  );
};

interface Props { user: any; page?: string; }

const pageToView = (p?: string) => {
  if (p === "kanban") return "kanban";
  if (p === "area")   return "table";
  return "inbox";
};

const JefesPage = ({ user, page }: Props) => {
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(pageToView(page));

  // Sincroniza la vista cuando cambia el item del sidebar
  useEffect(() => { setView(pageToView(page)); }, [page]);
  const [filters, setFilters] = useState<any>({ prioridad:"", tipo:"", estado:"", usuario:"", id:"" });
  const [sort, setSort] = useState<any>({ key:"fecha", dir:"desc" });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pageNum, setPageNum] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailOpen, setDetailOpen] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [bulkAction, setBulkAction] = useState<any>(null);
  const pageSize = 50;

  useEffect(() => { setPageNum(0); }, [filters.prioridad, filters.tipo, filters.estado, filters.id, filters.usuario]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      apiGetSolicitudesJefe(pageNum, pageSize, {
        prioridad: filters.prioridad,
        tipo: filters.tipo,
        estado: filters.estado,
        idQuery: filters.id,
        usuarioQuery: filters.usuario,
      })
        .then(({ rows, totalPages }) => { setRows(rows); setTotalPages(totalPages); })
        .catch(() => push({ kind:"error", title:"Error al cargar", message:"No se pudo conectar al backend." }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, filters.prioridad, filters.tipo, filters.estado, filters.id, filters.usuario]);

  const filtered = useMemo(() => sortRows(rows, filters, sort), [rows, filters, sort]);

  const pendientes = filtered.filter((r:any) => r.estado === "Pendiente");
  const aprobados  = filtered.filter((r:any) => r.estado === "Aprobado");
  const rechazados = filtered.filter((r:any) => r.estado === "Rechazado");

  const stats = useMemo(() => [
    { label:"Pendientes",  value: pendientes.length },
    { label:"Emergencias", value: pendientes.filter((r:any)=>r.prioridad==="Emergencia").length },
    { label:"Aprobadas",   value: aprobados.length },
    { label:"Rechazadas",  value: rechazados.length },
  ], [pendientes, aprobados, rechazados]);

  const changeEstado = async (row:any, nuevo:string, comentario?:string) => {
    const fields: any = { estado: nuevo };
    if (comentario) fields.comentarios = comentario;
    try {
      await apiPatchSolicitud(row.id, fields);
      setRows(r => r.map((x:any) => x.id === row.id ? { ...x, estado: nuevo, comentarios: comentario ?? x.comentarios } : x));
      push({ kind: nuevo==="Aprobado"?"success":nuevo==="Rechazado"?"error":"info",
            title:`RQ${row.id} ${nuevo.toLowerCase()}`,
            message: nuevo==="Rechazado" && comentario ? `Comentario: ${comentario.slice(0,60)}…` : row.descripcion });
    } catch {
      push({ kind:"error", title:"No se pudo actualizar", message:`RQ${row.id} no se cambió. Inténtalo de nuevo.` });
    }
  };

  const doBulk = async (action:string, comentario?:string) => {
    const ids = [...selected];
    const nuevo = action === "aprobar" ? "Aprobado" : "Rechazado";
    const fields: any = { estado: nuevo };
    if (comentario) fields.comentarios = comentario;
    const results = await Promise.allSettled(ids.map(id => apiPatchSolicitud(id, fields)));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const okIds = ids.filter((_, i) => results[i].status === "fulfilled");
    setRows(r => r.map((x:any) => okIds.includes(x.id) ? { ...x, estado: nuevo, comentarios: comentario ?? x.comentarios } : x));
    if (ok === ids.length) {
      push({ kind: action==="aprobar"?"success":"error", title:`${ok} solicitud(es) ${nuevo.toLowerCase()}`, message:"Se notificó a los solicitantes."});
    } else {
      push({ kind:"warn", title:"Acción parcial", message:`${ok}/${ids.length} actualizadas.`});
    }
    setSelected(new Set());
    setBulkAction(null);
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const { saveAs } = await import("file-saver");
      const ws = XLSX.utils.json_to_sheet(filtered.map((r:any) => ({
        ID: `RQ${r.id}`, Prioridad: r.prioridad, Tipo: r.tipo, Descripción: r.descripcion,
        Motivo: r.motivo, Familia: r.familia, Subfamilia: r.subFamilia,
        Cantidad: r.cantidad, Unidad: r.umedida, Precio: r.precio, Moneda: r.moneda,
        Estado: r.estado, "Orden de Compra": r.ordenCompra || "—",
        Usuario: r.usuario, Fecha: r.fecha,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Aprobaciones");
      const buf = XLSX.write(wb, { bookType:"xlsx", type:"array" });
      saveAs(new Blob([buf], { type:"application/octet-stream" }), "solicitudes-aprobacion.xlsx");
      push({ kind:"success", title:"Exportado", message:`${filtered.length} solicitudes descargadas.` });
    } catch {
      push({ kind:"error", title:"Error al exportar", message:"No se pudo generar el archivo." });
    }
  };

  const downloadImagen = async (id:number) => {
    try { await apiDownloadImagen(id); }
    catch { push({ kind:"error", title:"Imagen no disponible", message:`RQ${id} no tiene evidencia.` }); }
  };

  return (
    <Fragment>
      <PageHeader
        eyebrow={`Área · ${user.area || "Producción"}`}
        title={page === "kanban" ? "Vista Kanban" : page === "area" ? "Mi área" : "Bandeja de aprobación"}
        subtitle={
          page === "kanban"
            ? "Arrastra la mirada por las 3 columnas para entender el flujo de tu equipo de un vistazo."
            : page === "area"
              ? "Todas las solicitudes de tu área en formato tabla, con sort y filtros para auditar rápido."
              : "Revisa solicitudes pendientes de tu equipo. Aprueba en bulk, exige comentario al rechazar y mantén trazabilidad."
        }
        actions={
          <Fragment>
            <ViewSwitcher view={view} onChange={setView}/>
            <Button variant="secondary" icon="download" onClick={exportExcel}>Excel</Button>
          </Fragment>
        }
        stats={stats}
      />

      <Card padded={false} style={{marginBottom:16}}>
        <div style={{
          padding:"12px 16px",
          display:"grid",
          gridTemplateColumns:"180px 140px 140px 1fr 130px auto",
          gap:10,alignItems:"center",
        }}>
          <FilterSelect value={filters.prioridad} onChange={(v:string)=>setFilters((f:any)=>({...f,prioridad:v}))} label="Prioridad" options={PRIORIDADES}/>
          <FilterSelect value={filters.tipo}      onChange={(v:string)=>setFilters((f:any)=>({...f,tipo:v}))}      label="Tipo"      options={TIPOS}/>
          <FilterSelect value={filters.estado}    onChange={(v:string)=>setFilters((f:any)=>({...f,estado:v}))}    label="Estado"    options={ESTADOS}/>
          <Input leftIcon="user" placeholder="Buscar usuario" value={filters.usuario} onChange={(e:any)=>setFilters((f:any)=>({...f,usuario:e.target.value}))}/>
          <Input leftIcon="search" placeholder="ID RQ…" value={filters.id} onChange={(e:any)=>setFilters((f:any)=>({...f,id:e.target.value}))}/>
          <Button size="md" variant="ghost" icon="refresh" onClick={()=>setFilters({prioridad:"",tipo:"",estado:"",usuario:"",id:""})}>Limpiar</Button>
        </div>
      </Card>

      {selected.size > 0 && (
        <div style={{
          padding:"10px 16px",borderRadius:"var(--r-lg)",
          background:"var(--celsa-plomo-acerado)",color:"#fff",
          display:"flex",alignItems:"center",gap:14,
          marginBottom:14,boxShadow:"var(--sh-md)",
          animation:"slide-up .25s var(--ease-out)",
        }}>
          <Icon name="checkCircle" size={16}/>
          <span style={{fontWeight:600,fontSize:13}}>{selected.size} seleccionada(s)</span>
          <div style={{flex:1}}/>
          <Button size="sm" variant="success" icon="check" onClick={()=>setBulkAction("aprobar")}>Aprobar todo</Button>
          <Button size="sm" variant="danger"  icon="x"     onClick={()=>setBulkAction("rechazar")}>Rechazar todo</Button>
          <Button size="sm" variant="ghost"   icon="x"     onClick={()=>setSelected(new Set())} style={{color:"#fff"}}>Cancelar</Button>
        </div>
      )}

      {view === "inbox"  && <InboxView rows={pendientes} aprobados={aprobados.length} rechazados={rechazados.length}
        onOpen={(r:any)=>setDetailOpen(r)} onAct={(r:any,e:string)=>setConfirmAction({row:r,nuevoEstado:e})}
        onDownloadImg={downloadImagen}
        selected={selected} setSelected={setSelected}/>}

      {view === "table"  && <TableView rows={filtered} sort={sort} setSort={setSort}
        selected={selected} setSelected={setSelected}
        onOpen={(r:any)=>setDetailOpen(r)} onChangeEstado={(r:any,e:string)=>setConfirmAction({row:r,nuevoEstado:e})}
        onDownloadImg={downloadImagen}
        pageNum={pageNum} setPageNum={setPageNum} pageSize={pageSize}
        totalPages={totalPages}/>}

      {view === "kanban" && <KanbanView rows={filtered}
        role={user?.rol || "JefeArea"}
        onOpen={(r:any)=>setDetailOpen(r)}
        onAct={(r:any,e:string)=>setConfirmAction({row:r,nuevoEstado:e})}
        onMove={(r:any,e:string)=>setConfirmAction({row:r,nuevoEstado:e})}
        onDownloadImg={downloadImagen}/>}

      <DetailModal open={!!detailOpen} row={detailOpen} onClose={()=>setDetailOpen(null)}
        onDownloadImg={downloadImagen}
        onAction={(nuevoEstado:string)=>{ setConfirmAction({row:detailOpen,nuevoEstado}); }}/>

      <ChangeStateModal open={!!confirmAction} payload={confirmAction}
        onClose={()=>setConfirmAction(null)}
        onConfirm={(comment:string)=>{ changeEstado(confirmAction.row, confirmAction.nuevoEstado, comment); setConfirmAction(null); setDetailOpen(null); }}/>

      <BulkActionModal open={!!bulkAction} action={bulkAction} count={selected.size}
        onClose={()=>setBulkAction(null)}
        onConfirm={(comment:string)=>doBulk(bulkAction, comment)}/>
    </Fragment>
  );
};

export default JefesPage;
