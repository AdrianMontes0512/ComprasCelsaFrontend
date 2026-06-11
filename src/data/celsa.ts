/* ============================================================
   COMPRAS CELSA — Mock data + catálogos
   ============================================================ */

export const FAMILIAS: Record<string, string[]> = {
  "Materias primas": ["Cobre y metales","Plásticos y polímeros","Aislantes y recubrimientos","Pantallas y blindajes","Rellenos y separadores","Material conductor","Chaquetas y cubiertas","Componentes eléctricos","Aditivos y auxiliares"],
  "Mantenimiento": ["Equipos industriales","Repuestos y partes","Ferretería y herramientas","Electricidad industrial","Neumática e hidráulica","Lubricantes y químicos","Elementos de fijación","Alquileres de equipos","Servicios eléctricos","Servicios mecánicos","Mantenimiento preventivo","Mantenimiento correctivo","Mantenimiento predictivo","Servicios integrales","Calibraciones y normativas","Servicios técnicos TI"],
  "Fabricación": ["Mecanizado y CNC","Corte y plegado","Soldadura","Componentes metálicos","Tratamientos","Plásticos técnicos","Moldes y matrices"],
  "Ingeniería": ["Proyectos industriales","Ingeniería civil","Ingeniería eléctrica","Ingeniería mecánica","Procesos industriales","Automatización y control","Consultorías técnicas","Capacitación técnica"],
  "SSOMA": ["EPP y ropa de trabajo","Salud ocupacional","Capacitación en seguridad"],
  "Facility": ["Alimentación","Limpieza y jardinería","Transporte interno","Seguridad física","Mantenimiento edilicio","Servicios auxiliares","Apoyo logístico interno","Utensilios de cocina","Equipos menores de cocina","Suministros de alimentos","Dispensadores y accesorios","Limpieza de kitchenette"],
  "TI": ["Software y licencias","Servicios tecnológicos","Equipos de cómputo","Periféricos","Equipos móviles","Accesorios tecnológicos","Componentes y repuestos TI"],
  "Marketing": ["Material promocional","Eventos y ferias","Publicidad y medios"],
  "Administración": ["Oficina","Útiles de oficina","Equipos de oficina","Servicios de impresión","Mobiliario","Traducción institucional","Producción editorial"],
  "Legal": ["Asesoría legal","Trámites y permisos","Certificaciones y normas"],
  "Recursos Humanos": ["Selección y reclutamiento","Beneficios y compensaciones","Bienestar y clima laboral","Capacitación y desarrollo","Evaluación de desempeño","Tercerización de personal"],
  "Logística y Transporte": ["Transporte local","Transporte internacional","Agenciamiento aduanal","Gastos portuarios","Seguros de carga","Logística tercerizada","Fletes y maniobras","Equipos logísticos","Identificación y marcaje","Embalajes y bobinas","Zunchado y protección","Paletizado y despacho"],
  "Proyectos": ["Consultoría de proyectos"],
  "Finanzas y contabilidad": ["Servicios contables y tributarios","Seguros"],
  "Legal y cumplimiento": ["Compliance y ética"],
  "Gestión documental": ["Digitalización y archivo"],
  "Sostenibilidad": ["Gestión ambiental","Gestión de residuos"],
  "Activos industriales": ["Equipos de proceso","Auxiliares de planta","Móviles industriales","Sistemas de energía y control"],
  "Calidad y laboratorio": ["Equipos de ensayo","Laboratorio fis/quím","Calibración y verificación","Servicios metrológicos"],
};

export const AREAS = ["Producción","Mantenimiento","Ingeniería","SSOMA","TI","Logística","Comercial","Administración","Calidad","TMLIMA","Almacén Lima","Almacén Trujillo"];

export const UNIDADES = ["unidad","metro","litro","kilo","par","juego","caja","rollo"];
export const MONEDAS = [{v:"Soles",sym:"S/."},{v:"Dolares",sym:"US$"},{v:"Euros",sym:"€"}];
export const TIPOS = ["Producto","Servicio","Activo"];
export const PRIORIDADES = ["Emergencia","Urgencia","Estándar"];
export const ESTADOS = ["Pendiente","Aprobado","Rechazado"];

export const USERS = [
  { id: 1,  firstname: "Diego",    lastname: "Quispe Vargas",   area: "Producción",     rol: "Empleado" },
  { id: 2,  firstname: "Camila",   lastname: "Rojas Ñahui",     area: "Mantenimiento",  rol: "Empleado" },
  { id: 3,  firstname: "Andrés",   lastname: "Torres León",     area: "Ingeniería",     rol: "Empleado" },
  { id: 4,  firstname: "Lucía",    lastname: "Mendoza Silva",   area: "SSOMA",          rol: "Empleado" },
  { id: 5,  firstname: "Renato",   lastname: "Cabrera Ríos",    area: "TI",             rol: "Empleado" },
  { id: 6,  firstname: "Valeria",  lastname: "Paredes Cruz",    area: "Logística",      rol: "Empleado" },
  { id: 7,  firstname: "Joaquín",  lastname: "Salinas Vega",    area: "TMLIMA",         rol: "TMLIMA" },
  { id: 8,  firstname: "Mariana",  lastname: "Soto Aliaga",     area: "Calidad",        rol: "Empleado" },
  { id: 9,  firstname: "Fernando", lastname: "Núñez Espinoza",  area: "Producción",     rol: "JefeArea" },
  { id: 10, firstname: "Patricia", lastname: "Vidal Acosta",    area: "Compras",        rol: "Compras" },
];

