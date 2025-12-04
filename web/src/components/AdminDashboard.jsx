import { useState } from "react";

const AdminDashboard = ({ account, adminAddress }) => {
  const [adminError, setAdminError] = useState(null);

  return (
    <div>
      {/* Header del Panel de Admin */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "2px solid #0ea5e9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            👑
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                color: "#111827",
                fontWeight: "700",
                lineHeight: "1.2",
              }}
            >
              Panel de Administrador
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
              Gestiona usuarios y permisos del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Grid de información */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {/* Card: Guía Rápida */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#111827", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            💡 Funciones del Admin
          </h3>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#6b7280", lineHeight: "1.8" }}>
            <li>Los usuarios solicitan roles desde sus cuentas</li>
            <li>Puedes aprobar/rechazar usuarios</li>
            <li>Usa herramientas como Etherscan, Cast o la consola</li>
            <li>Los usuarios aprobados acceden inmediatamente</li>
          </ul>
        </div>

        {/* Card: Funciones del Contrato */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#111827", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            📋 Funciones Disponibles
          </h3>
          <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ padding: "8px", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
              <code style={{ color: "#0ea5e9", fontWeight: "600" }}>approveUser(userId, role)</code>
              <p style={{ margin: "4px 0 0 0", color: "#6b7280" }}>Aprueba usuario con rol</p>
            </div>
            <div style={{ padding: "8px", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
              <code style={{ color: "#0ea5e9", fontWeight: "600" }}>rejectUser(userId)</code>
              <p style={{ margin: "4px 0 0 0", color: "#6b7280" }}>Rechaza solicitud</p>
            </div>
            <div style={{ padding: "8px", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
              <code style={{ color: "#0ea5e9", fontWeight: "600" }}>deactivateUser(userId)</code>
              <p style={{ margin: "4px 0 0 0", color: "#6b7280" }}>Desactiva usuario</p>
            </div>
          </div>
        </div>
      </div>

      {adminError && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#991b1b",
            border: "1px solid #fecaca",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>⚠️</span>
          <span>{adminError}</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

