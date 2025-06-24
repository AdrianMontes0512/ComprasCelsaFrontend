import { useEffect, useState } from 'react';
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
}

const PAGE_SIZE = 14;

const prioridades = ['Emergencia', 'Urgencia', 'Estándar'];
const tipos = ['Producto', 'Servicio'];
const estados = ['Pendiente', 'Aprobado', 'Rechazado']; // Ajusta según tus estados posibles

export default function ConfirmationTable() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [usuarios, setUsuarios] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/solicitudes?page=${page - 1}&size=${PAGE_SIZE}`, {
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
    (filtroEstado ? s.estado === filtroEstado : true)
  );

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Exporta las solicitudes filtradas, mostrando el nombre del usuario (sin la columna Imagen)
    const dataToExport = solicitudesFiltradas.map((s) => ({
      ID: s.id,
      Prioridad: s.prioridad,
      Tipo: s.sp,
      Descripción: s.descripcion,
      Cantidad: s.cantidad,
      Precio: s.precio,
      Unidad: s.umedida,
      Moneda: s.moneda,
      Estado: s.estado,
      Usuario: usuarios[s.usuarioId] || 'Desconocido',
      // Imagen: `http://localhost:8080/solicitudes/imagen/${s.id}`, // <-- Quitado del Excel
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
            const res = await fetch(`http://localhost:8080/user/${id}`, {
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

  // Nueva función para descargar la imagen
  const descargarImagen = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8080/solicitudes/imagen/${id}`, {
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
      a.download = `solicitud_${id}_imagen`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar la imagen');
    }
  };

  return (
    <div style={{ padding: '2rem', width: '100%', overflowX: 'auto' }}>
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
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
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
                <th style={thStyle}>📏 Unidad</th>
                <th style={thStyle}>💱 Moneda</th>
                <th style={thStyle}>📊 Estado</th>
                <th style={thStyle}>👤 Usuario</th>
                <th style={thStyle}>🖼️ Imagen</th>
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
                    <div style={{
                      fontWeight: 600,
                      color: '#1f2937',
                      fontSize: '1rem'
                    }}>
                      #{s.id}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: 
                        s.prioridad === 'Emergencia' ? '#dc2626' : 
                        s.prioridad === 'Urgencia' ? '#f59e0b' : '#22c55e',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.5px'
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
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                      fontSize: '0.9rem',
                      color: '#374151'
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
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid #f73317',
                background: page === 1 ? '#eee' : '#fff',
                color: '#f73317',
                fontWeight: 600,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center', fontWeight: 500 }}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid #f73317',
                background: page === totalPages ? '#eee' : '#fff',
                color: '#f73317',
                fontWeight: 600,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '1rem 0.8rem',
  borderBottom: '2px solid rgba(255,255,255,0.2)',
  fontWeight: 700,
  fontSize: '0.9rem',
  background: 'transparent',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const
};

const tdStyle: React.CSSProperties = {
  padding: '1rem 0.8rem',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '0.9rem',
  background: 'transparent',
  verticalAlign: 'middle' as const
};