const SAMPLE_DESCRIPTIONS: [string,string,string,string][] = [
  ["Materias primas","Cobre y metales","Cable de cobre AWG 14 desnudo recocido para extrusión línea 3","Reposición stock crítico — línea 3 sin material"],
  ["Mantenimiento","Repuestos y partes","Rodamiento SKF 6308-2RS1 para motor extrusor","Falla detectada en mantenimiento predictivo"],
  ["Mantenimiento","Electricidad industrial","Variador de frecuencia Siemens G120 11kW","Reemplazo por avería de variador actual"],
  ["TI","Equipos de cómputo","Laptop Dell Latitude 5450 i7 16GB para nuevo ingreso","Nuevo colaborador del área TI"],
  ["SSOMA","EPP y ropa de trabajo","Guantes anti-corte nivel 5 — 50 pares talla L","Renovación trimestral EPP planta"],
  ["Logística y Transporte","Embalajes y bobinas","Bobinas de madera 1000mm — 200 unidades","Despacho cliente Enel — pedido Q3"],
  ["Fabricación","Soldadura","Electrodos E7018 — 25 kg","Mantenimiento estructural nave 2"],
  ["Mantenimiento","Lubricantes y químicos","Aceite hidráulico Shell Tellus 46 — 200L","Cambio programado de aceite extrusora"],
  ["Calidad y laboratorio","Equipos de ensayo","Medidor de espesor de aislamiento Megger","Calibración programada del laboratorio"],
  ["Facility","Limpieza y jardinería","Servicio de jardinería externa — mes octubre","Contrato mensual de jardinería"],
  ["Ingeniería","Automatización y control","PLC Allen Bradley CompactLogix 1769","Ampliación línea de extrusión 2"],
  ["Marketing","Material promocional","Brochures técnicos — 500 unidades","Feria Expomina noviembre"],
  ["Administración","Útiles de oficina","Pack útiles oficina — 12 escritorios","Renovación trimestral"],
  ["Mantenimiento","Neumática e hidráulica","Cilindro neumático Festo DSBC-50-200","Falla cilindro envainadora 1"],
  ["Activos industriales","Equipos de proceso","Repuesto cabezal extrusor línea 4","Mantenimiento preventivo programado"],
];

const randPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random()*arr.length)];
const randInt  = (min:number,max:number) => Math.floor(Math.random()*(max-min+1))+min;
const buildDate = (daysAgo:number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0,10);
};

export interface Solicitud {
  id: number;
  prioridad: string;
  tipo: string;
  descripcion: string;
  maquina: string;
  motivo: string;
  familia: string;
  subFamilia: string;
  cantidad: number;
  umedida: string;
  precio: number;
  moneda: string;
  estado: string;
  ordenCompra: string;
  usuarioId: number;
  usuario: string;
  area: string;
  fecha: string;
  comentarios: string;
  tieneImagen: boolean;
}

function genSolicitudes(): Solicitud[] {
  const out: Solicitud[] = [];
  let id = 500;
  for (let i = 0; i < 38; i++){
    const tpl = SAMPLE_DESCRIPTIONS[i % SAMPLE_DESCRIPTIONS.length];
    const [familia, subfamilia, desc, motivo] = tpl;
    const user = randPick(USERS.filter(u => u.rol === "Empleado" || u.rol === "TMLIMA"));
    const prioridad = i < 4 ? "Emergencia" : (i < 12 ? "Urgencia" : "Estándar");
    const estadoRoll = Math.random();
    const estado = i < 3 ? "Pendiente" : estadoRoll < 0.35 ? "Pendiente" : estadoRoll < 0.85 ? "Aprobado" : "Rechazado";
    const moneda = randPick(MONEDAS).v;
    const cantidad = randInt(1, 250);
    const precio = +(randInt(50, 25000) + Math.random()).toFixed(2);
    const tieneOC = estado === "Aprobado" && Math.random() < 0.6;
    out.push({
      id: id++,
      prioridad,
      tipo: randPick(TIPOS),
      descripcion: desc,
      maquina: ["Extrusora L3","Envainadora 1","CNC HAAS","—","Bobinadora 2","Línea 4"][i % 6],
      motivo,
      familia,
      subFamilia: subfamilia,
      cantidad,
      umedida: randPick(UNIDADES),
      precio,
      moneda,
      estado,
      ordenCompra: tieneOC ? `OC-2026-${String(1200 + i).padStart(4,"0")}` : "",
      usuarioId: user.id,
      usuario: `${user.firstname} ${user.lastname}`,
      area: user.area,
      fecha: buildDate(randInt(0, 25)),
      comentarios: estado === "Rechazado" ? "Solicitud fuera de presupuesto del trimestre." : "",
      tieneImagen: Math.random() < 0.55,
    });
  }
  return out;
}

export const SOLICITUDES = genSolicitudes();
