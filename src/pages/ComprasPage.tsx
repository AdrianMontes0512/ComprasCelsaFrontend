/* ============================================================
   COMPRAS CELSA — Compras (Gestión de solicitudes)
   Dashboard + tabla con inline-edit + modal de detalles editable
   ============================================================ */
import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Icon, Button, Modal, Field, Input, Select, Textarea, Badge,
  PriorityBadge, TypeBadge, StatusBadge,
  Card, PageHeader, EmptyState, IconButton,
  useToast, fmtMoney, fmtDate,
} from "../components/ui";
import {
  ViewSwitcher, FilterSelect,
  DetailSection, DetailRow, Tile, ChangeStateModal, KanbanView, sortRows,
  TrazabilidadTimeline,
} from "../components/shared";
import { PRIORIDADES, TIPOS, ESTADOS, FAMILIAS, UNIDADES, MONEDAS } from "../data/celsa";
import { apiGetSolicitudesCompras, apiPatchSolicitud, apiDownloadImagen } from "../services/api";
import { ActividadReciente } from "../components/ActividadReciente";

const Metric = ({ icon, color, label, value, delta, trend }: any) => (
  <Card>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
      <div>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:1.5,color:"var(--fg-muted)",textTransform:"uppercase"}}>{label}</div>
        <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,color:"var(--fg)",marginTop:6,lineHeight:1}}>{value}</div>
        <div style={{
          fontSize:11.5,marginTop:6,
          color: trend==="up"?"var(--celsa-verde)":trend==="warn"?"#a87a05":"var(--fg-muted)",
          display:"flex",alignItems:"center",gap:4,fontWeight:600,
        }}>
          <Icon name={trend==="warn"?"alert":"trend"} size={11}/>{delta}
        </div>
      </div>
      <div style={{
        width:40,height:40,borderRadius:"var(--r-md)",
        background:`${color}15`,color,
        display:"flex",alignItems:"center",justifyContent:"center",
      }}><Icon name={icon} size={18}/></div>
    </div>
  </Card>
);

