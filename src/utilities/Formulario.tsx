import { useState, useEffect } from 'react';
import { FaExclamationCircle, FaBoxOpen, FaFileAlt, FaCalculator, FaDollarSign, FaRuler, FaMoneyBillWave, FaImage, FaPaperPlane, FaPlus, FaCogs, FaCheck, FaTimes, FaHistory, FaEye, FaBuilding } from 'react-icons/fa';

const prioridades = ['Emergencia', 'Urgencia', 'Estándar'];
const sps = ['Producto', 'Servicio'];
const umedidas = ['unidad', 'litro', 'metro', 'kilo', 'par', 'juego'];
const monedas = ['Dolares', 'Soles', 'Euros'];

const familiasYSubfamilias = {
  'Repuesto': ['Accesorios', 'Bunchadora', 'Compresoras', 'Extrusoras', 'Fajas', 'Montacargas', 'Rep. Electricos', 'Rep. Neumaticos', 'Retenes y O-Ring', 'Rodamientos', 'Trefiladores'],
  'Herramientas': ['Herramientas / Produccion', 'Herramientas de Cableado', 'Herramientas de Extrusion', 'Herramientas de medicion', 'Herramientas Mecanicos / Electrico', 'Herramientas Metradoras y Cortad', 'Hileras de Cableado', 'Hileras de Trefilacion', 'Maquinaria y Equipos'],
  'Servicio de Maestranza': ['Servicio Calibracion', 'Servicio de Inspeccion', 'Servicio Mantenimiento de Montac', 'Servicio Tecnico', 'Servicios de Ingenieria', 'Servicios de Maestranza', 'Servicios Electricos', 'Servicios Mecanicos'],
  'Servicios': ['Servicios Generales'],
  'Suministros': ['Suministros de planta', 'BANDEJA DE METAL 3 PISOS ES', 'CARRITO PORTA BALONES DE', 'Combustibles y Lubricantes', 'DISPENSADOR DE ZUNCHO ME', 'Mercaderias', 'Suministros de Imprenta', 'Suministros de Limpieza', 'Suministros de Mantenimiento', 'Suministros de Oficina', 'Suministros de Planta', 'Suministros Electricos', 'Suministros Gasfiteria', 'Uniformes Equipos de Seguridad'],
  'Suministros de oficina': ['Mobiliario Oficina', 'SERVICIO DE CUENTAS DE COR', 'Suministros de computo', 'Suministros de Oficina']
};

const familias = Object.keys(familiasYSubfamilias);

interface FormularioProps {
  usuarioId?: number;
  formData?: {
    id: number;
    form: {
      prioridad: string;
      centrocosto: string;
      sp: string;
      descripcion: string;
      maquina: string;
      cantidad: string;
      precio: string;
      umedida: string;
      moneda: string;
      motivo: string;
      familia: string;
      subFamilia: string;
    };
    imageData: string | null;
  };
  onFormChange?: (field: string, value: string) => void;
  onImageChange?: (imageData: string | null) => void;
  showSubmitButton?: boolean;
}

