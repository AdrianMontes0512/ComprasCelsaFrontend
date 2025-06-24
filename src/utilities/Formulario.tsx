import { useState } from 'react';
import { FaExclamationCircle, FaBoxOpen, FaFileAlt, FaCalculator, FaDollarSign, FaRuler, FaMoneyBillWave, FaImage, FaPaperPlane, FaPlus, FaMinus } from 'react-icons/fa';

const prioridades = ['Emergencia', 'Urgencia', 'Estándar'];
const sps = ['Producto', 'Servicio'];
const umedidas = ['unidad', 'litro', 'metro', 'kilo', 'par', 'juego'];
const monedas = ['Dolares', 'Soles', 'Euros'];

function FormularioIndividual({ usuarioId }: { usuarioId: number }) {
  const [form, setForm] = useState({
    prioridad: '',
    sp: '',
    descripcion: '',
    cantidad: '',
    precio: '',
    umedida: '',
    moneda: '',
  });
  const [imageData, setImageData] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setImageData(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const body = { ...form, usuarioId, imageData: imageData };
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        setSuccess(true);
        setForm({
          prioridad: '',
          sp: '',
          descripcion: '',
          cantidad: '',
          precio: '',
          umedida: '',
          moneda: '',
        });
        setImageData(null);
      } else {
        alert('Error al enviar la solicitud');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setSending(false);
    }
  };

  const formStyles = {
    formContainer: {
      maxWidth: 420,
      minWidth: 350,
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      margin: '1.5rem',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      background: '#fff',
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
    <form onSubmit={handleSubmit} style={formStyles.formContainer}>
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
          <FaImage style={formStyles.icon} /> Imagen (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
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
    </form>
  );
}

export default function Formulario() {
  const usuarioId = Number(localStorage.getItem('userId'));
  const [formularios, setFormularios] = useState([0]);

  const handleAdd = () => {
    if (formularios.length < 3) {
      setFormularios((prev) => [...prev, prev.length]);
    }
  };

  const handleRemove = () => {
    if (formularios.length > 1) {
      setFormularios((prev) => prev.slice(0, -1));
    }
  };

  const isMax = formularios.length === 3;
  const isTwo = formularios.length === 2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <h2
        style={{
          color: '#fff',
          fontSize: '2.5rem',
          fontWeight: 700,
          marginTop: '2.5rem',
          marginBottom: '0.5rem',
          letterSpacing: '1px',
          textShadow: '0 2px 8px rgba(0,0,0,0.18)',
          textAlign: 'center',
          width: '100%',
        }}
      >
        Sistema de Solicitudes
      </h2>
      <p style={{
        color: '#fff',
        fontSize: '1.1rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        maxWidth: '800px',
        textShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}>
        Complete el formulario para solicitar los materiales que necesita para su trabajo
      </p>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        {formularios.map((key) => (
          <FormularioIndividual key={key} usuarioId={usuarioId} />
        ))}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginLeft: '1rem',
            marginTop: '2rem',
          }}
        >
          <button
            onClick={isMax ? handleRemove : handleAdd}
            style={{
              height: 60,
              width: 60,
              borderRadius: '50%',
              border: 'none',
              background: isMax ? '#f8f8f8' : '#f73317',
              color: isMax ? '#f73317' : '#fff',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              cursor: (isMax && formularios.length === 1) ? 'not-allowed' : 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
              padding: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            title={isMax ? "Quitar formulario" : "Agregar formulario"}
            onMouseOver={e => {
              if (!(isMax && formularios.length === 1)) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            {isMax ? <FaMinus /> : <FaPlus />}
          </button>
          {isTwo && (
            <button
              onClick={handleRemove}
              style={{
                height: 40,
                width: 40,
                marginTop: '1.2rem',
                borderRadius: '50%',
                border: 'none',
                background: '#f8f8f8',
                color: '#f73317',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
                padding: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              title="Quitar formulario"
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <FaMinus />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}