const SpendByCurrency = ({ byMoneda }: any) => {
  const entries: any[] = Object.entries(byMoneda);
  const max = Math.max(...entries.map(([,v]:any) => v), 1);
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <div style={{fontSize:10.5,fontWeight:700,letterSpacing:2,color:"var(--celsa-red-600)",textTransform:"uppercase"}}>Aprobado</div>
          <h3 style={{margin:"4px 0 0",fontSize:16,fontWeight:700,letterSpacing:-0.2}}>Monto comprometido por moneda</h3>
        </div>
        <Badge color="green" icon="checkCircle">{entries.reduce((s:number,[,v]:any)=>s+v,0).toFixed(0)} ref.</Badge>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {entries.map(([m,v]:any) => (
          <div key={m}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
              <span style={{fontWeight:600,color:"var(--fg)"}}>{m}</span>
              <span style={{fontFamily:"var(--font-mono)",color:"var(--fg-muted)"}}>{fmtMoney(v, m)}</span>
            </div>
            <div style={{height:8,background:"var(--ink-100)",borderRadius:999,overflow:"hidden"}}>
              <div style={{
                height:"100%",width:`${(v/max)*100}%`,
                background: m==="Dolares" ? "var(--celsa-azul)" : m==="Soles" ? "var(--celsa-red-500)" : "var(--celsa-verde)",
                transition:"width .6s var(--ease-out)",
                borderRadius:999,
              }}/>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const TopFamilies = ({ rows }: any) => {
  const counts = useMemo(() => {
    const acc: any = {};
    rows.forEach((r:any) => { acc[r.familia] = (acc[r.familia] || 0) + 1; });
    return Object.entries(acc).sort((a:any,b:any) => b[1]-a[1]).slice(0,5);
  }, [rows]);
  const max: any = (counts[0] as any)?.[1] || 1;
  const colors = ["var(--celsa-red-500)","var(--celsa-azul)","var(--celsa-verde)","#f59e0b","var(--celsa-plomo-acerado)"];
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <div style={{fontSize:10.5,fontWeight:700,letterSpacing:2,color:"var(--celsa-red-600)",textTransform:"uppercase"}}>Top familias</div>
          <h3 style={{margin:"4px 0 0",fontSize:16,fontWeight:700,letterSpacing:-0.2}}>Volumen de solicitudes</h3>
        </div>
        <Badge color="neutral">{rows.length} totales</Badge>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {counts.map(([f,c]:any, i:number) => (
          <div key={f} style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{
              fontFamily:"var(--font-mono)",fontSize:11,color:"var(--fg-muted)",
              width:18,textAlign:"right",fontWeight:700,
            }}>0{i+1}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}>
                <span style={{fontWeight:600,color:"var(--fg)",textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>{f}</span>
                <span style={{color:"var(--fg-muted)",fontWeight:600}}>{c}</span>
              </div>
              <div style={{height:6,background:"var(--ink-100)",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(c/max)*100}%`,background:colors[i],borderRadius:999,transition:"width .6s var(--ease-out)"}}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const OCInlineInput = ({ row, onCommit }: any) => {
  const [val, setVal] = useState(row.ordenCompra || "");
  useEffect(()=>setVal(row.ordenCompra||""), [row.ordenCompra]);
  if (row.estado !== "Aprobado") {
    return <span style={{fontSize:12,fontStyle:"italic",color:"var(--fg-subtle)"}}>Falta aprobación</span>;
  }
  if (row.ordenCompra) {
    return <Badge color="green" icon="checkCircle">{row.ordenCompra}</Badge>;
  }
  return (
    <input
      placeholder="OC-2026-…"
      value={val}
      onChange={e=>setVal(e.target.value)}
      onKeyDown={e=>{ if (e.key === "Enter" && val.trim().length>=3) onCommit(val.trim()); }}
      onBlur={()=>{ if (val.trim().length>=3 && val !== (row.ordenCompra||"")) onCommit(val.trim()); }}
      style={{
        height:30,padding:"0 10px",fontSize:12,
        border:"1px dashed var(--celsa-red-300)",
        borderRadius:8,
        background:"var(--celsa-red-50)",
        color:"var(--celsa-red-700)",
        width:160,outline:"none",fontFamily:"var(--font-mono)",
        fontWeight:600,
      }}
      onFocus={e=>{ e.target.style.borderColor="var(--celsa-red-500)"; e.target.style.borderStyle="solid"; e.target.style.boxShadow="var(--sh-focus)"; }}
    />
  );
};

const ComprasTable = ({ rows, sort, setSort, selected, setSelected, onOpen, onChangeEstado, onAssignOC, pageNum, setPageNum, pageSize, totalPages }: any) => {
  const page = rows;
  const allSelected = page.length > 0 && page.every((r:any) => selected.has(r.id));

  const headers = [
    { key:"id", label:"ID", w:78 },
    { key:"prioridad", label:"Prio", w:120 },
    { key:"tipo", label:"Tipo", w:100 },
    { key:"descripcion", label:"Descripción", w:"minmax(220px, 1fr)" },
    { key:"familia", label:"Familia", w:160 },
    { key:"cantidad", label:"Cant.", w:78 },
    { key:"precio", label:"Importe", w:130 },
    { key:"usuario", label:"Solicitante", w:160 },
    { key:"fechaAprobacion", label:"Aprobada", w:120 },
    { key:"estado", label:"Estado", w:140 },
    { key:"ordenCompra", label:"Orden Compra", w:180 },
    { key:"_actions", label:"", w:80 },
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
        <div style={{minWidth:1400}}>
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
              const sortable = h.key !== "_actions" && h.key !== "descripcion" && h.key !== "ordenCompra";
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
            <div style={{padding:30}}><EmptyState icon="search" title="Sin resultados" subtitle="Ajusta los filtros para encontrar solicitudes."/></div>
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
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:13,fontWeight:500,textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}} title={r.descripcion}>{r.descripcion}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:12,color:"var(--fg-muted)",textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>{r.familia}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px"}}>
                  <span style={{padding:"2px 8px",background:"#e3f4e8",color:"#1a6c34",borderRadius:6,fontSize:11.5,fontWeight:600,fontFamily:"var(--font-mono)"}}>{r.cantidad}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:13,fontWeight:600,color:"var(--fg)"}}>{fmtMoney(r.precio,r.moneda)}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:12.5,color:"var(--fg-muted)",textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>{r.usuario}</div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",fontSize:12,color: r.fechaAprobacion ? "var(--celsa-verde)" : "var(--fg-subtle)",fontWeight: r.fechaAprobacion?600:400,fontStyle: r.fechaAprobacion?"normal":"italic"}}>
                  {r.fechaAprobacion ? fmtDate(r.fechaAprobacion) : "—"}
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px"}} onClick={e=>e.stopPropagation()}>
                  <StatusBadge value={r.estado}/>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"8px 6px"}} onClick={e=>e.stopPropagation()}>
                  <OCInlineInput row={r} onCommit={(oc:string)=>onAssignOC(r,oc)}/>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"12px 6px",justifyContent:"flex-end",gap:4}} onClick={e=>e.stopPropagation()}>
                  <IconButton icon="download" label="Descargar adjunto" onClick={async()=>{ try { await apiDownloadImagen(r.id); } catch { /* */ } }}/>
                  <IconButton icon="edit" label="Editar" onClick={()=>onOpen(r)}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
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

const EditableSection = ({ icon, title, accent, bg, editing, onEdit, onCancel, renderRead, renderEdit, initial, onSave }: any) => {
  const [state, setState] = useState(initial);
  useEffect(()=>{ if (editing) setState(initial); }, [editing]);
  return (
    <DetailSection icon={icon} title={title} accent={accent} bg={bg}
      action={!editing
        ? <Button size="sm" variant="ghost" icon="edit" onClick={onEdit} style={{height:26,fontSize:11,padding:"0 8px",color:accent}}>Editar</Button>
        : (
          <div style={{display:"flex",gap:6}}>
            <Button size="sm" variant="secondary" onClick={onCancel} style={{height:26,fontSize:11,padding:"0 10px"}}>Cancelar</Button>
            <Button size="sm" variant="primary" icon="check" onClick={()=>onSave(state)} style={{height:26,fontSize:11,padding:"0 10px"}}>Guardar</Button>
          </div>
        )
      }
    >
      {editing ? renderEdit(state, setState, ()=>onSave(state)) : renderRead()}
    </DetailSection>
  );
};

const ComprasDetailModal = ({ row, onClose, editing, setEditing, onPatch }: any) => {
  if (!row) return null;
  return (
    <Modal open={!!row} onClose={onClose} title={`RQ${row.id} · ${row.descripcion}`} width={760}
      footer={(
        <Fragment>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </Fragment>
      )}>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <StatusBadge value={row.estado}/>
        <PriorityBadge value={row.prioridad}/>
        <TypeBadge value={row.tipo}/>
        <Badge color="plomo" icon="calendar">{fmtDate(row.fecha)}</Badge>
      </div>

      <EditableSection
        icon="fileText" title="Información principal"
        accent="var(--celsa-plomo-acerado)" bg="var(--bg-sunken)"
        editing={editing==="principal"} onEdit={()=>setEditing("principal")} onCancel={()=>setEditing(null)}
        renderRead={()=>(
          <Fragment>
            <DetailRow label="Solicitante" value={row.usuario}/>
            <DetailRow label="Área" value={row.area}/>
            <DetailRow label="Descripción" value={row.descripcion} wide/>
            <DetailRow label="Prioridad" value={<PriorityBadge value={row.prioridad}/>}/>
            <DetailRow label="Tipo" value={<TypeBadge value={row.tipo}/>}/>
            {row.fechaAprobacion && (
              <DetailRow label="Aprobada el" value={
                <span style={{color:"var(--celsa-verde)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>
                  <Icon name="checkCircle" size={12}/> {fmtDate(row.fechaAprobacion)}
                </span>
              }/>
            )}
          </Fragment>
        )}
        renderEdit={(state:any,setState:any)=>(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Prioridad">
              <Select value={state.prioridad} onChange={(e:any)=>setState({...state, prioridad:e.target.value})}>
                {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={state.tipo} onChange={(e:any)=>setState({...state, tipo:e.target.value})}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Descripción" style={{gridColumn:"1 / -1"}}>
              <Textarea value={state.descripcion} onChange={(e:any)=>setState({...state, descripcion:e.target.value})} style={{minHeight:64}}/>
            </Field>
          </div>
        )}
        initial={{ descripcion: row.descripcion, prioridad: row.prioridad, tipo: row.tipo }}
        onSave={(s:any)=>onPatch({ descripcion:s.descripcion, prioridad:s.prioridad, tipo:s.tipo })}
      />

      <EditableSection
        icon="layers" title="Categorización"
        accent="#a87a05" bg="var(--status-pendiente-bg)"
        editing={editing==="cat"} onEdit={()=>setEditing("cat")} onCancel={()=>setEditing(null)}
        renderRead={() => (
          <Fragment>
            <DetailRow label="Familia" value={row.familia}/>
            <DetailRow label="Subfamilia" value={row.subFamilia}/>
            <DetailRow label="Motivo" value={row.motivo} wide/>
          </Fragment>
        )}
        renderEdit={(state:any,setState:any) => (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Familia">
              <Select value={state.familia} onChange={(e:any)=>setState({...state, familia:e.target.value, subFamilia:""})}>
                {Object.keys(FAMILIAS).map(k => <option key={k}>{k}</option>)}
              </Select>
            </Field>
            <Field label="Subfamilia">
              <Select value={state.subFamilia} onChange={(e:any)=>setState({...state,subFamilia:e.target.value})}>
                <option value="">—</option>
                {(FAMILIAS[state.familia]||[]).map((s:string)=> <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Motivo" style={{gridColumn:"1 / -1"}}>
              <Input value={state.motivo} onChange={(e:any)=>setState({...state,motivo:e.target.value})}/>
            </Field>
          </div>
        )}
        initial={{ familia: row.familia, subFamilia: row.subFamilia, motivo: row.motivo }}
        onSave={(s:any)=>onPatch({ familia:s.familia, subFamilia:s.subFamilia, motivo:s.motivo })}
      />

      <EditableSection
        icon="hammer" title="Máquina"
        accent="var(--celsa-verde)" bg="#e3f4e8"
        editing={editing==="maq"} onEdit={()=>setEditing("maq")} onCancel={()=>setEditing(null)}
        renderRead={()=>(<DetailRow label="Máquina" value={row.maquina || "—"} wide/>)}
        renderEdit={(state:any,setState:any)=>(
          <Field label="Máquina">
            <Input value={state.maquina} onChange={(e:any)=>setState({...state,maquina:e.target.value})}/>
          </Field>
        )}
        initial={{ maquina: row.maquina === "—" ? "" : row.maquina }}
        onSave={(s:any)=>onPatch({ maquina: s.maquina || "—" })}
      />

      <EditableSection
        icon="dollar" title="Información comercial"
        accent="var(--celsa-azul)" bg="#eef3fa"
        editing={editing==="com"} onEdit={()=>setEditing("com")} onCancel={()=>setEditing(null)}
        renderRead={()=>(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            <Tile label="Cantidad" value={row.cantidad} sub={row.umedida}/>
            <Tile label="Moneda" value={row.moneda}/>
            <Tile label="Importe ref." value={fmtMoney(row.precio,row.moneda)} highlight/>
          </div>
        )}
        renderEdit={(state:any,setState:any)=>(
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <Field label="Cantidad"><Input type="number" min="1" value={state.cantidad} onChange={(e:any)=>setState({...state,cantidad:Number(e.target.value)})}/></Field>
            <Field label="Unidad">
              <Select value={state.umedida} onChange={(e:any)=>setState({...state,umedida:e.target.value})}>
                {UNIDADES.map(u=> <option key={u}>{u}</option>)}
              </Select>
            </Field>
            <Field label="Importe"><Input type="number" step="0.01" value={state.precio} onChange={(e:any)=>setState({...state,precio:Number(e.target.value)})}/></Field>
            <Field label="Moneda">
              <Select value={state.moneda} onChange={(e:any)=>setState({...state,moneda:e.target.value})}>
                {MONEDAS.map(m=> <option key={m.v}>{m.v}</option>)}
              </Select>
            </Field>
          </div>
        )}
        initial={{ cantidad: row.cantidad, umedida: row.umedida, precio: row.precio, moneda: row.moneda }}
        onSave={(s:any)=>onPatch(s)}
      />

      {row.estado === "Aprobado" && (
        <EditableSection
          icon="cart" title="Orden de compra"
          accent="var(--celsa-verde)" bg="#dcfce7"
          editing={editing==="oc"} onEdit={()=>setEditing("oc")} onCancel={()=>setEditing(null)}
          renderRead={()=>(
            row.ordenCompra
              ? <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:20,fontWeight:800,color:"var(--celsa-verde)",letterSpacing:0.5}}>{row.ordenCompra}</div>
                  <Badge color="green" icon="checkCircle">Asignada</Badge>
                </div>
              : <div style={{fontSize:13,color:"var(--fg-muted)",fontStyle:"italic"}}>Aún no se ha asignado una OC.</div>
          )}
          renderEdit={(state:any,setState:any)=>(
            <Field label="ID de orden de compra" icon="cart">
              <Input placeholder="OC-2026-XXXX" value={state.ordenCompra} onChange={(e:any)=>setState({...state,ordenCompra:e.target.value})}/>
            </Field>
          )}
          initial={{ ordenCompra: row.ordenCompra }}
          onSave={(s:any)=>onPatch({ ordenCompra: s.ordenCompra })}
        />
      )}

      {row.estado === "Aprobado" && (
        <EditableSection
          icon="calendar" title="Fecha y comentarios"
          accent="#6366f1" bg="#eef0ff"
          editing={editing==="fec"} onEdit={()=>setEditing("fec")} onCancel={()=>setEditing(null)}
          renderRead={()=>(
            <Fragment>
              <DetailRow label="Fecha estimada" value={fmtDate(row.fecha)}/>
              <DetailRow label="Comentarios" value={row.comentarios || "—"} wide/>
            </Fragment>
          )}
          renderEdit={(state:any,setState:any)=>(
            <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:12}}>
              <Field label="Fecha"><Input type="date" value={state.fecha} onChange={(e:any)=>setState({...state,fecha:e.target.value})}/></Field>
              <Field label="Comentarios"><Textarea value={state.comentarios} onChange={(e:any)=>setState({...state,comentarios:e.target.value})}/></Field>
            </div>
          )}
          initial={{ fecha: row.fecha, comentarios: row.comentarios }}
          onSave={(s:any)=>onPatch(s)}
        />
      )}

      <DetailSection icon="download" title="Adjunto" accent="var(--celsa-plomo-acerado)" bg="var(--bg-sunken)">
        <Button variant="secondary" icon="download" onClick={async()=>{ try { await apiDownloadImagen(row.id); } catch { /* */ } }}>
          Descargar adjunto
        </Button>
        <div style={{fontSize:11,color:"var(--fg-muted)",marginTop:8}}>
          La extensión del archivo se respeta automáticamente (PDF, imagen, JSON, etc.).
        </div>
      </DetailSection>

      <DetailSection icon="clock" title="Trazabilidad" accent="var(--celsa-azul)" bg="#eef3fa">
        <TrazabilidadTimeline row={row}/>
      </DetailSection>
    </Modal>
  );
};

const ConfirmOCModal = ({ open, payload, onClose, onConfirm }: any) => {
  if (!open || !payload) return null;
  return (
    <Modal open={open} onClose={onClose} accent="blue" title="Confirmar asignación de OC"
      footer={(
        <Fragment>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon="check" onClick={onConfirm}>Confirmar asignación</Button>
        </Fragment>
      )}>
      <div style={{
        padding:14,background:"#eef3fa",border:"1px solid #c2d2ee",
        borderRadius:"var(--r-lg)",
        display:"flex",gap:12,alignItems:"flex-start",
      }}>
        <Icon name="info" size={20} style={{color:"var(--celsa-azul)",marginTop:1}}/>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--celsa-azul)"}}>Vas a asignar una orden</div>
          <div style={{fontSize:13,color:"var(--fg)",marginTop:8,lineHeight:1.5}}>
            Asignar <strong style={{fontFamily:"var(--font-mono)"}}>{payload.oc}</strong> a la solicitud <strong>RQ{payload.row.id}</strong>.<br/>
            <span style={{color:"var(--fg-muted)"}}>{payload.row.descripcion}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const BulkOCModal = ({ open, count, onClose, onConfirm }: any) => {
  const [prefix, setPrefix] = useState(`OC-${new Date().getFullYear()}`);
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} accent="red" title={`Asignar OC a ${count} solicitudes`}
      footer={(
        <Fragment>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon="cart" disabled={prefix.length<4} onClick={()=>onConfirm(prefix)}>Asignar en lote</Button>
        </Fragment>
      )}>
      <p style={{fontSize:13,color:"var(--fg-muted)",margin:"0 0 14px",lineHeight:1.5}}>
        Se asignarán OCs correlativas usando este prefijo. Ej: <code style={{fontFamily:"var(--font-mono)",color:"var(--fg)"}}>{prefix}-001, {prefix}-002, …</code>
      </p>
      <Field label="Prefijo de OC" icon="cart" required>
        <Input value={prefix} onChange={(e:any)=>setPrefix(e.target.value)}/>
      </Field>
    </Modal>
  );
};

interface Props { user: any; page?: string | null; }

const ComprasPage = ({ user, page }: Props) => {
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [view, setView] = useState("table");
  const [filters, setFilters] = useState<any>({ prioridad:"", tipo:"", estado:"", usuario:"", id:"" });
  const [sort, setSort] = useState<any>({ key:"fecha", dir:"desc" });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pageNum, setPageNum] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailRow, setDetailRow] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [confirmState, setConfirmState] = useState<any>(null);
  const [confirmOC, setConfirmOC] = useState<any>(null);
  const [bulkOC, setBulkOC] = useState(false);
  const pageSize = 12;

  useEffect(() => { setPageNum(0); }, [filters.prioridad, filters.tipo, filters.estado, filters.id, filters.usuario]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      apiGetSolicitudesCompras(pageNum, pageSize, {
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

  const metrics = useMemo(() => {
    const total = rows.length;
    const pendientesOC = rows.filter((r:any) => r.estado === "Aprobado" && !r.ordenCompra).length;
    const aprobados    = rows.filter((r:any) => r.estado === "Aprobado").length;
    const emergencias  = rows.filter((r:any) => r.estado === "Pendiente" && r.prioridad === "Emergencia").length;
    const ocCompletas  = rows.filter((r:any) => r.ordenCompra).length;
    const byMoneda = rows.reduce((acc:any, r:any) => {
      if (r.estado === "Aprobado") acc[r.moneda] = (acc[r.moneda] || 0) + (r.precio||0);
      return acc;
    }, {});
    return { total, pendientesOC, aprobados, emergencias, ocCompletas, byMoneda };
  }, [rows]);

  const patchLocal = (id:number, fields:any) => {
    setRows(arr => arr.map((r:any) => r.id === id ? { ...r, ...fields } : r));
    setDetailRow((curr:any) => curr && curr.id === id ? { ...curr, ...fields } : curr);
  };

  const patch = async (id:number, fields:any) => {
    try {
      await apiPatchSolicitud(id, fields);
      patchLocal(id, fields);
      return true;
    } catch {
      push({ kind:"error", title:"No se pudo guardar", message:`RQ${id} no se actualizó.` });
      return false;
    }
  };

  const changeEstado = async (row:any, nuevoEstado:string, comentario?:string) => {
    const fields: any = { estado: nuevoEstado };
    if (comentario) fields.comentarios = comentario;
    const ok = await patch(row.id, fields);
    if (ok) push({ kind: nuevoEstado==="Aprobado"?"success":nuevoEstado==="Rechazado"?"error":"info",
      title:`RQ${row.id} → ${nuevoEstado}`,
      message: row.descripcion });
  };

  const assignOC = async (row:any, oc:string) => {
    const ok = await patch(row.id, { ordenCompra: oc });
    if (ok) push({ kind:"success", title:"Orden de compra asignada", message:`${oc} → RQ${row.id}` });
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const { saveAs } = await import("file-saver");
      const ws = XLSX.utils.json_to_sheet(filtered.map((r:any) => ({
        ID: `RQ${r.id}`, Prioridad: r.prioridad, Tipo: r.tipo, Descripción: r.descripcion,
        Motivo: r.motivo, Familia: r.familia, Subfamilia: r.subFamilia,
        Cantidad: r.cantidad, Unidad: r.umedida, Precio: r.precio, Moneda: r.moneda,
        Estado: r.estado, "Orden de Compra": r.ordenCompra || "Sin asignar",
        Usuario: r.usuario, "Fecha solicitud": r.fecha, "Fecha aprobación": r.fechaAprobacion || "",
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Gestión");
      const buf = XLSX.write(wb, { bookType:"xlsx", type:"array" });
      saveAs(new Blob([buf], { type:"application/octet-stream" }), "gestion-solicitudes.xlsx");
      push({ kind:"success", title:"Listo", message:"gestion-solicitudes.xlsx descargado." });
    } catch {
      push({ kind:"error", title:"Error al exportar", message:"No se pudo generar el archivo." });
    }
  };

  return (
    <Fragment>
      <PageHeader
        eyebrow="Equipo de Compras"
        title={page === "dashboard" ? "Dashboard" : "Gestión de solicitudes"}
        subtitle="Asigna órdenes de compra, completa datos comerciales y mantén el ciclo cerrado."
        actions={
          <Fragment>
            {page !== "dashboard" && <ViewSwitcher view={view} onChange={setView}/>}
            <Button variant="secondary" icon="download" onClick={exportExcel}>Excel</Button>
            <Button variant="primary" icon="plus">Nueva OC</Button>
          </Fragment>
        }
      />

      {page === "dashboard" && (
        <Fragment>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:18}}>
            <Metric icon="cart" color="var(--celsa-red-500)" label="Pendientes de OC" value={metrics.pendientesOC} delta="+3 esta semana" trend="up"/>
            <Metric icon="flame" color="#f59e0b" label="Emergencias activas" value={metrics.emergencias} delta="2 sin atender" trend="warn"/>
            <Metric icon="checkCircle" color="var(--celsa-verde)" label="Aprobadas (total)" value={metrics.aprobados} delta="92% del trimestre" trend="up"/>
            <Metric icon="trend" color="var(--celsa-azul)" label="OCs emitidas" value={metrics.ocCompletas} delta={`${Math.round(100*metrics.ocCompletas/Math.max(1,metrics.aprobados))}% conversión`} trend="up"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)",gap:16,marginBottom:18}}>
            <SpendByCurrency byMoneda={metrics.byMoneda}/>
            <TopFamilies rows={rows}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)",gap:16}}>
            <ActividadReciente limit={10}/>
          </div>
        </Fragment>
      )}

      {page !== "dashboard" && (
        <Fragment>
          <Card padded={false} style={{marginBottom:14}}>
            <div style={{
              padding:"12px 16px",
              display:"grid",
              gridTemplateColumns:"180px 140px 140px 1fr 130px auto",
              gap:10,alignItems:"center",
            }}>
              <FilterSelect value={filters.prioridad} onChange={(v:string)=>setFilters((f:any)=>({...f,prioridad:v}))} label="Prioridad" options={PRIORIDADES}/>
              <FilterSelect value={filters.tipo} onChange={(v:string)=>setFilters((f:any)=>({...f,tipo:v}))} label="Tipo" options={TIPOS}/>
              <FilterSelect value={filters.estado} onChange={(v:string)=>setFilters((f:any)=>({...f,estado:v}))} label="Estado" options={ESTADOS}/>
              <Input leftIcon="user" placeholder="Buscar usuario" value={filters.usuario} onChange={(e:any)=>setFilters((f:any)=>({...f,usuario:e.target.value}))}/>
              <Input leftIcon="search" placeholder="ID RQ…" value={filters.id} onChange={(e:any)=>setFilters((f:any)=>({...f,id:e.target.value}))}/>
              <Button size="md" variant="ghost" icon="refresh" onClick={()=>setFilters({prioridad:"",tipo:"",estado:"",usuario:"",id:""})}>Limpiar</Button>
            </div>
          </Card>

          {selected.size > 0 && (
            <div style={{
              padding:"10px 16px",borderRadius:"var(--r-lg)",
              background:"var(--celsa-plomo-acerado)",color:"#fff",
              display:"flex",alignItems:"center",gap:14,marginBottom:14,
              boxShadow:"var(--sh-md)",
              animation:"slide-up .25s var(--ease-out)",
            }}>
              <Icon name="checkCircle" size={16}/>
              <span style={{fontWeight:600,fontSize:13}}>{selected.size} seleccionada(s)</span>
              <div style={{flex:1}}/>
              <Button size="sm" variant="primary" icon="cart" onClick={()=>setBulkOC(true)}>Asignar OC</Button>
              <Button size="sm" variant="secondary" icon="download">Exportar</Button>
              <Button size="sm" variant="ghost" icon="x" onClick={()=>setSelected(new Set())} style={{color:"#fff"}}>Cancelar</Button>
            </div>
          )}

          {view === "table" ? (
            <ComprasTable
              rows={filtered}
              sort={sort} setSort={setSort}
              selected={selected} setSelected={setSelected}
              onOpen={(r:any)=>setDetailRow(r)}
              onAssignOC={(r:any,oc:string)=>setConfirmOC({row:r,oc})}
              pageNum={pageNum} setPageNum={setPageNum} pageSize={pageSize}
              totalPages={totalPages}
            />
          ) : (
            <KanbanView rows={filtered} onOpen={(r:any)=>setDetailRow(r)} role={user?.rol} onMove={(r:any,e:string)=>setConfirmState({row:r,nuevoEstado:e})} onDownloadImg={async(id:number)=>{ try { await apiDownloadImagen(id); } catch { /* */ } }}/>
          )}
        </Fragment>
      )}

      <ComprasDetailModal
        row={detailRow} onClose={()=>{setDetailRow(null); setEditingSection(null);}}
        editing={editingSection} setEditing={setEditingSection}
        onPatch={async (fields:any)=>{
          const ok = await patch(detailRow.id, fields);
          if (ok) { setEditingSection(null); push({kind:"success",title:"Cambios guardados",message:"Sección actualizada."}); }
        }}
      />

      <ChangeStateModal open={!!confirmState} payload={confirmState}
        onClose={()=>setConfirmState(null)}
        onConfirm={(comment:string)=>{ changeEstado(confirmState.row, confirmState.nuevoEstado, comment); setConfirmState(null); }}/>

      <ConfirmOCModal open={!!confirmOC} payload={confirmOC}
        onClose={()=>setConfirmOC(null)}
        onConfirm={()=>{ assignOC(confirmOC.row, confirmOC.oc); setConfirmOC(null); }}/>

      <BulkOCModal open={bulkOC} count={selected.size}
        onClose={()=>setBulkOC(false)}
        onConfirm={async (prefix:string)=>{
          const ids = [...selected];
          const results = await Promise.allSettled(ids.map((id, i) => patch(id, { ordenCompra: `${prefix}-${String(i+1).padStart(3,"0")}` })));
          const ok = results.filter(r => r.status === "fulfilled" && (r as any).value).length;
          push({ kind: ok===ids.length?"success":"warn", title:"OCs asignadas en lote", message:`${ok}/${ids.length} solicitudes recibieron ${prefix}-XXX`});
          setSelected(new Set()); setBulkOC(false);
        }}/>
    </Fragment>
  );
};

export default ComprasPage;
