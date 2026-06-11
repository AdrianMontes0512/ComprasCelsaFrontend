/* ============================================================
   COMPRAS CELSA — Formulario (Empleado / TMLIMA)
   Multi-tab solicitudes with realistic validation,
   image drag/drop, history modal.
   ============================================================ */
import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import {
  Icon, Button, Modal, Field, Input, Select, Textarea,
  Card, PageHeader, EmptyState, SummaryRow,
  PriorityBadge, TypeBadge, StatusBadge,
  useToast, fmtMoney,
} from "../components/ui";
import { FAMILIAS, UNIDADES, MONEDAS, TIPOS, PRIORIDADES } from "../data/celsa";
import { apiGetAreas, apiCreateSolicitud } from "../services/api";

const EMPTY_FORM = () => ({
  prioridad: "",
  centroCostos: "",
  tipo: "",
  descripcion: "",
  maquina: "",
  motivo: "",
  familia: "",
  subFamilia: "",
  cantidad: "",
  umedida: "",
  precio: "",
  moneda: "",
  imagen: null as null | { dataUrl:string; name:string; mime:string },
});

const REQUIRED_FIELDS = ["prioridad","centroCostos","tipo","descripcion","motivo","familia","subFamilia","cantidad","umedida","precio","moneda"];

const isFormComplete = (f:any) => REQUIRED_FIELDS.every(k => String(f[k]||"").length > 0);

const SectionHeading = ({ n, title, hint }: any) => (
  <div style={{
    display:"flex",alignItems:"baseline",gap:12,marginBottom:14,
    borderBottom:"1px solid var(--border)",paddingBottom:8,
  }}>
    <span style={{
      fontFamily:"var(--font-mono)",fontSize:11,fontWeight:700,
      color:"var(--celsa-red-500)",letterSpacing:1,
    }}>{n}</span>
    <span style={{fontSize:14,fontWeight:700,color:"var(--fg)"}}>{title}</span>
    {hint && <span style={{fontSize:12,color:"var(--fg-subtle)",fontWeight:400}}>· {hint}</span>}
  </div>
);

const Empty = () => <span style={{color:"var(--fg-subtle)",fontStyle:"italic",fontSize:12}}>—</span>;

interface Props { user: any; page?: string; }

