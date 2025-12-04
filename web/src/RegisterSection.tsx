import React, { useState } from "react";
import { getContract } from "./contract";

interface RegisterSectionProps {
  account: string | null;
}

const RegisterSection: React.FC<RegisterSectionProps> = ({ account }) => {
  const [role, setRole] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const { contract } = await getContract();

      // Enum Role en Solidity:
      // 0 = None, 1 = Producer, 2 = Factory, 3 = Retailer, 4 = Consumer
      const tx = await contract.requestUserRole(role);
      await tx.wait();

      alert("Solicitud enviada. Espera la aprobación del Admin.");
    } catch (err: any) {
      console.error("Error al solicitar el rol:", err);
      setError("Error al solicitar el rol. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "1rem", marginTop: "1rem" }}>
      <h2>Registro de usuario</h2>
      <p>Selecciona el rol con el que quieres registrarte en la cadena.</p>

      <select
        value={role}
        onChange={(e) => setRole(Number(e.target.value))}
        style={{ marginRight: "0.5rem" }}
      >
        <option value={0}>-- Selecciona un rol --</option>
        <option value={1}>Productor</option>
        <option value={2}>Fábrica</option>
        <option value={3}>Retailer</option>
        <option value={4}>Consumidor</option>
      </select>

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Enviando..." : "Solicitar registro"}
      </button>

      {error && (
        <p style={{ marginTop: "0.5rem", color: "red" }}>{error}</p>
      )}
    </div>
  );
};

export default RegisterSection;
