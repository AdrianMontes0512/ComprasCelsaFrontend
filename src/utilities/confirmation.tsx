import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Solicitud {
  id: number;
  prioridad: string;
  sp: string;
  descripcion: string;
  cantidad: string;
  precio: string;
  umedida: string;
  moneda: string;
  estado: string;
  usuarioId: number;
  ordenCompra?: string;
  motivo: string;
  familia: string;
  subFamilia: string;
  comentarios?: string;
  fecha?: string;
  maquina?: string;
  fechaOrden?: string;
  status?: string;
}

const PAGE_SIZE = 14;

const prioridades = ['Emergencia', 'Urgencia', 'Estándar'];
const tipos = ['Producto', 'Servicio'];
const estados = ['Pendiente', 'Aprobado', 'Rechazado'];
const monedas = ['Dolares', 'Soles', 'Euros'];
const unidades = ['unidad', 'litro', 'metro', 'kilo', 'par', 'juego']; 

const familiasYSubfamilias = {
  'Materias primas': ['Cobre y metales', 'Plásticos y polímeros', 'Aislantes y recubrimientos', 'Pantallas y blindajes', 'Rellenos y separadores', 'Material conductor', 'Chaquetas y cubiertas', 'Componentes eléctricos', 'Aditivos y auxiliares'],
  'Mantenimiento': ['Equipos industriales', 'Repuestos y partes', 'Ferretería y herramientas', 'Electricidad industrial', 'Neumática e hidráulica', 'Lubricantes y químicos', 'Elementos de fijación', 'Alquileres de equipos industriales', 'Servicios eléctricos', 'Servicios mecánicos', 'Servicios neumáticos', 'Servicios hidráulicos', 'Mantenimiento preventivo', 'Mantenimiento correctivo', 'Mantenimiento predictivo', 'Servicios integrales por contrato', 'Calibraciones y normativas', 'Servicios técnicos TI'],
  'Fabricación': ['Mecanizado y CNC', 'Corte y plegado', 'Soldadura', 'Componentes metálicos', 'Tratamientos', 'Plásticos técnicos', 'Moldes y matrices'],
  'Ingeniería': ['Proyectos industriales', 'Ingeniería civil', 'Ingeniería eléctrica', 'Ingeniería mecánica', 'Procesos industriales', 'Automatización y control', 'Consultorías técnicas', 'Capacitación técnica'],
  'SSOMA': ['EPP y ropa de trabajo', 'Salud ocupacional', 'Capacitación en seguridad'],
  'Facility': ['Alimentación', 'Limpieza y jardinería', 'Transporte interno', 'Seguridad física', 'Mantenimiento edilicio', 'Servicios auxiliares', 'Servicios de alimentación', 'Limpieza y áreas verdes', 'Apoyo logístico interno', 'Utensilios de cocina y comedor', 'Equipos menores de cocina', 'Suministros de alimentos y bebidas', 'Dispensadores y accesorios', 'Limpieza de kitchenette'],
  'TI': ['Software y licencias', 'Servicios tecnológicos', 'Equipos de cómputo', 'Periféricos de computación', 'Equipos móviles', 'Accesorios tecnológicos', 'Componentes y repuestos TI'],
  'Marketing': ['Material promocional', 'Eventos y ferias', 'Publicidad y medios'],
  'Administración': ['Oficina', 'Útiles de oficina', 'Equipos de oficina', 'Servicios de impresión y copiado', 'Mobiliario', 'Traducción y papelería institucional', 'Producción editorial o gráfica'],
  'Legal': ['Asesoría legal', 'Trámites y permisos', 'Certificaciones y normas'],
  'Recursos Humanos': ['Selección y reclutamiento', 'Beneficios y compensaciones', 'Bienestar y clima laboral', 'Capacitación y desarrollo', 'Evaluación de desempeño', 'Tercerización de personal'],
  'Logística y Transporte': ['Transporte local', 'Transporte internacional', 'Agenciamiento aduanal', 'Gastos portuarios', 'Seguros de carga', 'Logística tercerizada', 'Fletes y maniobras', 'Equipos y accesorios logísticos', 'Identificación y marcaje', 'Embalajes y bobinas', 'Zunchado y protección final', 'Paletizado y despacho'],
  'Proyectos': ['Consultoría de proyectos'],
  'Finanzas y contabilidad': ['Servicios contables y tributarios', 'Seguros'],
  'Legal y cumplimiento': ['Compliance y ética'],
  'Gestión documental': ['Digitalización y archivo'],
  'Sostenibilidad': ['Gestión ambiental', 'Gestión de residuos'],
  'Activos industriales': ['Equipos de proceso', 'Equipos auxiliares de planta', 'Equipos móviles industriales', 'Sistemas de energía y control'],
  'Calidad y laboratorio': ['Equipos de ensayo y medición', 'Equipos de laboratorio físico/químico', 'Calibración y verificación', 'Servicios metrológicos'],
  'Mercadería': ['Cables aac', 'Alambres trolley', 'otros']
}; 

