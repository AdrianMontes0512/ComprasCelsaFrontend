/* ============================================================
   COMPRAS CELSA — Modal de cambio de contraseña
   ============================================================ */
import { useState, useEffect, Fragment } from "react";
import { Modal, Field, Input, Button, Icon, useToast } from "./ui";
import { apiChangePassword } from "../services/api";

interface Props {
  open: boolean;
  userId: number;
  onClose: () => void;
}

const ChangePasswordModal = ({ open, userId, onClose }: Props) => {
  const { push } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setCurrent(""); setNext(""); setConfirm(""); setShowCur(false); setShowNew(false); }
  }, [open]);

  const validate = () => {
    if (!current) return "Ingresa tu contraseña actual";
    if (!next || next.length < 4) return "La nueva contraseña debe tener al menos 4 caracteres";
    if (next === current) return "La nueva contraseña debe ser distinta de la actual";
    if (next !== confirm) return "La confirmación no coincide con la nueva contraseña";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { push({ kind:"error", title:"Revisa el formulario", message: err }); return; }
    setLoading(true);
    try {
      await apiChangePassword(userId, current, next);
      push({ kind:"success", title:"Contraseña actualizada", message:"Tu nueva contraseña ya está activa." });
      onClose();
    } catch (e: any) {
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.error;
      const msg = status === 401
        ? "La contraseña actual es incorrecta"
        : apiMsg || "No se pudo actualizar la contraseña";
      push({ kind:"error", title:"Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const err = validate();

  return (
    <Modal open={open} onClose={onClose} title="Cambiar contraseña" width={460}
      footer={(
        <Fragment>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" icon="lock" loading={loading} onClick={submit} disabled={!!err && (current.length>0 || next.length>0 || confirm.length>0)}>Guardar</Button>
        </Fragment>
      )}>
      <p style={{margin:"0 0 16px",fontSize:13,color:"var(--fg-muted)",lineHeight:1.5}}>
        Por seguridad, debes ingresar tu contraseña actual y luego la nueva contraseña dos veces.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Contraseña actual" icon="lock" required>
          <Input
            type={showCur ? "text" : "password"}
            placeholder="••••••••"
            value={current}
            onChange={(e:any)=>setCurrent(e.target.value)}
            leftIcon="lock"
            rightSlot={
              <button type="button" onClick={()=>setShowCur(p=>!p)} style={{
                background:"transparent",border:"none",cursor:"pointer",
                padding:6,color:"var(--fg-subtle)",borderRadius:6,
              }}><Icon name={showCur?"eyeOff":"eye"} size={14}/></button>
            }
          />
        </Field>
        <Field label="Nueva contraseña" icon="lock" required hint="Mínimo 4 caracteres">
          <Input
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            value={next}
            onChange={(e:any)=>setNext(e.target.value)}
            leftIcon="lock"
            rightSlot={
              <button type="button" onClick={()=>setShowNew(p=>!p)} style={{
                background:"transparent",border:"none",cursor:"pointer",
                padding:6,color:"var(--fg-subtle)",borderRadius:6,
              }}><Icon name={showNew?"eyeOff":"eye"} size={14}/></button>
            }
          />
        </Field>
        <Field label="Confirmar nueva contraseña" icon="lock" required>
          <Input
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            value={confirm}
            onChange={(e:any)=>setConfirm(e.target.value)}
            leftIcon="lock"
          />
        </Field>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