const FormularioPage = ({ user }: Props) => {
  const { push } = useToast();

  const initial = useMemo(() => {
    const f: any = EMPTY_FORM();
    if (user.rol === "TMLIMA") f.centroCostos = "TMLIMA";
    return [f];
  }, [user.rol]);

  const [forms, setForms] = useState<any[]>(initial);
  const [active, setActive] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const [areas, setAreas] = useState<string[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    if (user.rol === "TMLIMA") return;
    setLoadingAreas(true);
    apiGetAreas()
      .then(setAreas)
      .catch(() => push({ kind:"error", title:"No se pudieron cargar las áreas", message:"Verifica la conexión con el backend." }))
      .finally(() => setLoadingAreas(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.rol]);

  const f = forms[active] || EMPTY_FORM();
  const completedCount = forms.filter(isFormComplete).length;

  const setField = (key:string, value:any) => {
    setForms(arr => arr.map((x, i) => i === active ? {
      ...x,
      [key]: value,
      ...(key === "familia" ? { subFamilia: "" } : {}),
    } : x));
    setTouched((t:any) => ({ ...t, [key]: true }));
  };

  const addTab = () => {
    if (forms.length >= 10) {
      push({ kind:"warn", title:"Límite alcanzado", message:"Puedes tener hasta 10 solicitudes simultáneas." });
      return;
    }
    const newF: any = EMPTY_FORM();
    if (user.rol === "TMLIMA") newF.centroCostos = "TMLIMA";
    setForms(arr => [...arr, newF]);
    setActive(forms.length);
  };

  const removeTab = (idx:number, e:any) => {
    e.stopPropagation();
    if (forms.length === 1) {
      push({ kind:"warn", message:"Debe quedar al menos un formulario." });
      return;
    }
    setForms(arr => arr.filter((_, i) => i !== idx));
    setActive(a => Math.max(0, a >= idx ? a - 1 : a));
  };

  const fileRef = useRef<HTMLInputElement|null>(null);
  const [dragging, setDragging] = useState(false);
  const handleFile = (file:File|undefined) => {
    if (!file) return;
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      push({ kind:"error", title:"Archivo muy grande", message:"El máximo permitido es 10 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField("imagen", {
      dataUrl: reader.result as string,
      name: file.name,
      mime: file.type || "application/octet-stream",
    });
    reader.readAsDataURL(file);
  };

  const validate = (form:any) => {
    const e: any = {};
    if (!form.prioridad) e.prioridad = "Selecciona la prioridad";
    if (!form.centroCostos) e.centroCostos = "Asigna un centro de costos";
    if (!form.tipo) e.tipo = "Indica el tipo";
    if (!form.descripcion) e.descripcion = "Describe el ítem solicitado";
    else if (form.descripcion.length < 8) e.descripcion = "Mínimo 8 caracteres";
    if (!form.motivo) e.motivo = "Indica el motivo";
    if (!form.familia) e.familia = "Selecciona la familia";
    if (!form.subFamilia) e.subFamilia = "Selecciona la subfamilia";
    if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = "Mínimo 1";
    if (!form.umedida) e.umedida = "Unidad requerida";
    if (form.precio === "" || Number(form.precio) < 0) e.precio = "Importe inválido";
    if (!form.moneda) e.moneda = "Moneda requerida";
    return e;
  };

  useEffect(() => {
    if (Object.keys(touched).length) setErrors(validate(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, touched]);

  const onSubmit = () => {
    const allErrs = forms.map(validate);
    const hasErrors = allErrs.some(e => Object.keys(e).length);
    if (hasErrors) {
      const firstBad = allErrs.findIndex(e => Object.keys(e).length);
      setActive(firstBad);
      setErrors(allErrs[firstBad]);
      setTouched(Object.fromEntries(REQUIRED_FIELDS.map(k=>[k,true])));
      push({ kind:"error", title:"Revisa los formularios", message:`La pestaña ${firstBad+1} tiene campos incompletos.` });
      return;
    }
    setConfirmOpen(true);
  };

  const doSend = async () => {
    setSubmitting(true);
    const stripDataUrl = (s:string) => s.includes(",") ? s.split(",")[1] : s;
    const results = await Promise.allSettled(forms.map((form:any) => apiCreateSolicitud({
      prioridad: form.prioridad,
      centroCostos: form.centroCostos,
      tipo: form.tipo,
      descripcion: form.descripcion,
      maquina: form.maquina,
      motivo: form.motivo,
      familia: form.familia,
      subFamilia: form.subFamilia,
      cantidad: Number(form.cantidad),
      umedida: form.umedida,
      precio: Number(form.precio),
      moneda: form.moneda,
      usuarioId: user.userId,
      imageData: form.imagen?.dataUrl ? stripDataUrl(form.imagen.dataUrl) : null,
      imageMimeType: form.imagen?.mime || null,
      imageFilename: form.imagen?.name || null,
    })));
    setSubmitting(false);
    setConfirmOpen(false);
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = results.length - ok;
    if (fail === 0) {
      push({ kind:"success", title:"Solicitudes enviadas", message:`${ok} solicitud(es) creadas correctamente.` });
      const f0: any = EMPTY_FORM();
      if (user.rol === "TMLIMA") f0.centroCostos = "TMLIMA";
      setForms([f0]);
      setActive(0);
      setErrors({});
      setTouched({});
    } else if (ok > 0) {
      push({ kind:"warn", title:"Envío parcial", message:`${ok} creadas, ${fail} fallaron. Revisa e intenta de nuevo.` });
    } else {
      push({ kind:"error", title:"No se pudo enviar", message:"Verifica la conexión con el backend." });
    }
  };

  const tabStateOf = (form:any) => {
    if (isFormComplete(form)) return "complete";
    if (Object.values(form).some((v:any) => v && (typeof v !== "object" || v?.dataUrl))) return "started";
    return "empty";
  };

  return (
    <Fragment>
      <PageHeader
        eyebrow="Solicitud de compra"
        title="Nueva solicitud"
        subtitle={user.rol === "TMLIMA"
          ? "Centro de costos fijado en TMLIMA. Crea una o varias solicitudes en pestañas paralelas y envíalas en lote."
          : "Crea una o varias solicitudes en pestañas paralelas. Validamos cada campo en tiempo real para que llegues al envío sin reproches."}
        actions={
          <Button variant="primary" icon="send" onClick={onSubmit}>
            Enviar {forms.length>1 && `(${forms.length})`}
          </Button>
        }
      />

      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 320px",gap:24,alignItems:"flex-start"}}>
        {/* MAIN COL */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* tabs */}
          <Card padded={false}>
            <div style={{
              display:"flex",alignItems:"center",
              padding:"10px 12px",gap:6,
              overflowX:"auto",
              borderBottom:"1px solid var(--border)",
            }}>
              {forms.map((form:any, idx:number) => {
                const state = tabStateOf(form);
                const isActive = idx === active;
                return (
                  <button key={idx} onClick={()=>{setActive(idx);setErrors(validate(form));}} style={{
                    display:"inline-flex",alignItems:"center",gap:8,
                    padding:"7px 12px",
                    borderRadius:"var(--r-md)",
                    border: isActive ? `1px solid var(--celsa-red-500)` : "1px solid var(--border)",
                    background: isActive ? "var(--celsa-red-50)" : "var(--bg-surface)",
                    color: isActive ? "var(--celsa-red-700)" : "var(--fg-muted)",
                    fontSize:12.5,fontWeight:600,cursor:"pointer",
                    transition:"all .15s var(--ease-out)",
                    whiteSpace:"nowrap",
                  }}>
                    <span style={{
                      width:18,height:18,borderRadius:"50%",
                      background: state==="complete" ? "var(--celsa-verde)" : isActive ? "var(--celsa-red-500)" : "var(--ink-200)",
                      color:"#fff",fontSize:10,fontWeight:700,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>{state==="complete" ? <Icon name="check" size={10} stroke={3}/> : idx+1}</span>
                    Solicitud {idx+1}
                    {forms.length>1 && (
                      <span onClick={(e:any)=>removeTab(idx,e)} style={{
                        padding:2,borderRadius:4,marginLeft:4,
                        color:"var(--fg-subtle)",cursor:"pointer",
                      }}><Icon name="x" size={11}/></span>
                    )}
                  </button>
                );
              })}
              <button onClick={addTab} style={{
                display:"inline-flex",alignItems:"center",gap:6,
                padding:"7px 12px",
                borderRadius:"var(--r-md)",
                border:"1px dashed var(--border-strong)",
                background:"transparent",color:"var(--fg-muted)",
                fontSize:12.5,fontWeight:600,cursor:"pointer",
              }}><Icon name="plus" size={12}/> Agregar</button>
              <div style={{flex:1}}/>
              <span style={{fontSize:11,color:"var(--fg-subtle)",padding:"0 8px"}}>
                {completedCount}/{forms.length} completas
              </span>
            </div>

            <div style={{padding:24}} key={active} className="fade-in">
              {/* SECTION 1 */}
              <SectionHeading n="01" title="Clasificación" hint="Define la prioridad y a dónde se carga la solicitud."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:24}}>
                <Field label="Prioridad" icon="flame" required error={touched.prioridad && errors.prioridad}>
                  <div style={{display:"flex",gap:6}}>
                    {PRIORIDADES.map(p => {
                      const sel = f.prioridad === p;
                      const palette: any = { Emergencia:["var(--celsa-red-500)","var(--celsa-red-50)"], Urgencia:["#f59e0b","#fdf3dc"], Estándar:["var(--celsa-verde)","#e3f4e8"] };
                      const c = palette[p];
                      return (
                        <button key={p} type="button" onClick={()=>setField("prioridad",p)} style={{
                          flex:1,padding:"8px 6px",borderRadius:"var(--r-md)",
                          border: `1px solid ${sel?c[0]:"var(--border-strong)"}`,
                          background: sel ? c[1] : "var(--bg-surface)",
                          color: sel ? c[0] : "var(--fg-muted)",
                          fontSize:11.5,fontWeight:700,cursor:"pointer",letterSpacing:0.3,
                          transition:"all .15s var(--ease-out)",
                        }}>{p}</button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Centro de costos" icon="building" required error={touched.centroCostos && errors.centroCostos}>
                  {user.rol === "TMLIMA"
                    ? <Input value="TMLIMA" readOnly style={{background:"var(--bg-sunken)",color:"var(--fg-muted)",cursor:"not-allowed"}}/>
                    : (
                      <Select value={f.centroCostos} onChange={(e:any)=>setField("centroCostos",e.target.value)} error={touched.centroCostos&&errors.centroCostos} disabled={loadingAreas}>
                        <option value="">{loadingAreas ? "Cargando áreas…" : "Selecciona un centro…"}</option>
                        {areas.map(a => <option key={a}>{a}</option>)}
                      </Select>
                    )
                  }
                </Field>

                <Field label="Tipo" icon="box" required error={touched.tipo && errors.tipo}>
                  <Select value={f.tipo} onChange={(e:any)=>setField("tipo",e.target.value)} error={touched.tipo&&errors.tipo}>
                    <option value="">Selecciona el tipo…</option>
                    {TIPOS.map(t=> <option key={t}>{t}</option>)}
                  </Select>
                </Field>
              </div>

              {/* SECTION 2 */}
              <SectionHeading n="02" title="Descripción" hint="Qué solicitas y para qué."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <Field label="Descripción del ítem" icon="fileText" required error={touched.descripcion && errors.descripcion} style={{gridColumn:"1 / -1"}}>
                  <Textarea
                    placeholder="Ej: Cable de cobre AWG 14 desnudo recocido, 100 metros, para línea 3."
                    value={f.descripcion}
                    onChange={(e:any)=>setField("descripcion",e.target.value)}
                    error={touched.descripcion && errors.descripcion}
                    style={{minHeight:64}}
                    onBlur={()=>setTouched((t:any)=>({...t,descripcion:true}))}
                  />
                </Field>
                <Field label="Máquina relacionada" icon="hammer" hint="Opcional">
                  <Input placeholder="Ej: Extrusora L3" value={f.maquina} onChange={(e:any)=>setField("maquina",e.target.value)}/>
                </Field>
                <Field label="Motivo" icon="info" required error={touched.motivo && errors.motivo}>
                  <Input placeholder="Ej: Reposición de stock crítico" value={f.motivo}
                    onChange={(e:any)=>setField("motivo",e.target.value)}
                    error={touched.motivo && errors.motivo}
                    onBlur={()=>setTouched((t:any)=>({...t,motivo:true}))}
                  />
                </Field>
              </div>

              {/* SECTION 3 */}
              <div style={{marginTop:18}}/>
              <SectionHeading n="03" title="Categorización" hint="Familia y subfamilia del catálogo CELSA."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
                <Field label="Familia" icon="layers" required error={touched.familia && errors.familia}>
                  <Select value={f.familia} onChange={(e:any)=>setField("familia",e.target.value)} error={touched.familia&&errors.familia}>
                    <option value="">Selecciona una familia…</option>
                    {Object.keys(FAMILIAS).map(k => <option key={k}>{k}</option>)}
                  </Select>
                </Field>
                <Field label="Subfamilia" icon="layers" required error={touched.subFamilia && errors.subFamilia}>
                  <Select value={f.subFamilia} onChange={(e:any)=>setField("subFamilia",e.target.value)} disabled={!f.familia} error={touched.subFamilia&&errors.subFamilia}>
                    <option value="">{f.familia ? "Selecciona una subfamilia…" : "Selecciona una familia primero"}</option>
                    {(FAMILIAS[f.familia] || []).map((s:string) => <option key={s}>{s}</option>)}
                  </Select>
                </Field>
              </div>

              {/* SECTION 4 */}
              <SectionHeading n="04" title="Cantidad e importe" hint="Referencial — Compras valida los datos comerciales."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:24}}>
                <Field label="Cantidad" required error={touched.cantidad && errors.cantidad}>
                  <Input type="number" min="1" placeholder="0" value={f.cantidad}
                    onChange={(e:any)=>setField("cantidad",e.target.value)}
                    error={touched.cantidad && errors.cantidad}
                    onBlur={()=>setTouched((t:any)=>({...t,cantidad:true}))}
                  />
                </Field>
                <Field label="Unidad" required error={touched.umedida && errors.umedida}>
                  <Select value={f.umedida} onChange={(e:any)=>setField("umedida",e.target.value)} error={touched.umedida&&errors.umedida}>
                    <option value="">—</option>
                    {UNIDADES.map(u=> <option key={u}>{u}</option>)}
                  </Select>
                </Field>
                <Field label="Importe referencial" required error={touched.precio && errors.precio}>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={f.precio}
                    onChange={(e:any)=>setField("precio",e.target.value)}
                    error={touched.precio && errors.precio}
                    onBlur={()=>setTouched((t:any)=>({...t,precio:true}))}
                  />
                </Field>
                <Field label="Moneda" required error={touched.moneda && errors.moneda}>
                  <Select value={f.moneda} onChange={(e:any)=>setField("moneda",e.target.value)} error={touched.moneda&&errors.moneda}>
                    <option value="">—</option>
                    {MONEDAS.map(m=> <option key={m.v} value={m.v}>{m.sym} {m.v}</option>)}
                  </Select>
                </Field>
              </div>

              {/* SECTION 5 */}
              <SectionHeading n="05" title="Adjunto" hint="Opcional · cualquier archivo (imagen, PDF, JSON, Excel, ZIP…)."/>
              <div
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}
                style={{
                  marginTop:6,
                  padding: f.imagen ? 12 : 28,
                  border: `1.5px dashed ${dragging?"var(--celsa-red-500)":"var(--border-strong)"}`,
                  background: dragging ? "var(--celsa-red-50)" : "var(--bg-sunken)",
                  borderRadius:"var(--r-lg)",
                  textAlign:"center",cursor:"pointer",
                  transition:"all .15s var(--ease-out)",
                }}>
                <input ref={fileRef} type="file" hidden onChange={e=>handleFile(e.target.files?.[0])}/>
                {f.imagen ? (
                  <div style={{display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
                    {f.imagen.mime.startsWith("image/") ? (
                      <img src={f.imagen.dataUrl} alt="" style={{width:96,height:96,objectFit:"cover",borderRadius:8,border:"1px solid var(--border)"}}/>
                    ) : (
                      <div style={{
                        width:96,height:96,borderRadius:8,
                        border:"1px solid var(--border)",background:"var(--bg-surface)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"var(--celsa-red-500)",
                      }}><Icon name="fileText" size={36}/></div>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--fg)",textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>{f.imagen.name}</div>
                      <div style={{fontSize:11.5,color:"var(--fg-muted)",marginTop:2,fontFamily:"var(--font-mono)"}}>{f.imagen.mime || "tipo desconocido"}</div>
                      <div style={{fontSize:11,color:"var(--fg-subtle)",marginTop:2}}>Click para reemplazar · Drag&drop también funciona</div>
                    </div>
                    <Button size="sm" variant="ghost" icon="trash" onClick={(e:any)=>{e.stopPropagation();setField("imagen",null);}}>Quitar</Button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width:42,height:42,borderRadius:"50%",
                      background:"var(--celsa-red-50)",color:"var(--celsa-red-500)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      margin:"0 auto 10px",
                    }}><Icon name="upload" size={18}/></div>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--fg)"}}>Arrastra un archivo o click para subir</div>
                    <div style={{fontSize:11.5,color:"var(--fg-muted)",marginTop:4}}>Cualquier tipo · máx. 10 MB</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* SIDE PANEL */}
        <div style={{position:"sticky",top:"calc(var(--header-h) + 28px)",display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{
              fontSize:10,fontWeight:700,letterSpacing:2.5,
              color:"var(--celsa-red-600)",textTransform:"uppercase",
            }}>Resumen en vivo</div>
            <h3 style={{margin:"6px 0 14px",fontSize:16,fontWeight:700,letterSpacing:-0.2}}>
              Solicitud {active+1} de {forms.length}
            </h3>

            <SummaryRow label="Prioridad" value={f.prioridad ? <PriorityBadge value={f.prioridad}/> : <Empty/>}/>
            <SummaryRow label="Tipo"      value={f.tipo ? <TypeBadge value={f.tipo}/> : <Empty/>}/>
            <SummaryRow label="Centro"    value={f.centroCostos || <Empty/>}/>
            <SummaryRow label="Familia"   value={f.familia || <Empty/>}/>
            <SummaryRow label="Subfamilia" value={f.subFamilia || <Empty/>}/>
            <SummaryRow label="Cantidad"  value={f.cantidad ? `${f.cantidad} ${f.umedida||""}` : <Empty/>}/>
            <SummaryRow label="Importe"   value={f.precio && f.moneda ? fmtMoney(f.precio, f.moneda) : <Empty/>} highlight/>

            <div style={{
              marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)",
              display:"flex",alignItems:"center",justifyContent:"space-between",
            }}>
              <div style={{fontSize:11.5,color:"var(--fg-muted)"}}>
                Progreso · <strong style={{color:"var(--fg)"}}>{REQUIRED_FIELDS.filter(k=>String(f[k]||"").length>0).length}/{REQUIRED_FIELDS.length}</strong>
              </div>
              <div style={{width:80,height:6,borderRadius:999,background:"var(--ink-100)",overflow:"hidden"}}>
                <div style={{
                  height:"100%",
                  width: `${100*REQUIRED_FIELDS.filter(k=>String(f[k]||"").length>0).length/REQUIRED_FIELDS.length}%`,
                  background:"var(--celsa-verde)",transition:"width .3s var(--ease-out)",
                }}/>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{
                width:32,height:32,borderRadius:8,
                background:"var(--celsa-red-50)",color:"var(--celsa-red-500)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}><Icon name="info" size={15}/></div>
              <div style={{fontSize:13,fontWeight:700}}>¿Cómo funciona?</div>
            </div>
            <ol style={{margin:0,paddingLeft:18,fontSize:12,color:"var(--fg-muted)",lineHeight:1.7}}>
              <li>Tu solicitud entra a <b style={{color:"var(--fg)"}}>Pendiente</b>.</li>
              <li>Tu Jefe de área la <b style={{color:"var(--fg)"}}>Aprueba o Rechaza</b>.</li>
              <li>Compras asigna la <b style={{color:"var(--fg)"}}>Orden de Compra</b>.</li>
              <li>Te avisamos por correo en cada etapa.</li>
            </ol>
          </Card>
        </div>
      </div>

      {/* Confirm send modal */}
      <Modal open={confirmOpen} onClose={()=>setConfirmOpen(false)} title="Confirmar envío"
        footer={(
          <Fragment>
            <Button variant="secondary" onClick={()=>setConfirmOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button variant="primary" icon="send" loading={submitting} onClick={doSend}>
              Confirmar y enviar ({forms.length})
            </Button>
          </Fragment>
        )}>
        <div style={{
          padding:14,borderRadius:"var(--r-lg)",
          background:"var(--status-pendiente-bg)",
          border:"1px solid var(--status-pendiente-bd)",
          color:"var(--status-pendiente-fg)",
          fontSize:12.5,display:"flex",gap:10,alignItems:"flex-start",
          marginBottom:18,
        }}>
          <Icon name="alert" size={16} style={{marginTop:2}}/>
          <div><strong>Importante.</strong> Una vez enviadas, no podrás modificar los datos. Tu Jefe de Área será notificado de inmediato.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {forms.map((form:any, idx:number) => (
            <div key={idx} style={{
              padding:"10px 12px",
              border:"1px solid var(--border)",
              borderRadius:"var(--r-md)",
              display:"flex",alignItems:"center",justifyContent:"space-between",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <span style={{
                  width:22,height:22,borderRadius:"50%",
                  background:"var(--celsa-verde)",color:"#fff",
                  fontSize:11,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}><Icon name="check" size={11} stroke={3}/></span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap",maxWidth:300}}>
                    {form.descripcion || `Solicitud ${idx+1}`}
                  </div>
                  <div style={{fontSize:11,color:"var(--fg-muted)"}}>
                    {form.familia} · {form.cantidad} {form.umedida}
                  </div>
                </div>
              </div>
              <div style={{fontWeight:600,fontSize:13}}>{fmtMoney(form.precio, form.moneda)}</div>
            </div>
          ))}
        </div>
      </Modal>

    </Fragment>
  );
};

export default FormularioPage;
