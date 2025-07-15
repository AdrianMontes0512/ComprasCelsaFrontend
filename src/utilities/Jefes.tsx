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
  ordenCompra?: string;
}

const PAGE_SIZE = 14;

const prioridades = ['Emergencia', 'Urgencia', 'Estándar'];
const tipos = ['Producto', 'Servicio'];
const estados = ['Pendiente', 'Aprobado', 'Rechazado'];

export default function ConfirmationTable() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [usuarios, setUsuarios] = useState<{ [id: number]: string }>({});
  
  // Estados para el modal de confirmación
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{
    solicitud: Solicitud;
    nuevoEstado: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/solicitudes/jefe?page=${page - 1}&size=${PAGE_SIZE}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log('Respuesta de /solicitudes/jefe:', data);
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
      'Orden de Compra': s.ordenCompra || 'Sin asignar',
      Usuario: usuarios[s.usuarioId] || 'Desconocido',
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
            ✅ Aprobación de Solicitudes
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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
          color: '#fff',
          fontSize: '1.2rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '1rem'
          }} />
          Cargando solicitudes...
        </div>
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
                    <select
                      value={s.estado}
                      onChange={(e) => {
                        const nuevoEstado = e.target.value;
                        
                        // Si es el mismo estado, no hacer nada
                        if (nuevoEstado === s.estado) return;
                        
                        // Mostrar modal de confirmación personalizado
                        setModalData({
                          solicitud: s,
                          nuevoEstado,
                          onConfirm: async () => {
                            const token = localStorage.getItem('token');
                            const body = { estado: nuevoEstado };
                            console.log('PATCH body:', body);
                            try {
                              const res = await fetch(`http://localhost:8080/solicitudes/${s.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify(body),
                              });
                              if (res.ok) {
                                setSolicitudes((prev) =>
                                  prev.map((sol) =>
                                    sol.id === s.id ? { ...sol, estado: nuevoEstado } : sol
                                  )
                                );
                              } else {
                                const errorText = await res.text();
                                alert('❌ Error al actualizar el estado: ' + errorText);
                              }
                            } catch (err) {
                              alert('❌ Error de conexión');
                            }
                            setShowModal(false);
                            setModalData(null);
                          },
                          onCancel: () => {
                            // Revertir el select al estado original
                            (e.target as HTMLSelectElement).value = s.estado;
                            setShowModal(false);
                            setModalData(null);
                          }
                        });
                        setShowModal(true);
                      }}
                      style={{ 
                        padding: '0.5rem', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        backgroundColor: '#fff',
                        color: '#374151',
                        outline: 'none'
                      }}
                    >
                      {estados.map(est => (
                        <option key={est} value={est}>{est}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    {s.ordenCompra ? (
                      <span style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #0ea5e9',
                        display: 'inline-block',
                        minWidth: '80px',
                        textAlign: 'center'
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
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: page === 1 ? '#e5e7eb' : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                color: page === 1 ? '#9ca3af' : '#fff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: page === 1 ? 'none' : '0 2px 8px rgba(247, 51, 23, 0.3)'
              }}
            >
              ← Anterior
            </button>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.9rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              Página {page} de {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: page === totalPages ? '#e5e7eb' : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                color: page === totalPages ? '#9ca3af' : '#fff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: page === totalPages ? 'none' : '0 2px 8px rgba(247, 51, 23, 0.3)'
              }}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* Modal de Confirmación Personalizado */}
      {showModal && modalData && (
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
                ⚠️
              </div>
              <h3 style={{
                color: '#1f2937',
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                Confirmar Cambio de Estado
              </h3>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Solicitud: </span>
                <span style={{ 
                  backgroundColor: '#dbeafe', 
                  color: '#1e40af', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '6px',
                  fontWeight: 600
                }}>
                  #{modalData.solicitud.id}
                </span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Descripción: </span>
                <div style={{ 
                  color: '#6b7280', 
                  marginTop: '0.25rem',
                  lineHeight: '1.5'
                }}>
                  {modalData.solicitud.descripcion}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>ESTADO ACTUAL</div>
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#fef3c7',
                    color: '#92400e'
                  }}>
                    {modalData.solicitud.estado}
                  </span>
                </div>
                
                <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>→</div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>NUEVO ESTADO</div>
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: modalData.nuevoEstado === 'Aprobado' ? '#dcfce7' : 
                                   modalData.nuevoEstado === 'Rechazado' ? '#fecaca' : '#fef3c7',
                    color: modalData.nuevoEstado === 'Aprobado' ? '#166534' : 
                           modalData.nuevoEstado === 'Rechazado' ? '#dc2626' : '#92400e'
                  }}>
                    {modalData.nuevoEstado}
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
                onClick={modalData.onCancel}
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
                onClick={modalData.onConfirm}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(247, 51, 23, 0.3)'
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
                ✅ Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
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
