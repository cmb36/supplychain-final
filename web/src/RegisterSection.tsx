import React, { useState, useEffect } from "react";
import { getContract } from "./contract";
import Button from "./components/ui/Button";
import Select from "./components/ui/Select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/Card";

interface RegisterSectionProps {
  account: string | null;
  hasAdmin: boolean;
  onRegisterSuccess?: () => void;
}

const RegisterSection: React.FC<RegisterSectionProps> = ({ account, hasAdmin, onRegisterSuccess }) => {
  const [role, setRole] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resetear el formulario cuando cambie la cuenta
  useEffect(() => {
    setRole(0);
    setError(null);
    setSuccess(false);
  }, [account]);

  const handleRegister = async () => {
    if (!account) {
      alert("Primero conecta tu wallet.");
      return;
    }

    if (role === 0) {
      alert("Selecciona un rol antes de registrarte.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const { contract } = await getContract();

      // Si el rol es 5 (Admin), llamar a claimAdmin()
      if (role === 5) {
        const tx = await contract.claimAdmin();
        await tx.wait();
        setSuccess(true);
      } else {
        // Enum Role en Solidity:
        // 0 = None, 1 = Producer, 2 = Factory, 3 = Retailer, 4 = Consumer
        const tx = await contract.requestUserRole(role);
        await tx.wait();
        setSuccess(true);
      }
      
      // Notificar al componente padre para que recargue los datos
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }

      // Limpiar el formulario
      setRole(0);
    } catch (err: any) {
      console.error("Error al solicitar el rol:", err);
      
      // Detectar errores específicos
      if (err.message?.includes("User already registered") || 
          err.message?.includes("already registered")) {
        setError("Esta cuenta ya está registrada en el sistema.");
      } else if (err.message?.includes("Admin already exists")) {
        setError("Ya existe un administrador en el sistema.");
      } else if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setError("Transacción cancelada por el usuario.");
      } else {
        setError("Error al solicitar el rol. Revisa la consola para más detalles.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginTop: "20px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
      <CardHeader>
        <CardTitle>📝 Registro de Usuario</CardTitle>
        <CardDescription>
          Selecciona el rol con el que deseas registrarte en el sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {account && (
          <div style={{ 
            padding: "12px", 
            backgroundColor: "#f0f9ff", 
            borderRadius: "8px",
            border: "1px solid #bae6fd",
            marginBottom: "20px"
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#0c4a6e" }}>
              <strong>Cuenta:</strong>{" "}
              <span style={{ fontFamily: "monospace", fontWeight: "600" }}>
                {account.slice(0, 8)}...{account.slice(-6)}
              </span>
            </p>
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <Select
            value={role}
            onChange={(e) => setRole(Number(e.target.value))}
            disabled={loading}
          >
            <option value={0}>-- Selecciona un rol --</option>
            {!hasAdmin && <option value={5}>👑 Administrador</option>}
            <option value={1}>🌾 Productor</option>
            <option value={2}>🏭 Fábrica</option>
            <option value={3}>🏪 Retailer</option>
            <option value={4}>🛒 Consumidor</option>
          </Select>
        </div>

        <Button 
          onClick={handleRegister} 
          disabled={loading || !account || role === 0}
          variant="default"
        >
          {loading ? "⏳ Enviando..." : "✨ Solicitar Registro"}
        </Button>

        {success && (
          <div style={{ 
            marginTop: "16px", 
            padding: "12px 16px",
            backgroundColor: "#dcfce7",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "16px" }}>✅</span>
            <span style={{ fontSize: "13px", color: "#166534", fontWeight: "500" }}>
              Solicitud enviada correctamente. Espera la aprobación del Admin.
            </span>
          </div>
        )}

        {error && (
          <div style={{ 
            marginTop: "16px", 
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span style={{ fontSize: "13px", color: "#991b1b" }}>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegisterSection;
