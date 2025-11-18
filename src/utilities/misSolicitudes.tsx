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
  status?: string;
  fechaOrden?: string;
}

const PAGE_SIZE = 14;

const prioridades = ['Emergencia', 'Urgencia', 'Estándar'];
const tipos = ['Producto', 'Servicio'];
const estados = ['Pendiente', 'Aprobado', 'Rechazado'];

export default function MySolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0); // AGREGAR este estado
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroId, setFiltroId] = useState('');
  const [usuarios, setUsuarios] = useState<{ [id: number]: string }>({});

  // Estados para el modal de detalles (solo lectura)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        console.log('🔍 Cargando solicitudes del usuario:', userId);
        
        // Usar el endpoint del usuario autenticado CON paginación
        const res = await fetch(`http://192.168.0.113:8080/solicitudes/usuario/${userId}?page=${page - 1}&size=${PAGE_SIZE}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('📦 Solicitudes del usuario recibidas:', data);
          
          // Manejar la estructura de paginación del backend
          if (data.content && Array.isArray(data.content)) {
            setSolicitudes(data.content);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || 0); // AGREGAR esta línea
            console.log('📊 Total de páginas:', data.totalPages);
            console.log('📊 Total de elementos:', data.totalElements);
            console.log('📊 Número de elementos en esta página:', data.numberOfElements);
          } else {
            // Fallback si no tiene estructura paginada
            setSolicitudes(Array.isArray(data) ? data : []);
            setTotalPages(1);
            setTotalElements(0); // AGREGAR esta línea
          }
        } else {
          console.error('Error al cargar solicitudes:', res.status);
          setSolicitudes([]);
          setTotalPages(1);
          setTotalElements(0); // AGREGAR esta línea
        }
      } catch (err) {
        console.error('❌ Error al cargar solicitudes del usuario:', err);
        setSolicitudes([]);
        setTotalPages(1);
        setTotalElements(0); // AGREGAR esta línea
      } finally {
        setLoading(false);
      }
    };
    
    fetchSolicitudes();
  }, [page]); // Agregar dependencia de page para recargar cuando cambie la página

  // AGREGAR: Resetear página cuando cambien los filtros
  useEffect(() => {
    setPage(1);
  }, [filtroPrioridad, filtroTipo, filtroEstado, filtroId]);

  // CAMBIAR: Ahora NO necesitamos filtrado ni paginación local
  // porque el backend ya maneja la paginación
  const solicitudesFiltradas = solicitudes.filter(s =>
    (filtroPrioridad ? s.prioridad === filtroPrioridad : true) &&
    (filtroTipo ? s.sp === filtroTipo : true) &&
    (filtroEstado ? s.estado === filtroEstado : true) &&
    (filtroId ? s.id.toString().includes(filtroId) : true)
  );

  // CAMBIAR: Usar directamente las solicitudes filtradas sin paginación local
  // porque el backend ya paginó
  const solicitudesPaginadas = solicitudesFiltradas;

  // CAMBIAR: Calcular el total de páginas en base a las solicitudes filtradas
  const totalPagesCalculated = Math.ceil(solicitudesFiltradas.length / PAGE_SIZE);
  
  // Si hay filtros activos, usar paginación local, sino usar la del backend
  const finalTotalPages = (filtroPrioridad || filtroTipo || filtroEstado || filtroId) 
    ? totalPagesCalculated 
    : totalPages;

  // Función para exportar a Excel
  const exportToExcel = () => {
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
      'Fecha Solicitud': s.fecha ? new Date(s.fecha).toLocaleDateString('es-PE') : 'Sin fecha',
      Moneda: s.moneda,
      Estado: s.estado,
      'Orden de Compra': s.ordenCompra || 'Sin asignar',
      Máquina: s.maquina || 'No especificada',
      Fecha: s.fecha || 'No especificada',
      Comentarios: s.comentarios || 'Sin comentarios'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mis Solicitudes');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'mis_solicitudes.xlsx');
  };

  // Fetch usuarios para mostrar nombres
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
  }, [solicitudes]);

  // Nueva función para descargar la imagen como PDF
  const descargarImagen = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      console.log('📥 Iniciando descarga de PDF para solicitud:', id);
      
      const res = await fetch(`http://192.168.0.113:8080/solicitudes/imagen/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error('❌ Error en la respuesta del servidor:', res.status);
        alert('No se pudo descargar el archivo PDF');
        return;
      }
      
      const blob = await res.blob();
      console.log('📦 Blob recibido, tipo:', blob.type, 'tamaño:', blob.size);
      
      // Crear URL para el blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = `solicitud_RQ${id}.pdf`; // Forzar extensión .pdf
      a.style.display = 'none';
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Limpiar URL del blob
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Descarga PDF completada para solicitud:', id);
      
    } catch (error) {
      console.error('❌ Error al descargar PDF:', error);
      alert('Error al descargar el archivo PDF');
    }
  };

  // Función para mostrar detalles de la solicitud (solo lectura)
  const mostrarDetalles = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowDetailModal(true);
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
            📋 Mis Solicitudes
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
            {/* CAMBIAR: Mostrar el total correcto usando totalElements */}
            Total: {(filtroPrioridad || filtroTipo || filtroEstado || filtroId) 
              ? `${solicitudesFiltradas.length} (filtradas de ${totalElements})` 
              : `${totalElements}`} solicitudes
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

      {/* Filtros - sin filtro de usuario ya que solo ve sus propias solicitudes */}
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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
          color: '#fff',
          fontSize: '1.2rem'
        }}>
          🔄 Cargando mis solicitudes...
        </div>
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
                <th style={thStyle}>🆔 ID</th>
                <th style={thStyle}>🔥 Prioridad</th>
                <th style={thStyle}>📦 Tipo</th>
                <th style={thStyle}>📝 Descripción</th>
                <th style={thStyle}>🔢 Cantidad</th>
                <th style={thStyle}>💰 Precio</th>
                <th style={thStyle}>📅 Fecha Solicitud</th>
                <th style={thStyle}>💱 Moneda</th>
                <th style={thStyle}>📊 Estado</th>
                <th style={thStyle}>🛒 Orden</th>
                <th style={thStyle}>🖼️ Archivo</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesPaginadas.map((s, index) => (
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
                  <td style={tdStyle}>
                    <span style={{
                      fontWeight: 500,
                      color: '#6b7280',
                      fontSize: '0.85rem'
                    }}>
                      {s.fecha ? new Date(s.fecha).toLocaleDateString('es-PE') : 'Sin fecha'}
                    </span>
                  </td>
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
                    {s.ordenCompra ? (
                      <span style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        border: '1px solid #22c55e'
                      }}>
                        {s.ordenCompra}
                      </span>
                    ) : (
                      <span style={{
                        color: '#9ca3af',
                        fontSize: '0.85rem',
                        fontStyle: 'italic'
                      }}>
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => descargarImagen(s.id)}
                      style={{
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', // Cambiar a rojo para PDF
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)', // Sombra roja
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        margin: '0 auto'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
                      }}
                      title="Descargar archivo PDF de la solicitud"
                    >
                      📄 PDF
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
              onClick={() => {
                if (filtroPrioridad || filtroTipo || filtroEstado || filtroId) {
                  // Paginación local para filtros
                  setPage((p) => Math.max(1, p - 1));
                } else {
                  // Paginación del backend
                  setPage((p) => Math.max(1, p - 1));
                }
              }}
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
              {/* CAMBIAR: Mostrar la paginación correcta */}
              Página {page} de {finalTotalPages || 1}
            </div>
            
            <button
              onClick={() => {
                if (filtroPrioridad || filtroTipo || filtroEstado || filtroId) {
                  // Paginación local para filtros
                  setPage((p) => Math.min(totalPagesCalculated || 1, p + 1));
                } else {
                  // Paginación del backend
                  setPage((p) => Math.min(totalPages || 1, p + 1));
                }
              }}
              disabled={page === finalTotalPages}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: page === finalTotalPages 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                color: page === finalTotalPages ? 'rgba(255, 255, 255, 0.6)' : '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: page === finalTotalPages ? 'not-allowed' : 'pointer',
                boxShadow: page === finalTotalPages 
                  ? 'none' 
                  : '0 4px 15px rgba(247, 51, 23, 0.3)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
                minWidth: '120px'
              }}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* Modal de Detalles de Solicitud - SOLO LECTURA */}
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
                  Detalles de Mi Solicitud
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

            {/* Contenido del modal - SOLO LECTURA */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {/* Status y Fecha Orden - SOLO LECTURA - SIEMPRE VISIBLE */}
              <div style={{
                background: '#fef2f2',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #f73317'
              }}>
                <h4 style={{
                  margin: '0 0 0.75rem 0',
                  color: '#991b1b',
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  📦 Status y Fecha de Orden
                </h4>
                
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

              {/* Información de categorización - SOLO LECTURA */}
              <div style={{
                background: '#fef3c7',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #fbbf24'
              }}>
                <h4 style={{
                  margin: '0 0 0.75rem 0',
                  color: '#92400e',
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  🏷️ Categorización
                </h4>
                
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
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#78350f'
                    }}>
                      {selectedSolicitud.familia || 'No especificado'}
                    </div>
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
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#78350f'
                    }}>
                      {selectedSolicitud.subFamilia || 'No especificado'}
                    </div>
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

              {/* Información de máquina - SOLO LECTURA */}
              {selectedSolicitud.maquina && (
                <div style={{
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: '1px solid #22c55e'
                }}>
                  <h4 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#166534',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    🔧 Máquina
                  </h4>

                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#15803d'
                  }}>
                    {selectedSolicitud.maquina}
                  </div>
                </div>
              )}

              {/* Información comercial - SOLO LECTURA */}
              <div style={{
                background: '#f0f9ff',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #0ea5e9'
              }}>
                <h4 style={{
                  margin: '0 0 0.75rem 0',
                  color: '#0c4a6e',
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  💰 Información Comercial
                </h4>
                
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
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#059669'
                    }}>
                      {selectedSolicitud.cantidad}
                    </div>
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
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#0369a1'
                    }}>
                      {selectedSolicitud.umedida}
                    </div>
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
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#0369a1'
                    }}>
                      {selectedSolicitud.moneda}
                    </div>
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
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#059669'
                  }}>
                    {parseFloat(selectedSolicitud.precio).toLocaleString('es-PE', { 
                      minimumFractionDigits: 2 
                    })} {selectedSolicitud.moneda}
                  </div>
                </div>
              </div>

              {/* Orden de compra si existe */}
              {selectedSolicitud.ordenCompra && (
                <div style={{
                  background: '#dcfce7',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
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

              {/* Fecha y Comentarios si existen */}
              {(selectedSolicitud.fecha || selectedSolicitud.comentarios) && (
                <div style={{
                  background: '#f0f4ff',
                  borderRadius: '10px',
                  padding: '1rem',
                  border: '1px solid #6366f1'
                }}>
                  <h4 style={{
                    margin: '0 0 0.75rem 0',
                    color: '#3730a3',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    📅 Información Adicional
                  </h4>
                  
                  {selectedSolicitud.fecha && (
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
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#1e1b4b',
                        padding: '0.5rem',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe'
                      }}>
                        {new Date(selectedSolicitud.fecha).toLocaleDateString('es-PE')}
                      </div>
                    </div>
                  )}

                  {selectedSolicitud.comentarios && (
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
                      <div style={{
                        fontSize: '1rem',
                        color: '#1e1b4b',
                        lineHeight: '1.5',
                        padding: '0.75rem',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe'
                      }}>
                        {selectedSolicitud.comentarios}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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