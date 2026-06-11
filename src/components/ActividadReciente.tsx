import { useEffect, useState } from "react";
import { Card, Icon, Badge, relTime } from "./ui";
import { apiGetActividadReciente, type ActividadItem } from "../services/api";

const ICON_BY: Record<string,string> = {
  creada: "fileText",
  aprobada: "checkCircle",
  rechazada: "x",
  oc_asignada: "cart",
};
const COLOR_BY: Record<string,string> = {
  creada: "var(--celsa-plomo-acerado)",
  aprobada: "var(--celsa-verde)",
  rechazada: "var(--celsa-red-500)",
  oc_asignada: "var(--celsa-azul)",
};
const LABEL_BY: Record<string,string> = {
  creada: "creó la solicitud",
  aprobada: "fue aprobada",
  rechazada: "fue rechazada",
  oc_asignada: "recibió OC",
};

export const ActividadReciente = ({ limit = 8 }: { limit?: number }) => {
  const [items, setItems] = useState<ActividadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetActividadReciente(limit)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <Card>
      <div style={{
        fontSize:10.5,fontWeight:700,letterSpacing:2.2,
        color:"var(--celsa-red-600)",textTransform:"uppercase",marginBottom:14,
      }}>Actividad reciente</div>

      {loading && <div style={{fontSize:12,color:"var(--fg-muted)"}}>Cargando…</div>}
      {!loading && items.length === 0 && (
        <div style={{fontSize:12,color:"var(--fg-muted)"}}>Sin movimientos.</div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {items.map((a,i)=>(
          <div key={`${a.solicitudId}-${i}`} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{
              width:28,height:28,borderRadius:"50%",
              background:COLOR_BY[a.tipo],color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            }}><Icon name={ICON_BY[a.tipo]} size={14}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:"var(--fg)",lineHeight:1.4}}>
                <strong>RQ{a.solicitudId}</strong> {LABEL_BY[a.tipo]} <span style={{color:"var(--fg-muted)"}}>·</span> <span style={{color:"var(--fg-muted)"}}>{a.actor}</span>
              </div>
              <div style={{fontSize:11,color:"var(--fg-muted)",marginTop:2,display:"flex",gap:8,alignItems:"center"}}>
                <span>{relTime(a.ocurrioEn)}</span>
                <Badge color="neutral">{a.estado}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