export default function ConfirmationTable() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroId, setFiltroId] = useState('');
  const [usuarios, setUsuarios] = useState<{ [id: number]: string }>({});
  
  // Estados para el modal de orden de compra
  const [showOrdenModal, setShowOrdenModal] = useState(false);
  const [modalOrdenData, setModalOrdenData] = useState<{
    solicitud: Solicitud;
    ordenCompra: string;
    valorOriginal: string;
    inputRef: HTMLInputElement;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Estados para el modal de detalles
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  
  // Estados para edición de categorización
  const [editingCategorizacion, setEditingCategorizacion] = useState(false);
  const [tempFamilia, setTempFamilia] = useState('');
  const [tempSubFamilia, setTempSubFamilia] = useState('');

  // Estados para edición de fecha y comentarios
  const [editingFechaComentarios, setEditingFechaComentarios] = useState(false);
  const [tempFecha, setTempFecha] = useState('');
  const [tempComentarios, setTempComentarios] = useState('');

  // Estados para edición de máquina
  const [editingMaquina, setEditingMaquina] = useState(false);
  const [tempMaquina, setTempMaquina] = useState('');

  // Estados para edición de información comercial
  const [editingComercial, setEditingComercial] = useState(false);
  const [tempCantidad, setTempCantidad] = useState('');
  const [tempPrecio, setTempPrecio] = useState('');
  const [tempUnidad, setTempUnidad] = useState('');
  const [tempMoneda, setTempMoneda] = useState('');

  // Estados para edición de status y fechaOrden
  const [editingStatusFechaOrden, setEditingStatusFechaOrden] = useState(false);
  const [tempStatus, setTempStatus] = useState('');
  const [tempFechaOrden, setTempFechaOrden] = useState('');

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setSolicitudes(data.content || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setSolicitudes([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitudes();
  }, [page]);

  // Filtrado en frontend
  const solicitudesFiltradas = solicitudes.filter(s =>
    (filtroPrioridad ? s.prioridad === filtroPrioridad : true) &&
    (filtroTipo ? s.sp === filtroTipo : true) &&
    (filtroEstado ? s.estado === filtroEstado : true) &&
    (filtroUsuario ? (usuarios[s.usuarioId] || '').toLowerCase().includes(filtroUsuario.toLowerCase()) : true) &&
    (filtroId ? s.id.toString().includes(filtroId) : true)
  );

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Exporta las solicitudes filtradas, mostrando el nombre del usuario (sin la columna Imagen)
    const dataToExport = solicitudesFiltradas.map((s) => ({
      ID: s.id,
      Prioridad: s.prioridad,
      Tipo: s.sp,
      Descripción: s.descripcion,
      Motivo: s.motivo,
      Familia: s.familia,
      Subfamilia: s.subFamilia,
      Cantidad: s.cantidad,
      Precio: s.precio,
      Unidad: s.umedida,
      Moneda: s.moneda,
      Estado: s.estado,
      'Orden de Compra': s.ordenCompra || 'Sin asignar',
      Usuario: usuarios[s.usuarioId] || 'Desconocido',
      // Imagen: `http://192.168.0.113:8080/solicitudes/imagen/${s.id}`, // <-- Quitado del Excel
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'solicitudes.xlsx');
  };

  // Fetch usuarios para la página actual
  useEffect(() => {
    const fetchUsuarios = async () => {
      const ids = Array.from(new Set(solicitudes.map(s => s.usuarioId)));
      const nuevos: { [id: number]: string } = { ...usuarios };
      const token = localStorage.getItem('token');
      await Promise.all(ids.map(async (id) => {
        if (!nuevos[id]) {
          try {
            const res = await fetch(`http://192.168.0.113:8080/user/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            nuevos[id] = `${data.firstname} ${data.lastname}`;
          } catch {
            nuevos[id] = 'Desconocido';
          }
        }
      }));
      setUsuarios(nuevos);
    };
    if (solicitudes.length > 0) fetchUsuarios();
    // eslint-disable-next-line
  }, [solicitudes]);

  // Nueva función para descargar la imagen como PDF
  const descargarImagen = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://192.168.0.113:8080/solicitudes/imagen/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert('No se pudo descargar la imagen');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solicitud_${id}_imagen.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar la imagen');
    }
  };

  // Función para mostrar detalles de la solicitud
  const mostrarDetalles = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setTempFamilia(solicitud.familia || '');
    setTempSubFamilia(solicitud.subFamilia || '');
    setEditingCategorizacion(false);
    setTempFecha(solicitud.fecha || '');
    setTempComentarios(solicitud.comentarios || '');
    setEditingFechaComentarios(false);
    setTempMaquina(solicitud.maquina || '');
    setEditingMaquina(false);
    setTempCantidad(solicitud.cantidad || '');
    setTempPrecio(solicitud.precio || '');
    setTempUnidad(solicitud.umedida || '');
    setTempMoneda(solicitud.moneda || '');
    setEditingComercial(false);
    setTempStatus(solicitud.status || '');
    setTempFechaOrden(solicitud.fechaOrden || '');
    setEditingStatusFechaOrden(false);
    setShowDetailModal(true);
  };

  // Función para iniciar edición de categorización
  const iniciarEdicionCategorizacion = () => {
    setEditingCategorizacion(true);
  };

  // Función para cancelar edición de categorización
  const cancelarEdicionCategorizacion = () => {
    if (selectedSolicitud) {
      setTempFamilia(selectedSolicitud.familia || '');
      setTempSubFamilia(selectedSolicitud.subFamilia || '');
    }
    setEditingCategorizacion(false);
  };

  // Función para guardar cambios de categorización
  const guardarCategorizacion = async () => {
    if (!selectedSolicitud) return;

    const token = localStorage.getItem('token');
    const body = { 
      familia: tempFamilia,
      subFamilia: tempSubFamilia
    };

    try {
      const res = await fetch(`http://192.168.0.113:8080/solicitudes/${selectedSolicitud.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Recargar los datos desde el servidor para obtener la información más actualizada
        const fetchSolicitudes = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await res.json();
            setSolicitudes(data.content || []);
            
            // Actualizar también la solicitud seleccionada con los datos frescos del servidor
            const solicitudActualizada = data.content?.find((s: Solicitud) => s.id === selectedSolicitud.id);
            if (solicitudActualizada) {
              setSelectedSolicitud(solicitudActualizada);
              setTempFamilia(solicitudActualizada.familia || '');
              setTempSubFamilia(solicitudActualizada.subFamilia || '');
            }
          } catch (err) {
            console.error('Error al recargar solicitudes:', err);
          }
        };
        
        // Ejecutar la recarga
        await fetchSolicitudes();
        
        setEditingCategorizacion(false);
        alert('✅ Categorización actualizada correctamente');
      } else {
        const errorText = await res.text();
        alert('❌ Error al actualizar la categorización: ' + errorText);
      }
    } catch (err) {
      alert('❌ Error de conexión al actualizar la categorización');
    }
  };

  // Función para iniciar edición de fecha y comentarios
  const iniciarEdicionFechaComentarios = () => {
    setEditingFechaComentarios(true);
  };

  // Función para cancelar edición de fecha y comentarios
  const cancelarEdicionFechaComentarios = () => {
    if (selectedSolicitud) {
      setTempFecha(selectedSolicitud.fecha || '');
      setTempComentarios(selectedSolicitud.comentarios || '');
    }
    setEditingFechaComentarios(false);
  };

  // Función para guardar cambios de fecha y comentarios
  const guardarFechaComentarios = async () => {
    if (!selectedSolicitud) return;

    const token = localStorage.getItem('token');
    const body = { 
      fecha: tempFecha,
      comentarios: tempComentarios
    };

    try {
      const res = await fetch(`http://192.168.0.113:8080/solicitudes/${selectedSolicitud.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Recargar los datos desde el servidor para obtener la información más actualizada
        const fetchSolicitudes = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await res.json();
            setSolicitudes(data.content || []);
            
            // Actualizar también la solicitud seleccionada con los datos frescos del servidor
            const solicitudActualizada = data.content?.find((s: Solicitud) => s.id === selectedSolicitud.id);
            if (solicitudActualizada) {
              setSelectedSolicitud(solicitudActualizada);
              setTempFecha(solicitudActualizada.fecha || '');
              setTempComentarios(solicitudActualizada.comentarios || '');
            }
          } catch (err) {
            console.error('Error al recargar solicitudes:', err);
          }
        };
        
        // Ejecutar la recarga
        await fetchSolicitudes();
        
        setEditingFechaComentarios(false);
        alert('✅ Fecha y comentarios actualizados correctamente');
      } else {
        const errorText = await res.text();
        alert('❌ Error al actualizar fecha y comentarios: ' + errorText);
      }
    } catch (err) {
      alert('❌ Error de conexión al actualizar fecha y comentarios');
    }
  };

  // Funciones para edición de máquina
  const iniciarEdicionMaquina = () => {
    setEditingMaquina(true);
  };

  const cancelarEdicionMaquina = () => {
    if (selectedSolicitud) {
      setTempMaquina(selectedSolicitud.maquina || '');
    }
    setEditingMaquina(false);
  };

  const guardarMaquina = async () => {
    if (!selectedSolicitud) return;

    const token = localStorage.getItem('token');
    const body = { 
      maquina: tempMaquina
    };

    try {
      const res = await fetch(`http://192.168.0.113:8080/solicitudes/${selectedSolicitud.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Recargar los datos desde el servidor para obtener la información más actualizada
        const fetchSolicitudes = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await res.json();
            setSolicitudes(data.content || []);
            
            // Actualizar también la solicitud seleccionada con los datos frescos del servidor
            const solicitudActualizada = data.content?.find((s: Solicitud) => s.id === selectedSolicitud.id);
            if (solicitudActualizada) {
              setSelectedSolicitud(solicitudActualizada);
              setTempMaquina(solicitudActualizada.maquina || '');
            }
          } catch (err) {
            console.error('Error al recargar solicitudes:', err);
          }
        };
        
        // Ejecutar la recarga
        await fetchSolicitudes();
        
        setEditingMaquina(false);
        alert('✅ Máquina actualizada correctamente');
      } else {
        const errorText = await res.text();
        alert('❌ Error al actualizar la máquina: ' + errorText);
      }
    } catch (err) {
      alert('❌ Error de conexión al actualizar la máquina');
    }
  };

  // Funciones para edición de información comercial
  const iniciarEdicionComercial = () => {
    setEditingComercial(true);
  };

  const cancelarEdicionComercial = () => {
    if (selectedSolicitud) {
      setTempCantidad(selectedSolicitud.cantidad || '');
      setTempPrecio(selectedSolicitud.precio || '');
      setTempUnidad(selectedSolicitud.umedida || '');
      setTempMoneda(selectedSolicitud.moneda || '');
    }
    setEditingComercial(false);
  };

  const guardarComercial = async () => {
    if (!selectedSolicitud) return;

    const token = localStorage.getItem('token');
    const body = { 
      cantidad: tempCantidad,
      precio: tempPrecio,
      umedida: tempUnidad,
      moneda: tempMoneda
    };

    try {
      const res = await fetch(`http://192.168.0.113:8080/solicitudes/${selectedSolicitud.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Recargar los datos desde el servidor para obtener la información más actualizada
        const fetchSolicitudes = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await res.json();
            setSolicitudes(data.content || []);
            
            // Actualizar también la solicitud seleccionada con los datos frescos del servidor
            const solicitudActualizada = data.content?.find((s: Solicitud) => s.id === selectedSolicitud.id);
            if (solicitudActualizada) {
              setSelectedSolicitud(solicitudActualizada);
              setTempCantidad(solicitudActualizada.cantidad || '');
              setTempPrecio(solicitudActualizada.precio || '');
              setTempUnidad(solicitudActualizada.umedida || '');
              setTempMoneda(solicitudActualizada.moneda || '');
            }
          } catch (err) {
            console.error('Error al recargar solicitudes:', err);
          }
        };
        
        // Ejecutar la recarga
        await fetchSolicitudes();
        
        setEditingComercial(false);
        alert('✅ Información comercial actualizada correctamente');
      } else {
        const errorText = await res.text();
        alert('❌ Error al actualizar la información comercial: ' + errorText);
      }
    } catch (err) {
      alert('❌ Error de conexión al actualizar la información comercial');
    }
  };

  // Funciones para edición de status y fechaOrden
  const iniciarEdicionStatusFechaOrden = () => {
    setEditingStatusFechaOrden(true);
  };

  const cancelarEdicionStatusFechaOrden = () => {
    if (selectedSolicitud) {
      setTempStatus(selectedSolicitud.status || '');
      setTempFechaOrden(selectedSolicitud.fechaOrden || '');
    }
    setEditingStatusFechaOrden(false);
  };

  const guardarStatusFechaOrden = async () => {
    if (!selectedSolicitud) return;

    const token = localStorage.getItem('token');
    const body = { 
      status: tempStatus,
      fechaOrden: tempFechaOrden
    };

    try {
      const res = await fetch(`http://192.168.0.113:8080/solicitudes/${selectedSolicitud.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Recargar los datos desde el servidor
        const fetchSolicitudes = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await res.json();
            setSolicitudes(data.content || []);
            
            const solicitudActualizada = data.content?.find((s: Solicitud) => s.id === selectedSolicitud.id);
            if (solicitudActualizada) {
              setSelectedSolicitud(solicitudActualizada);
              setTempStatus(solicitudActualizada.status || '');
              setTempFechaOrden(solicitudActualizada.fechaOrden || '');
            }
          } catch (err) {
            console.error('Error al recargar solicitudes:', err);
          }
        };
        
        await fetchSolicitudes();
        
        setEditingStatusFechaOrden(false);
        alert('✅ Status y Fecha de Orden actualizados correctamente');
      } else {
        const errorText = await res.text();
        alert('❌ Error al actualizar: ' + errorText);
      }
    } catch (err) {
      alert('❌ Error de conexión al actualizar');
    }
  };

  return (
    <div style={{ 
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      padding: '1rem', 
      width: '100vw', 
      minWidth: '100vw',
      overflowX: 'auto',
      overflowY: 'auto',
      boxSizing: 'border-box',
      margin: 0
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2.5rem',
          marginTop: '0.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2
            style={{
              color: '#fff',
              fontSize: '2.6rem',
              fontWeight: 700,
              letterSpacing: '2px',
              textShadow: '0 2px 8px rgba(0,0,0,0.18)',
              margin: 0,
            }}
          >
            📋 Gestión de Solicitudes
          </h2>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 600,
            backdropFilter: 'blur(10px)'
          }}>
            Total: {solicitudesFiltradas.length} solicitudes
          </div>
        </div>
        <button
          onClick={exportToExcel}
          style={{
            background: 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.8rem 1.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(247, 51, 23, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(247, 51, 23, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(247, 51, 23, 0.3)';
          }}
        >
          📊 Exportar a Excel
        </button>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        justifyContent: 'center',
        flexWrap: 'wrap' 
      }}>
        <select
          value={filtroPrioridad}
          onChange={e => setFiltroPrioridad(e.target.value)}
          style={{ 
            padding: '0.6rem 1rem', 
            borderRadius: '10px',
            border: '2px solid #e5e7eb',
            fontSize: '0.9rem',
            fontWeight: 500,
            backgroundColor: '#fff',
            color: '#374151',
            outline: 'none',
            transition: 'all 0.2s ease',
            minWidth: '150px'
          }}
        >
          <option value="">🔥 Todas las prioridades</option>
          {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          style={{ 
            padding: '0.6rem 1rem', 
            borderRadius: '10px',
            border: '2px solid #e5e7eb',
            fontSize: '0.9rem',
            fontWeight: 500,
            backgroundColor: '#fff',
            color: '#374151',
            outline: 'none',
            transition: 'all 0.2s ease',
            minWidth: '150px'
          }}
        >
          <option value="">📦 Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{ 
            padding: '0.6rem 1rem', 
            borderRadius: '10px',
            border: '2px solid #e5e7eb',
            fontSize: '0.9rem',
            fontWeight: 500,
            backgroundColor: '#fff',
            color: '#374151',
            outline: 'none',
            transition: 'all 0.2s ease',
            minWidth: '150px'
          }}
        >
          <option value="">📊 Todos los estados</option>
          {estados.map(est => <option key={est} value={est}>{est}</option>)}
        </select>
        <input
          type="text"
          placeholder="👤 Buscar por usuario"
          value={filtroUsuario}
          onChange={e => setFiltroUsuario(e.target.value)}
          style={{ 
            padding: '0.6rem 1rem', 
            borderRadius: '10px',
            border: '2px solid #e5e7eb',
            fontSize: '0.9rem',
            fontWeight: 500,
            backgroundColor: '#fff',
            color: '#374151',
            outline: 'none',
            transition: 'all 0.2s ease',
            minWidth: '150px'
          }}
        />
        <input
          type="text"
          placeholder="🆔 Buscar por ID"
          value={filtroId}
          onChange={e => setFiltroId(e.target.value)}
          style={{ 
            padding: '0.6rem 1rem', 
            borderRadius: '10px',
            border: '2px solid #e5e7eb',
            fontSize: '0.9rem',
            fontWeight: 500,
            backgroundColor: '#fff',
            color: '#374151',
            outline: 'none',
            transition: 'all 0.2s ease',
            minWidth: '150px'
          }}
        />
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: '100%',
              tableLayout: 'fixed',
              background: '#fff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #f1f5f9'
            }}
          >
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)', color: '#fff' }}>
                <th style={thStyle}>🆔 </th>
                <th style={thStyle}>🔥 Prioridad</th>
                <th style={thStyle}>📦 Tipo</th>
                <th style={thStyle}>📝 Descripción</th>
                <th style={thStyle}>🔢 Cantidad</th>
                <th style={thStyle}>💰 Importe Referencial</th>
                <th style={thStyle}>📏 Unidad</th>
                <th style={thStyle}>Moneda</th>
                <th style={thStyle}>📊 Estado</th>
                <th style={thStyle}>Orden de Compra</th>
                <th style={thStyle}>👤 Usuario</th>
                <th style={thStyle}>🖼️ Archivo</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((s, index) => (
                <tr key={s.id} style={{ 
                  textAlign: 'center', 
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                >
                  <td style={tdStyle}>
                    <button
                      onClick={() => mostrarDetalles(s)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontWeight: 600,
                        color: '#3b82f6',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.color = '#1d4ed8';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      title="Ver detalles de la solicitud"
                    >
                      RQ{s.id}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: 
                        s.prioridad === 'Emergencia' ? '#dc2626' : 
                        s.prioridad === 'Urgencia' ? '#f59e0b' : '#22c55e',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap' as const,
                      display: 'inline-block'
                    }}>
                      {s.prioridad}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: s.sp === 'Producto' ? '#e0f2fe' : '#f3e8ff',
                      color: s.sp === 'Producto' ? '#0369a1' : '#7c3aed',
                      border: `1px solid ${s.sp === 'Producto' ? '#0369a1' : '#7c3aed'}`,
                    }}>
                      {s.sp}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '0.85rem',
                      color: '#374151',
                      lineHeight: '1.3'
                    }} title={s.descripcion}>
                      {s.descripcion}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontWeight: 600,
                      color: '#059669',
                      backgroundColor: '#d1fae5',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      {s.cantidad}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontWeight: 600,
                      color: '#1f2937',
                      fontSize: '1rem'
                    }}>
                      {parseFloat(s.precio).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td style={tdStyle}>{s.umedida}</td>
                  <td style={tdStyle}>{s.moneda}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: 
                        s.estado === 'Pendiente' ? '#f59e0b' : 
                        s.estado === 'Aprobado' ? '#22c55e' : '#dc2626',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.5px'
                    }}>
                      {s.estado}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {s.estado === 'Aprobado' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <input
                          type="text"
                          placeholder="ID Orden"
                          defaultValue={s.ordenCompra || ''}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const nuevoValor = e.currentTarget.value.trim();
                              
                              // Si el valor no cambió, no hacer nada
                              if (nuevoValor === (s.ordenCompra || '')) return;
                              
                              // Mostrar modal de confirmación
                              const inputRef = e.currentTarget as HTMLInputElement;
                              const valorOriginal = s.ordenCompra || '';
                              setModalOrdenData({
                                solicitud: s,
                                ordenCompra: nuevoValor,
                                valorOriginal: valorOriginal,
                                inputRef: inputRef,
                                onConfirm: async () => {
                                  
                                  const token = localStorage.getItem('token');
                                  
                                  const body = { ordenCompra: nuevoValor };
                                  
                                  try {
                                    
                                    const res = await fetch(`http://192.168.0.113:8080/solicitudes/${s.id}`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify(body),
                                    });
                                    

                                    
                                    if (res.ok) {
                                      
                                      // Recargar los datos desde el servidor para obtener la información más actualizada
                                      const fetchSolicitudes = async () => {
                                        try {
                                          const token = localStorage.getItem('token');
                                          const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                            },
                                          });
                                          const data = await res.json();
                                          setSolicitudes(data.content || []);
                                        } catch (err) {
                                          console.error('Error al recargar solicitudes:', err);
                                        }
                                      };
                                      
                                      // Ejecutar la recarga
                                      await fetchSolicitudes();
                                      
                                    } else {
                                      const errorText = await res.text();
                                      console.error('❌ Error en response:', errorText);
                                      console.error('❌ Status code:', res.status);
                                      alert('❌ Error al actualizar orden de compra: ' + errorText);
                                    }
                                  } catch (err) {
                                    console.error('❌ Error de conexión:', err);
                                    alert('❌ Error de conexión');
                                  }
                                  setShowOrdenModal(false);
                                  setModalOrdenData(null);
                                },
                                onCancel: () => {
                                // Revertir el input al valor original usando la referencia guardada
                                inputRef.value = valorOriginal;
                                setShowOrdenModal(false);
                                setModalOrdenData(null);
                              }
                              });
                              setShowOrdenModal(true);
                            }
                          }}
                          onBlur={(e) => {
                            // Primero aplicar estilos
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.boxShadow = 'none';
                            
                            // Luego verificar si hay cambios
                            const nuevoValor = e.currentTarget.value.trim();
                            
                            // Si el valor no cambió, no hacer nada
                            if (nuevoValor === (s.ordenCompra || '')) return;
                            
                            // Mostrar modal de confirmación
                            const inputRef = e.currentTarget as HTMLInputElement;
                            const valorOriginal = s.ordenCompra || '';
                            setModalOrdenData({
                              solicitud: s,
                              ordenCompra: nuevoValor,
                              valorOriginal: valorOriginal,
                              inputRef: inputRef,
                              onConfirm: async () => {
                                
                                const token = localStorage.getItem('token');
                                
                                const body = { ordenCompra: nuevoValor };
                                
                                try {
                                  
                                  const res = await fetch(`http://192.168.0.113:8080/solicitudes/${s.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify(body),
                                  });
                                  

                                  
                                  if (res.ok) {
                                    
                                    // Recargar los datos desde el servidor para obtener la información más actualizada
                                    const fetchSolicitudes = async () => {
                                      try {
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`http://192.168.0.113:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                          },
                                        });
                                        const data = await res.json();
                                        setSolicitudes(data.content || []);
                                      } catch (err) {
                                        console.error('Error al recargar solicitudes:', err);
                                      }
                                    };
                                    
                                    // Ejecutar la recarga
                                    await fetchSolicitudes();
                                    
                                  } else {
                                    const errorText = await res.text();
                                    console.error('❌ Error en response:', errorText);
                                    console.error('❌ Status code:', res.status);
                                    alert('❌ Error al actualizar orden de compra: ' + errorText);
                                  }
                                } catch (err) {
                                  console.error('❌ Error de conexión:', err);
                                  alert('❌ Error de conexión');
                                }
                                setShowOrdenModal(false);
                                setModalOrdenData(null);
                              },
                              onCancel: () => {
                                // Revertir el input al valor original usando la referencia guardada
                                inputRef.value = valorOriginal;
                                setShowOrdenModal(false);
                                setModalOrdenData(null);
                              }
                            });
                            setShowOrdenModal(true);
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            backgroundColor: '#fff',
                            color: '#374151',
                            outline: 'none',
                            width: '120px',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = '#f73317';
                            e.target.style.boxShadow = '0 0 0 3px rgba(247, 51, 23, 0.1)';
                          }}
                        />
                      </div>
                    ) : (
                      <span style={{
                        color: '#9ca3af',
                        fontSize: '0.85rem',
                        fontStyle: 'italic'
                      }}>
                        Falta de aprobación
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>{usuarios[s.usuarioId] || 'Cargando...'}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => descargarImagen(s.id)}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        margin: '0 auto'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      📥 Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Paginación */}
          <div style={{ 
            marginTop: '2rem', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: page === 1 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                color: page === 1 ? 'rgba(255, 255, 255, 0.6)' : '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                boxShadow: page === 1 
                  ? 'none' 
                  : '0 4px 15px rgba(247, 51, 23, 0.3)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
                minWidth: '120px'
              }}
              onMouseOver={e => {
                if (page !== 1) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(247, 51, 23, 0.4)';
                }
              }}
              onMouseOut={e => {
                if (page !== 1) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(247, 51, 23, 0.3)';
                }
              }}
            >
              ← Anterior
            </button>
            
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#1f2937',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              minWidth: '150px',
              textAlign: 'center' as const
            }}>
              Página {page} de {totalPages}
            </div>
            
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: page === totalPages 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                color: page === totalPages ? 'rgba(255, 255, 255, 0.6)' : '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                boxShadow: page === totalPages 
                  ? 'none' 
                  : '0 4px 15px rgba(247, 51, 23, 0.3)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
                minWidth: '120px'
              }}
              onMouseOver={e => {
                if (page !== totalPages) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(247, 51, 23, 0.4)';
                }
              }}
              onMouseOut={e => {
                if (page !== totalPages) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(247, 51, 23, 0.3)';
                }
              }}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* Modal de Confirmación para Orden de Compra */}
      {showOrdenModal && modalOrdenData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            maxWidth: '500px',
            width: '90%',
            transform: 'scale(1)',
            animation: 'modalAppear 0.3s ease-out'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                🛒
              </div>
              <h3 style={{
                color: '#1f2937',
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                Confirmar Orden de Compra
              </h3>
            </div>

            <div style={{
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '2px solid #0ea5e9'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
                <div style={{ fontWeight: 600, color: '#0c4a6e' }}>
                  Asignar ID de Orden de Compra
                </div>
              </div>
              
              <div style={{ color: '#0369a1', lineHeight: '1.5', marginBottom: '1rem' }}>
                Está a punto de asignar el ID de orden de compra <strong>"{modalOrdenData.ordenCompra}"</strong> a la solicitud RQ{modalOrdenData.solicitud.id}.
              </div>

              <div style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e0f2fe'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>Solicitud: </span>
                  <span style={{ 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '6px',
                    fontWeight: 600
                  }}>
                    RQ{modalOrdenData.solicitud.id}
                  </span>
                </div>
                
                <div>
                  <span style={{ fontWeight: 600, color: '#374151' }}>Descripción: </span>
                  <span style={{ color: '#6b7280' }}>
                    {modalOrdenData.solicitud.descripcion}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={modalOrdenData.onCancel}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                ❌ Cancelar
              </button>
              
              <button
                onClick={modalOrdenData.onConfirm}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.3)';
                }}
              >
                ✅ Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Solicitud */}
      {showDetailModal && selectedSolicitud && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            maxWidth: '480px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header del modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  background: '#f73317',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  RQ{selectedSolicitud.id}
                </div>
                <h3 style={{
                  color: '#1f2937',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Detalles de Solicitud
                </h3>
              </div>
              
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '1.2rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#e5e7eb';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                ✕
              </button>
            </div>

            {/* Contenido del modal */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {/* NUEVO: Status y Fecha Orden - PRIMERO */}
              <div style={{
                background: '#fef2f2',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #f73317'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    color: '#991b1b',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    📦 Status y Fecha de Orden
                  </h4>
                  
                  {!editingStatusFechaOrden ? (
                    <button
                      onClick={iniciarEdicionStatusFechaOrden}
                      style={{
                        background: '#f73317',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#e02b0f';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#f73317';
                      }}
                    >
                      ✏️ Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={guardarStatusFechaOrden}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✅ Guardar
                      </button>
                      <button
                        onClick={cancelarEdicionStatusFechaOrden}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#991b1b',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Status
                    </div>
                    {!editingStatusFechaOrden ? (
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#7f1d1d',
                        padding: '0.5rem',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        fontStyle: selectedSolicitud.status ? 'normal' : 'italic'
                      }}>
                        {selectedSolicitud.status ? selectedSolicitud.status.replace('_', ' ') : 'No especificado'}
                      </div>
                    ) : (
                      <select
                        value={tempStatus}
                        onChange={(e) => setTempStatus(e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '2px solid #f73317',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          width: '100%'
                        }}
                      >
                        <option value="">Seleccionar status</option>
                        <option value="Entregado">Entregado</option>
                        <option value="En_Proceso">En Proceso</option>
                        <option value="Parcialmente_Entregado">Parcialmente Entregado</option>
                      </select>
                    )}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#991b1b',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Fecha Orden
                    </div>
                    {!editingStatusFechaOrden ? (
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#7f1d1d',
                        padding: '0.5rem',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        fontStyle: selectedSolicitud.fechaOrden ? 'normal' : 'italic'
                      }}>
                        {selectedSolicitud.fechaOrden ? (
                          new Date(selectedSolicitud.fechaOrden).toLocaleDateString('es-PE')
                        ) : (
                          'No especificada'
                        )}
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={tempFechaOrden}
                        onChange={(e) => setTempFechaOrden(e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '2px solid #f73317',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          width: '100%'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Estado y Prioridad */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1rem',
                justifyContent: 'center'
              }}>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: 
                    selectedSolicitud.estado === 'Pendiente' ? '#f59e0b' : 
                    selectedSolicitud.estado === 'Aprobado' ? '#22c55e' : '#dc2626',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {selectedSolicitud.estado}
                </span>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: 
                    selectedSolicitud.prioridad === 'Emergencia' ? '#dc2626' : 
                    selectedSolicitud.prioridad === 'Urgencia' ? '#f59e0b' : '#22c55e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {selectedSolicitud.prioridad}
                </span>
              </div>

              {/* Información principal */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{
                  margin: '0 0 0.75rem 0',
                  color: '#1f2937',
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  📝 Información Principal
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Tipo
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#1f2937'
                    }}>
                      {selectedSolicitud.sp}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Usuario
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#1f2937'
                    }}>
                      {usuarios[selectedSolicitud.usuarioId] || 'Cargando...'}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    marginBottom: '0.25rem'
                  }}>
                    Descripción
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#374151',
                    lineHeight: '1.5',
                    padding: '0.75rem',
                    background: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {selectedSolicitud.descripcion}
                  </div>
                </div>
              </div>

              {/* Información de categorización */}
              <div style={{
                background: '#fef3c7',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #fbbf24'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    color: '#92400e',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    🏷️ Categorización
                  </h4>
                  
                  {!editingCategorizacion ? (
                    <button
                      onClick={iniciarEdicionCategorizacion}
                      style={{
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#d97706';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#f59e0b';
                      }}
                    >
                      ✏️ Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={guardarCategorizacion}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✅ Guardar
                      </button>
                      <button
                        onClick={cancelarEdicionCategorizacion}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#92400e',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Familia
                    </div>
                    {!editingCategorizacion ? (
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#78350f'
                      }}>
                        {selectedSolicitud.familia || 'No especificado'}
                      </div>
                    ) : (
                      <select
                        value={tempFamilia}
                        onChange={(e) => {
                          setTempFamilia(e.target.value);
                          setTempSubFamilia(''); // Reset subfamilia when familia changes
                        }}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '2px solid #fbbf24',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          width: '100%'
                        }}
                      >
                        <option value="">Seleccionar familia</option>
                        {Object.keys(familiasYSubfamilias).map(familia => (
                          <option key={familia} value={familia}>{familia}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#92400e',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Subfamilia
                    </div>
                    {!editingCategorizacion ? (
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#78350f'
                      }}>
                        {selectedSolicitud.subFamilia || 'No especificado'}
                      </div>
                    ) : (
                      <select
                        value={tempSubFamilia}
                        onChange={(e) => setTempSubFamilia(e.target.value)}
                        disabled={!tempFamilia}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '2px solid #fbbf24',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          backgroundColor: tempFamilia ? '#fff' : '#f9fafb',
                          color: tempFamilia ? '#374151' : '#9ca3af',
                          outline: 'none',
                          width: '100%',
                          cursor: tempFamilia ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <option value="">Seleccionar subfamilia</option>
                        {tempFamilia && familiasYSubfamilias[tempFamilia as keyof typeof familiasYSubfamilias]?.map(subfamilia => (
                          <option key={subfamilia} value={subfamilia}>{subfamilia}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#92400e',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    marginBottom: '0.25rem'
                  }}>
                    Motivo
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#78350f',
                    lineHeight: '1.5',
                    fontStyle: selectedSolicitud.motivo ? 'normal' : 'italic'
                  }}>
                    {selectedSolicitud.motivo || 'No especificado'}
                  </div>
                </div>
              </div>

              {/* Información de máquina */}
              <div style={{
                background: '#f0fdf4',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #22c55e'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    color: '#166534',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    🔧 Máquina
                  </h4>
                  
                  {!editingMaquina ? (
                    <button
                      onClick={iniciarEdicionMaquina}
                      style={{
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#16a34a';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#22c55e';
                      }}
                    >
                      ✏️ Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={guardarMaquina}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✅ Guardar
                      </button>
                      <button
                        onClick={cancelarEdicionMaquina}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#166534',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    marginBottom: '0.25rem'
                  }}>
                    Máquina Asignada
                  </div>
                  {!editingMaquina ? (
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#15803d',
                      fontStyle: selectedSolicitud.maquina ? 'normal' : 'italic'
                    }}>
                      {selectedSolicitud.maquina || 'No especificado'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={tempMaquina}
                      onChange={e => setTempMaquina(e.target.value)}
                      placeholder="Ingrese el nombre de la máquina"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                        fontWeight: 500,
                        backgroundColor: '#fff',
                        color: '#374151',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#22c55e';
                        e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Información comercial */}
              <div style={{
                background: '#f0f9ff',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    color: '#0c4a6e',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    💰 Información Comercial
                  </h4>
                  
                  {!editingComercial ? (
                    <button
                      onClick={iniciarEdicionComercial}
                      style={{
                        background: '#0ea5e9',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#0284c7';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#0ea5e9';
                      }}
                    >
                      ✏️ Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={guardarComercial}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✅ Guardar
                      </button>
                      <button
                        onClick={cancelarEdicionComercial}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#0c4a6e',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Cantidad
                    </div>
                    {!editingComercial ? (
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#059669'
                      }}>
                        {selectedSolicitud.cantidad}
                      </div>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={tempCantidad}
                        onChange={e => setTempCantidad(e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '1rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = '#0ea5e9';
                          e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    )}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#0c4a6e',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Unidad
                    </div>
                    {!editingComercial ? (
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#0369a1'
                      }}>
                        {selectedSolicitud.umedida}
                      </div>
                    ) : (
                      <select
                        value={tempUnidad}
                        onChange={e => setTempUnidad(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '1rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = '#0ea5e9';
                          e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Seleccionar unidad</option>
                        {unidades.map(unidad => (
                          <option key={unidad} value={unidad}>{unidad}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#0c4a6e',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Moneda
                    </div>
                    {!editingComercial ? (
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#0369a1'
                      }}>
                        {selectedSolicitud.moneda}
                      </div>
                    ) : (
                      <select
                        value={tempMoneda}
                        onChange={e => setTempMoneda(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '1rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = '#0ea5e9';
                          e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Seleccionar moneda</option>
                        {monedas.map(moneda => (
                          <option key={moneda} value={moneda}>{moneda}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e0f2fe',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#0c4a6e',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    marginBottom: '0.25rem'
                  }}>
                    Precio Total
                  </div>
                  {!editingComercial ? (
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#059669'
                    }}>
                      {parseFloat(selectedSolicitud.precio).toLocaleString('es-PE', { 
                        minimumFractionDigits: 2 
                      })} {selectedSolicitud.moneda}
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      value={tempPrecio}
                      onChange={e => setTempPrecio(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        backgroundColor: '#fff',
                        color: '#374151',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#0ea5e9';
                        e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Orden de compra si existe */}
              {selectedSolicitud.ordenCompra && (
                <div style={{
                  background: '#dcfce7',
                  borderRadius: '10px',
                  padding: '1rem',
                  border: '1px solid #22c55e'
                }}>
                  <h4 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#166534',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    🛒 Orden de Compra
                  </h4>
                  
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#059669',
                    textAlign: 'center',
                    padding: '0.75rem',
                    background: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    {selectedSolicitud.ordenCompra}
                  </div>
                </div>
              )}

              {/* Fecha y Comentarios para solicitudes aprobadas */}
              {selectedSolicitud.estado === 'Aprobado' && (
                <div style={{
                  background: '#f0f4ff',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginTop: '1rem',
                  border: '1px solid #6366f1'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <h4 style={{
                      margin: 0,
                      color: '#3730a3',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}>
                      📅 Fecha y Comentarios
                    </h4>
                    
                    {!editingFechaComentarios ? (
                      <button
                        onClick={iniciarEdicionFechaComentarios}
                        style={{
                          background: '#6366f1',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#4f46e5';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#6366f1';
                        }}
                      >
                        ✏️ Editar
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={guardarFechaComentarios}
                          style={{
                            background: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ✅ Guardar
                        </button>
                        <button
                          onClick={cancelarEdicionFechaComentarios}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#3730a3',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Fecha
                    </div>
                    {!editingFechaComentarios ? (
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#1e1b4b',
                        padding: '0.5rem',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe'
                      }}>
                        {selectedSolicitud.fecha ? (
                          new Date(selectedSolicitud.fecha).toLocaleDateString('es-PE')
                        ) : (
                          'No especificada'
                        )}
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={tempFecha}
                        onChange={(e) => setTempFecha(e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '2px solid #6366f1',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          width: '100%'
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#3730a3',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      Comentarios
                    </div>
                    {!editingFechaComentarios ? (
                      <div style={{
                        fontSize: '1rem',
                        color: '#1e1b4b',
                        lineHeight: '1.5',
                        padding: '0.75rem',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe',
                        minHeight: '60px',
                        fontStyle: selectedSolicitud.comentarios ? 'normal' : 'italic'
                      }}>
                        {selectedSolicitud.comentarios || 'Sin comentarios'}
                      </div>
                    ) : (
                      <textarea
                        value={tempComentarios}
                        onChange={(e) => setTempComentarios(e.target.value)}
                        placeholder="Ingrese comentarios sobre la solicitud..."
                        style={{
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '2px solid #6366f1',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          color: '#374151',
                          outline: 'none',
                          width: '100%',
                          minHeight: '80px',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes modalAppear {
            0% { 
              transform: scale(0.8);
              opacity: 0;
            }
            100% { 
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '1rem 0.5rem',
  borderBottom: '2px solid rgba(255,255,255,0.2)',
  fontWeight: 700,
  fontSize: '0.8rem',
  background: 'transparent',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  width: 'auto'
};

const tdStyle: React.CSSProperties = {
  padding: '0.8rem 0.5rem',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '0.8rem',
  background: 'transparent',
  verticalAlign: 'middle' as const,
  wordWrap: 'break-word' as const,
  overflow: 'hidden'
};