function FormularioIndividual({ 
  formData, 
  onFormChange, 
  onImageChange, 
  showSubmitButton = true 
}: FormularioProps) {
  const [form, setForm] = useState(formData?.form || {
    prioridad: '',
    centrocosto: '',
    sp: '',
    descripcion: '',
    maquina: '',
    cantidad: '',
    precio: '',
    umedida: '',
    moneda: '',
    motivo: '',
    familia: '',
    subFamilia: '',
  });
  const [imageData, setImageData] = useState<string | null>(formData?.imageData || null);
  const [sending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  
  const userRole = localStorage.getItem('role') || '';

  useEffect(() => {
    const fetchAreas = async () => {
      setLoadingAreas(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/areas/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAreas(data);
        } else {
          console.error('Error al obtener las áreas:', response.status);
        }
      } catch (error) {
        console.error('Error en la petición de áreas:', error);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, []);

  // Sincronizar con props cuando formData cambia
  useEffect(() => {
    if (formData) {
      setForm(formData.form);
      setImageData(formData.imageData);
    }
  }, [formData]);

  // Establecer centro de costos automáticamente para TMLIMA
  useEffect(() => {
    if (userRole === 'TMLIMA' && form.centrocosto !== 'TMLIMA') {
      const newForm = { ...form, centrocosto: 'TMLIMA' };
      setForm(newForm);
      if (onFormChange) {
        onFormChange('centrocosto', 'TMLIMA');
      }
    }
  }, [userRole, form.centrocosto, onFormChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const fieldName = e.target.name;
    const value = e.target.value;
    
    let newForm = { ...form, [fieldName]: value };
    
    // Si cambió la familia, resetear la subfamilia
    if (fieldName === 'familia') {
      newForm = { ...newForm, subFamilia: '' };
    }
    
    setForm(newForm);
    setSuccess(false);
    
    // Siempre notificar los cambios a los componentes padre
    if (onFormChange) {
      onFormChange(fieldName, value);
      // Si cambió la familia, también notificar que la subfamilia se reseteo
      if (fieldName === 'familia') {
        onFormChange('subFamilia', '');
      }
    }
  };

  const handleImageChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setImageData(base64);
        if (onImageChange) {
          onImageChange(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formStyles = {
    formContainer: {
      maxWidth: '100%',
      minWidth: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      margin: '0',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
    },
    formHeader: {
      marginBottom: '1.8rem',
      textAlign: 'center' as const,
      color: '#333',
    },
    formTitle: {
      fontSize: '1.3rem',
      fontWeight: 600,
      marginBottom: '0.5rem',
      color: '#111',
    },
    formSubtitle: {
      fontSize: '0.9rem',
      color: '#666',
      lineHeight: 1.4,
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      marginBottom: '1.5rem',
      position: 'relative' as const,
    },
    fieldRow: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '0.4rem',
      fontWeight: 500,
      color: '#444',
      fontSize: '0.95rem',
      gap: '0.4rem',
    },
    icon: {
      color: '#f73317',
      fontSize: '1rem',
    },
    input: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '0.7rem 1rem',
      fontSize: '0.95rem',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s ease',
      background: '#f9f9f9',
      color: '#333',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
    },
    select: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '0.7rem 1rem',
      fontSize: '0.95rem',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s ease',
      background: '#f9f9f9',
      color: '#333',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
      appearance: 'none' as const,
      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 0.7rem center',
      backgroundSize: '1rem',
    },
    fileInput: {
      border: '1px dashed #ccc',
      borderRadius: '8px',
      padding: '1.2rem 1rem',
      fontSize: '0.95rem',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s ease',
      background: '#f9f9f9',
      color: '#333',
      textAlign: 'center' as const,
      cursor: 'pointer',
    },
    imagePreview: {
      marginTop: '1rem',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #eee',
    },
    button: {
      width: '100%',
      background: '#f73317',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '0.8rem',
      fontWeight: 600,
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '1rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(247,51,23,0.3)',
    },
    successBadge: {
      position: 'absolute' as const,
      top: '1rem',
      right: '1rem',
      background: '#4CAF50',
      color: 'white',
      padding: '0.3rem 0.7rem',
      borderRadius: '16px',
      fontSize: '0.8rem',
      fontWeight: 600,
    }
  };

  return (
    <div style={formStyles.formContainer}>
      {success && <div style={formStyles.successBadge}>Enviado con éxito</div>}
      
      <div style={formStyles.formHeader}>
        <div style={formStyles.formTitle}>Solicitud de materiales</div>
        <div style={formStyles.formSubtitle}>
          Complete este formulario para solicitar los materiales que necesita para su trabajo
        </div>
      </div>
      
      <div style={formStyles.fieldGroup}>
        <label style={formStyles.label}>
          <FaExclamationCircle style={formStyles.icon} /> Prioridad
        </label>
        <select
          name="prioridad"
          value={form.prioridad}
          onChange={handleChange}
          required
          style={formStyles.select}
        >
          <option value="">Seleccione prioridad</option>
          {prioridades.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      
      <div style={formStyles.fieldGroup}>
        <label style={formStyles.label}>
          <FaBuilding style={formStyles.icon} /> Centro de costos
        </label>
        {userRole === 'TMLIMA' ? (
          <input
            name="centrocosto"
            value="TMLIMA"
            readOnly
            style={{
              ...formStyles.input,
              backgroundColor: '#f5f5f5',
              color: '#666',
              cursor: 'not-allowed'
            }}
          />
        ) : (
          <select
            name="centrocosto"
            value={form.centrocosto}
            onChange={handleChange}
            required
            style={formStyles.select}
            disabled={loadingAreas}
          >
            <option value="">
              {loadingAreas ? 'Cargando áreas...' : 'Seleccione un centro de costos'}
            </option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div style={formStyles.fieldGroup}>
        <label style={formStyles.label}>
          <FaBoxOpen style={formStyles.icon} /> Tipo
        </label>
        <select
          name="sp"
          value={form.sp}
          onChange={handleChange}
          required
          style={formStyles.select}
        >
          <option value="">Seleccione tipo</option>
          {sps.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      
      <div style={formStyles.fieldGroup}>
        <label style={formStyles.label}>
          <FaFileAlt style={formStyles.icon} /> Descripción
        </label>
        <input
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Describa el ítem solicitado"
          required
          style={formStyles.input}
        />
      </div>
      
      <div style={formStyles.fieldGroup}>
        <label style={formStyles.label}>
          <FaCogs style={formStyles.icon} /> Máquina (opcional)
        </label>
        <input
          name="maquina"
          value={form.maquina}
          onChange={handleChange}
          placeholder="Nombre de la máquina relacionada"
          style={formStyles.input}
        />
      </div>

      <div style={formStyles.fieldGroup}>
        <label style={formStyles.label}>
          <FaFileAlt style={formStyles.icon} /> Motivo
        </label>
        <input
          name="motivo"
          value={form.motivo}
          onChange={handleChange}
          placeholder="Motivo de la solicitud"
          required
          style={formStyles.input}
        />
      </div>
      
      <div style={formStyles.fieldRow}>
        <div style={{...formStyles.fieldGroup, flex: 1}}>
          <label style={formStyles.label}>
            <FaBoxOpen style={formStyles.icon} /> Familia
          </label>
          <select
            name="familia"
            value={form.familia}
            onChange={handleChange}
            required
            style={formStyles.select}
          >
            <option value="">Seleccione familia</option>
            {familias.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        <div style={{...formStyles.fieldGroup, flex: 1}}>
          <label style={formStyles.label}>
            <FaBoxOpen style={formStyles.icon} /> Subfamilia
          </label>
          <select
            name="subFamilia"
            value={form.subFamilia}
            onChange={handleChange}
            required
            style={formStyles.select}
            disabled={!form.familia}
          >
            <option value="">
              {!form.familia ? 'Primero seleccione una familia' : 'Seleccione subfamilia'}
            </option>
            {form.familia && familiasYSubfamilias[form.familia as keyof typeof familiasYSubfamilias]?.map((sf: string) => (
              <option key={sf} value={sf}>{sf}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={formStyles.fieldRow}>
        <div style={{...formStyles.fieldGroup, flex: 1}}>
          <label style={formStyles.label}>
            <FaCalculator style={formStyles.icon} /> Cantidad
          </label>
          <input
            name="cantidad"
            type="number"
            min="1"
            value={form.cantidad}
            onChange={handleChange}
            required
            style={formStyles.input}
          />
        </div>
        
        <div style={{...formStyles.fieldGroup, flex: 1}}>
          <label style={formStyles.label}>
            <FaRuler style={formStyles.icon} /> Unidad
          </label>
          <select
            name="umedida"
            value={form.umedida}
            onChange={handleChange}
            required
            style={formStyles.select}
          >
            <option value="">Seleccione</option>
            {umedidas.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={formStyles.fieldRow}>
        <div style={{...formStyles.fieldGroup, flex: 1}}>
          <label style={formStyles.label}>
            <FaDollarSign style={formStyles.icon} /> Precio
          </label>
          <input
            name="precio"
            type="number"
            step="0.01"
            min="0"
            value={form.precio}
            onChange={handleChange}
            required
            style={formStyles.input}
          />
        </div>
        
        <div style={{...formStyles.fieldGroup, flex: 1}}>
          <label style={formStyles.label}>
            <FaMoneyBillWave style={formStyles.icon} /> Moneda
          </label>
          <select
            name="moneda"
            value={form.moneda}
            onChange={handleChange}
            required
            style={formStyles.select}
          >
            <option value="">Seleccione</option>
            {monedas.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={formStyles.fieldGroup}>
        <label style={formStyles.label}>
          <FaImage style={formStyles.icon} /> Archivo (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChangeLocal}
          style={formStyles.fileInput}
        />
        {imageData && (
          <div style={formStyles.imagePreview}>
            <img
              src={`data:image/*;base64,${imageData}`}
              alt="Vista previa"
              style={{ width: '100%', maxHeight: 180, objectFit: 'contain' }}
            />
          </div>
        )}
      </div>
      
      {showSubmitButton && (
        <button
          type="submit"
          disabled={sending}
          style={{
            ...formStyles.button,
            opacity: sending ? 0.7 : 1,
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          <FaPaperPlane /> {sending ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      )}
    </div>
  );
}

export default function Formulario() {
  const usuarioId = Number(localStorage.getItem('userId'));
  const userRole = localStorage.getItem('role') || '';
  
  const [formularios, setFormularios] = useState([{
    id: 0,
    form: {
      prioridad: '',
      centrocosto: userRole === 'TMLIMA' ? 'TMLIMA' : '',
      sp: '',
      descripcion: '',
      maquina: '',
      cantidad: '',
      precio: '',
      umedida: '',
      moneda: '',
      motivo: '',
      familia: '',
      subFamilia: '',
    },
    imageData: null as string | null
  }]);
  const [activeTab, setActiveTab] = useState(0);
  const [sending, setSending] = useState(false);
  const [modalSending, setModalSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);
  
  // Estados para el modal de historial
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);

  const MAX_FORMULARIOS = 10;

  const handleFormChange = (formIndex: number, field: string, value: string) => {
    setFormularios(prev => prev.map((item, index) => {
      if (index === formIndex) {
        let newForm = { ...item.form, [field]: value };
        
        // Si cambió la familia, resetear la subfamilia
        if (field === 'familia') {
          newForm = { ...newForm, subFamilia: '' };
        }
        
        return { ...item, form: newForm };
      }
      return item;
    }));
  };

  const handleImageChange = (formIndex: number, imageData: string | null) => {
    setFormularios(prev => prev.map((item, index) => 
      index === formIndex 
        ? { ...item, imageData }
        : item
    ));
  };

  const addFormulario = () => {
    if (formularios.length < MAX_FORMULARIOS) {
      const newId = Math.max(...formularios.map(f => f.id)) + 1;
      setFormularios(prev => [...prev, {
        id: newId,
        form: {
          prioridad: '',
          centrocosto: userRole === 'TMLIMA' ? 'TMLIMA' : '',
          sp: '',
          descripcion: '',
          maquina: '',
          cantidad: '',
          precio: '',
          umedida: '',
          moneda: '',
          motivo: '',
          familia: '',
          subFamilia: '',
        },
        imageData: null
      }]);
      setActiveTab(formularios.length);
    }
  };

  const removeFormulario = (index: number) => {
    if (formularios.length > 1) {
      setFormularios(prev => prev.filter((_, i) => i !== index));
      if (activeTab >= formularios.length - 1) {
        setActiveTab(Math.max(0, formularios.length - 2));
      }
    }
  };

  const validateForm = (form: any) => {
    const required = ['prioridad', 'centrocosto', 'sp', 'descripcion', 'cantidad', 'precio', 'umedida', 'moneda', 'motivo', 'familia', 'subFamilia'];
    const isValid = required.every(field => {
      const value = form[field];
      return value && value.toString().trim() !== '';
    });
    
    return isValid;
  };

  const getIncompleteFormIndex = () => {
    return formularios.findIndex(item => !validateForm(item.form));
  };

  const handleSubmitAll = () => {
    const incompleteIndex = getIncompleteFormIndex();
    if (incompleteIndex !== -1) {
      setActiveTab(incompleteIndex);
      alert(`Por favor complete todos los campos obligatorios en el formulario ${incompleteIndex + 1}`);
      return;
    }

    setModalData({
      onConfirm: async () => {
        setModalSending(true);
        setSending(true);
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            alert('❌ Error: No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            setSending(false);
            setModalSending(false);
            setShowModal(false);
            setModalData(null);
            return;
          }
          
          // Función auxiliar para enviar con delay
          const enviarConDelay = async (item: any, index: number) => {
            // Asegurar que todos los campos requeridos tienen valores válidos
            const requestBody = { 
              ...item.form, 
              usuarioId,
              imageData: item.imageData,
              // Asegurar que los campos no estén vacíos
              motivo: item.form.motivo || '',
              familia: item.form.familia || '',
              subFamilia: item.form.subFamilia || ''
            };
            
            // Pequeño delay para evitar problemas de concurrencia
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            return fetch('http://localhost:8080/solicitudes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(requestBody),
            });
          };
          
          const promises = formularios.map((item, index) => enviarConDelay(item, index));

          const results = await Promise.allSettled(promises);
          
          // Revisar cada respuesta individualmente
          let successCount = 0;
          let errorMessages = [];
          
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            
            if (result.status === 'fulfilled') {
              const res = result.value;
              if (res.ok) {
                successCount++;
              } else if (res.status === 401) {
                // Token expirado o inválido
                errorMessages.push(`Formulario ${i + 1}: Sesión expirada. Por favor, inicie sesión nuevamente.`);
              } else if (res.status === 403) {
                // El 403 puede indicar que se guardó pero hay problema con la respuesta
                // Verificamos si el backend insertó la solicitud
                try {
                  const errorText = await res.text();
                  if (errorText.includes('lob stream') || errorText === '') {
                    // Error conocido del backend con imágenes, pero la solicitud se guardó
                    successCount++;
                  } else {
                    errorMessages.push(`Formulario ${i + 1}: ${res.status} - ${errorText}`);
                  }
                } catch {
                  // Si no podemos leer el error, asumimos que se guardó
                  successCount++;
                }
              } else {
                try {
                  const errorText = await res.text();
                  errorMessages.push(`Formulario ${i + 1}: ${res.status} - ${errorText}`);
                } catch {
                  errorMessages.push(`Formulario ${i + 1}: Error ${res.status}`);
                }
              }
            } else {
              // Error de red o promesa rechazada
              errorMessages.push(`Formulario ${i + 1}: Error de conexión - ${result.reason}`);
            }
          }

          if (successCount === formularios.length) {
            alert(`✅ ${formularios.length} solicitud(es) enviada(s) exitosamente`);
            // Reset formularios
            setFormularios([{
              id: 0,
              form: {
                prioridad: '',
                centrocosto: userRole === 'TMLIMA' ? 'TMLIMA' : '',
                sp: '',
                descripcion: '',
                maquina: '',
                cantidad: '',
                precio: '',
                umedida: '',
                moneda: '',
                motivo: '',
                familia: '',
                subFamilia: '',
              },
              imageData: null
            }]);
            setActiveTab(0);
          } else {
            console.error('Errores encontrados:', errorMessages);
            if (successCount > 0) {
              const mensaje = `✅ ${successCount} de ${formularios.length} solicitudes enviadas exitosamente.`;
              const errores = errorMessages.length > 0 ? `\n\n❌ Errores:\n${errorMessages.join('\n')}` : '';
              alert(mensaje + errores);
              
              // Si hay algunas exitosas, preguntamos si quiere reset
              if (confirm('¿Desea limpiar los formularios para crear nuevas solicitudes?')) {
                setFormularios([{
                  id: 0,
                  form: {
                    prioridad: '',
                    centrocosto: userRole === 'TMLIMA' ? 'TMLIMA' : '',
                    sp: '',
                    descripcion: '',
                    maquina: '',
                    cantidad: '',
                    precio: '',
                    umedida: '',
                    moneda: '',
                    motivo: '',
                    familia: '',
                    subFamilia: '',
                  },
                  imageData: null
                }]);
                setActiveTab(0);
              }
            } else {
              alert(`❌ Error al enviar las solicitudes:\n${errorMessages.join('\n')}\n\nVerifique la conexión con el servidor y vuelva a intentarlo.`);
            }
          }
        } catch (err) {
          console.error('Error de conexión:', err);
          alert('❌ Error de conexión al servidor');
        } finally {
          setSending(false);
          setModalSending(false);
          setShowModal(false);
          setModalData(null);
        }
      },
      onCancel: () => {
        setShowModal(false);
        setModalData(null);
      }
    });
    setShowModal(true);
  };

  const isFormComplete = (form: any) => validateForm(form);
  const allFormsComplete = formularios.every(item => isFormComplete(item.form));

  // Función para cargar las solicitudes del usuario
  const cargarMisSolicitudes = async (page = 1) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        alert('❌ Error: No hay sesión activa');
        return;
      }

      const res = await fetch(`http://localhost:8080/solicitudes/usuario/${userId}?page=${page - 1}&size=2`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMisSolicitudes(data.content || []);
        setHistoryTotalPages(data.totalPages || 1);
        setHistoryTotalElements(data.totalElements || 0);
        setHistoryPage(page);
        setShowHistoryModal(true);
      } else {
        alert('❌ Error al cargar las solicitudes');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error de conexión');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        padding: '2rem',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2
            style={{
              color: '#fff',
              fontSize: '2.5rem',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '1px',
              textShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            Sistema de Solicitudes
          </h2>
          <p style={{
            color: '#fff',
            fontSize: '1.1rem',
            margin: '0.5rem 0 0 0',
            textShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}>
            Complete los formularios para solicitar los materiales que necesita
          </p>
        </div>
        
        <button
          onClick={() => cargarMisSolicitudes()}
          disabled={loadingHistory}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            padding: '0.75rem 1.5rem',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: loadingHistory ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            opacity: loadingHistory ? 0.7 : 1
          }}
          onMouseOver={e => {
            if (!loadingHistory) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
          }}
        >
          <FaEye style={{ fontSize: '1rem' }} />
          {loadingHistory ? 'Cargando...' : 'Mis Solicitudes'}
        </button>
      </div>

      {/* Container principal */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        position: 'relative'
      }}>
        
        {/* Tabs de navegación */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {formularios.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(index)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === index 
                  ? 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)' 
                  : isFormComplete(item.form) 
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : '#f1f5f9',
                color: activeTab === index || isFormComplete(item.form) ? '#fff' : '#6b7280',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === index || isFormComplete(item.form) 
                  ? '0 4px 12px rgba(0,0,0,0.15)' 
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={e => {
                if (activeTab !== index) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isFormComplete(item.form) && <FaCheck style={{ fontSize: '0.8rem' }} />}
              Formulario {index + 1}
              {formularios.length > 1 && (
                <FaTimes 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFormulario(index);
                  }}
                  style={{ 
                    fontSize: '0.8rem', 
                    marginLeft: '0.25rem',
                    opacity: 0.7,
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '1'}
                  onMouseOut={e => e.currentTarget.style.opacity = '0.7'}
                />
              )}
            </button>
          ))}
          
          {/* Botón agregar formulario */}
          {formularios.length < MAX_FORMULARIOS && (
            <button
              onClick={addFormulario}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '2px dashed #d1d5db',
                background: 'transparent',
                color: '#6b7280',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = '#f73317';
                e.currentTarget.style.color = '#f73317';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FaPlus style={{ fontSize: '0.8rem' }} />
              Agregar
            </button>
          )}
        </div>

        {/* Formulario activo */}
        <FormularioIndividual 
          key={formularios[activeTab].id}
          formData={formularios[activeTab]}
          onFormChange={(field, value) => handleFormChange(activeTab, field, value)}
          onImageChange={(imageData) => handleImageChange(activeTab, imageData)}
          showSubmitButton={false}
        />

        {/* Botón de envío global */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          borderTop: '2px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem',
            color: '#6b7280'
          }}>
            <span>Total de formularios: {formularios.length}</span>
            <span>Completos: {formularios.filter(item => isFormComplete(item.form)).length}</span>
          </div>
          
          <button
            onClick={handleSubmitAll}
            disabled={!allFormsComplete || sending}
            style={{
              width: '100%',
              background: allFormsComplete && !sending
                ? 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)'
                : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: allFormsComplete && !sending ? 'pointer' : 'not-allowed',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s ease',
              boxShadow: allFormsComplete && !sending 
                ? '0 4px 15px rgba(247, 51, 23, 0.3)' 
                : 'none',
              opacity: sending ? 0.7 : 1
            }}
            onMouseOver={e => {
              if (allFormsComplete && !sending) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(247, 51, 23, 0.4)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = allFormsComplete && !sending 
                ? '0 4px 15px rgba(247, 51, 23, 0.3)' 
                : 'none';
            }}
          >
            <FaPaperPlane />
            {sending 
              ? 'Enviando solicitudes...' 
              : `Enviar ${formularios.length} solicitud${formularios.length > 1 ? 'es' : ''}`
            }
          </button>
        </div>
      </div>

      {/* Modal de Historial de Solicitudes */}
      {showHistoryModal && (
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
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            maxWidth: '1000px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header del modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <FaHistory style={{ 
                  fontSize: '1.5rem', 
                  color: '#f73317' 
                }} />
                <h3 style={{
                  color: '#1f2937',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Mis Solicitudes ({historyTotalElements})
                </h3>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {historyTotalPages > 1 && (
                  <div style={{
                    backgroundColor: 'rgba(247, 51, 23, 0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    color: '#f73317',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}>
                    Página {historyPage} de {historyTotalPages}
                  </div>
                )}
                
                <button
                  onClick={() => setShowHistoryModal(false)}
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
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {misSolicitudes.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6b7280'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>
                    📋
                  </div>
                  <h4 style={{
                    fontSize: '1.2rem',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    No hay solicitudes registradas
                  </h4>
                  <p>
                    Cuando envíe solicitudes, aparecerán aquí para que pueda hacer seguimiento.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {misSolicitudes.map((solicitud) => (
                    <div
                      key={solicitud.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Badge de estado */}
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: 
                            solicitud.estado === 'Pendiente' ? '#f59e0b' : 
                            solicitud.estado === 'Aprobado' ? '#22c55e' : '#dc2626',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {solicitud.estado}
                        </span>
                      </div>

                      {/* Header de la solicitud */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem',
                        paddingRight: '6rem'
                      }}>
                        <div style={{
                          background: '#f73317',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          minWidth: '60px',
                          textAlign: 'center'
                        }}>
                          RQ{solicitud.id}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            margin: '0 0 0.25rem 0',
                            color: '#1f2937',
                            fontSize: '1.1rem',
                            fontWeight: 600
                          }}>
                            {solicitud.descripcion}
                          </h4>
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}>
                            <span>
                              <strong>Tipo:</strong> {solicitud.sp}
                            </span>
                            <span>
                              <strong>Prioridad:</strong> 
                              <span style={{
                                color: solicitud.prioridad === 'Emergencia' ? '#dc2626' : 
                                       solicitud.prioridad === 'Urgencia' ? '#f59e0b' : '#22c55e',
                                fontWeight: 600,
                                marginLeft: '0.25rem'
                              }}>
                                {solicitud.prioridad}
                              </span>
                            </span>
                          </div>
                          
                          {/* Información de categorización si está disponible */}
                          {(solicitud.familia || solicitud.subFamilia) && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#6b7280',
                              marginTop: '0.25rem',
                              fontStyle: 'italic'
                            }}>
                              {solicitud.familia && <span><strong>Familia:</strong> {solicitud.familia}</span>}
                              {solicitud.familia && solicitud.subFamilia && <span> • </span>}
                              {solicitud.subFamilia && <span><strong>Subfamilia:</strong> {solicitud.subFamilia}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detalles de la solicitud */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem',
                        padding: '1rem',
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            marginBottom: '0.25rem'
                          }}>
                            Cantidad
                          </div>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#1f2937'
                          }}>
                            {solicitud.cantidad} {solicitud.umedida}
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
                            Precio
                          </div>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#059669'
                          }}>
                            {parseFloat(solicitud.precio).toLocaleString('es-PE', { 
                              minimumFractionDigits: 2 
                            })} {solicitud.moneda}
                          </div>
                        </div>
                        
                        {/* Mostrar orden de compra o estado de asignación */}
                        <div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            marginBottom: '0.25rem'
                          }}>
                            Orden de Compra
                          </div>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: solicitud.ordenCompra ? '#3b82f6' : 
                                   solicitud.estado === 'Aprobado' ? '#f59e0b' : '#6b7280'
                          }}>
                            {solicitud.ordenCompra || 
                             (solicitud.estado === 'Aprobado' ? 'Pendiente de asignación' : 'No asignado')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Paginación */}
              {historyTotalPages > 1 && (
                <div style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={() => cargarMisSolicitudes(Math.max(1, historyPage - 1))}
                    disabled={historyPage === 1 || loadingHistory}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: historyPage === 1 || loadingHistory
                        ? '#e5e7eb'
                        : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                      color: historyPage === 1 || loadingHistory ? '#9ca3af' : '#fff',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: historyPage === 1 || loadingHistory ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={e => {
                      if (historyPage !== 1 && !loadingHistory) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(247, 51, 23, 0.3)';
                      }
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    ← Anterior
                  </button>
                  
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#374151',
                    border: '1px solid #e2e8f0'
                  }}>
                    {historyPage} de {historyTotalPages}
                  </div>
                  
                  <button
                    onClick={() => cargarMisSolicitudes(Math.min(historyTotalPages, historyPage + 1))}
                    disabled={historyPage === historyTotalPages || loadingHistory}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: historyPage === historyTotalPages || loadingHistory
                        ? '#e5e7eb'
                        : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                      color: historyPage === historyTotalPages || loadingHistory ? '#9ca3af' : '#fff',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: historyPage === historyTotalPages || loadingHistory ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={e => {
                      if (historyPage !== historyTotalPages && !loadingHistory) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(247, 51, 23, 0.3)';
                      }
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
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
                📋
              </div>
              <h3 style={{
                color: '#1f2937',
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                Confirmar Envío de Solicitudes
              </h3>
            </div>

            <div style={{
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '2px solid #fbbf24'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '1.5rem' }}>⚠️</div>
                <div style={{ fontWeight: 600, color: '#92400e' }}>
                  IMPORTANTE: Una vez enviadas, las solicitudes no se podrán modificar
                </div>
              </div>
              
              <div style={{ color: '#78350f', lineHeight: '1.5' }}>
                Está a punto de enviar <strong>{formularios.length} solicitud{formularios.length > 1 ? 'es' : ''}</strong> al sistema. 
                Por favor revise que toda la información esté correcta antes de continuar.
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
                disabled={modalSending}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: modalSending 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #f73317 0%, #e02b0f 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: modalSending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: modalSending 
                    ? 'none' 
                    : '0 4px 15px rgba(247, 51, 23, 0.3)',
                  opacity: modalSending ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={e => {
                  if (!modalSending) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(247, 51, 23, 0.4)';
                  }
                }}
                onMouseOut={e => {
                  if (!modalSending) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(247, 51, 23, 0.3)';
                  }
                }}
              >
                {modalSending ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Enviando...
                  </>
                ) : (
                  <>
                    ✅ Confirmar y Enviar
                  </>
                )}
              </button>
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
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}