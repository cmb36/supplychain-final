import { useState } from "react";
import { getContract } from "../contract";
import RegisterSection from "../RegisterSection";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import Label from "./ui/Label";

const ROLE_LABELS = [
  "Sin rol",
  "Productor",
  "Fábrica",
  "Retailer",
  "Consumidor",
];

const STATUS_LABELS = [
  "Sin estado",
  "Pendiente",
  "Aprobado",
  "Rechazado",
  "Inactivo",
];

const ROLE_ICONS = {
  1: "🌾", // Producer
  2: "🏭", // Factory
  3: "🏪", // Retailer
  4: "🛒", // Consumer
};

const UserDashboard = ({ account, user, loadingUser, onReloadUser, myTokens, loadingTokens, tokensError, onReloadTokens, hasAdmin }) => {
  const [producerName, setProducerName] = useState("");
  const [producerSupply, setProducerSupply] = useState("");
  const [producerFeatures, setProducerFeatures] = useState("");
  const [producerLoading, setProducerLoading] = useState(false);
  const [producerError, setProducerError] = useState(null);
  const [producerSuccess, setProducerSuccess] = useState(null);

  const roleLabel = user ? ROLE_LABELS[Number(user.role)] : "Sin rol";
  const statusLabel = user ? STATUS_LABELS[Number(user.status)] : "Sin estado";
  const roleIcon = user ? ROLE_ICONS[Number(user.role)] || "👤" : "👤";

  const createProduct = async () => {
    if (!account) {
      setProducerError("Primero conecta tu wallet.");
      return;
    }

    try {
      setProducerError(null);
      setProducerSuccess(null);
      setProducerLoading(true);

      const { contract } = await getContract();

      if (!producerName.trim()) {
        setProducerError("El nombre del producto es obligatorio.");
        return;
      }
      if (!producerSupply || Number(producerSupply) <= 0) {
        setProducerError("La cantidad (supply) debe ser mayor a 0.");
        return;
      }

      const featuresText = producerFeatures.trim();
      const parentId = 0;

      const tx = await contract.createToken(
        producerName,
        featuresText,
        parentId,
        Number(producerSupply)
      );

      await tx.wait();

      setProducerSuccess(`Producto "${producerName}" creado exitosamente!`);
      
      // Recargar inventario
      if (onReloadTokens) {
        await onReloadTokens();
      }

      // Limpiar formulario
      setProducerName("");
      setProducerSupply("");
      setProducerFeatures("");
    } catch (err) {
      console.error("Error al crear producto:", err);
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setProducerError("Transacción cancelada en MetaMask.");
      } else {
        setProducerError("No se pudo crear el producto. Revisa la consola.");
      }
    } finally {
      setProducerLoading(false);
    }
  };

  const isApproved = user && Number(user.status) === 2;
  const isPending = user && Number(user.status) === 1;
  const isRejected = user && Number(user.status) === 3;
  const isProducer = user && Number(user.role) === 1;

  return (
    <div>
      {/* Tarjeta de Información del Usuario */}
      <div
        style={{
          marginTop: "16px",
          backgroundColor: "#f9fafb",
          borderRadius: "12px",
          padding: "24px 28px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "32px" }}>{roleIcon}</span>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                color: "#111827",
              }}
            >
              Mi Usuario
            </h2>
          </div>
          {account && (
            <Button
              onClick={onReloadUser}
              disabled={loadingUser}
              variant="secondary"
              size="sm"
            >
              {loadingUser ? "⏳ Recargando..." : "🔄 Recargar"}
            </Button>
          )}
        </div>

        {loadingUser ? (
          <p style={{ color: "#6b7280" }}>Cargando información del usuario...</p>
        ) : user ? (
          <>
            <div
              style={{
                backgroundColor: isApproved ? "#dcfce7" : isPending ? "#fef3c7" : "#fee2e2",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Rol</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "600", color: "#111827" }}>
                    {roleLabel}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Estado</p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "20px",
                      fontWeight: "700",
                      color: isApproved ? "#16a34a" : isPending ? "#ca8a04" : "#dc2626",
                    }}
                  >
                    {statusLabel}
                  </p>
                </div>
              </div>
            </div>

            {isPending && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fffbeb",
                  borderLeft: "4px solid #f59e0b",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "#92400e",
                }}
              >
                ⏳ Tu solicitud está pendiente. El administrador debe aprobarla para que puedas usar el sistema.
              </div>
            )}

            {isRejected && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fef2f2",
                  borderLeft: "4px solid #dc2626",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "#991b1b",
                }}
              >
                ❌ Tu solicitud fue rechazada por el administrador. Contacta al soporte si crees que es un error.
              </div>
            )}

            {isApproved && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f0fdf4",
                  borderLeft: "4px solid #16a34a",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "#166534",
                }}
              >
                ✅ ¡Tu cuenta está aprobada! Puedes usar todas las funcionalidades del sistema.
              </div>
            )}
          </>
        ) : account ? (
          <div
            style={{
              backgroundColor: "#fef3c7",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#92400e", margin: 0, fontSize: "14px", fontWeight: "500" }}>
              ℹ️ Esta cuenta no está registrada en el sistema. Usa el formulario de abajo para solicitar un rol.
            </p>
          </div>
        ) : (
          <p style={{ color: "#6b7280" }}>Conecta tu wallet para ver tu información de usuario.</p>
        )}
      </div>

      {/* Formulario de Registro (solo si no tiene usuario) */}
      {account && !user && <RegisterSection account={account} hasAdmin={hasAdmin} onRegisterSuccess={onReloadUser} />}

      {/* Panel de Productor - Crear Productos */}
      {isApproved && isProducer && (
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "#f0fdf4",
            borderRadius: "12px",
            padding: "24px 28px",
            border: "2px solid #16a34a",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "20px", color: "#166534" }}>
            🌾 Crear Producto (Productor)
          </h3>

          <p style={{ fontSize: "14px", color: "#15803d", marginBottom: "16px" }}>
            Como productor, puedes crear materias primas que serán el inicio de la cadena de suministro.
          </p>

          <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px" }}>
            <div style={{ marginBottom: "16px" }}>
              <Label htmlFor="product-name" required>
                Nombre del producto
              </Label>
              <Input
                id="product-name"
                type="text"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                placeholder="Ej: Leche fresca, Trigo orgánico"
                disabled={producerLoading}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <Label htmlFor="product-supply" required>
                Cantidad (supply)
              </Label>
              <Input
                id="product-supply"
                type="number"
                min="1"
                value={producerSupply}
                onChange={(e) => setProducerSupply(e.target.value)}
                placeholder="Ej: 1000"
                disabled={producerLoading}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Label htmlFor="product-description">
                Descripción del producto
              </Label>
              <Textarea
                id="product-description"
                value={producerFeatures}
                onChange={(e) => setProducerFeatures(e.target.value)}
                placeholder="Ej: Leche orgánica certificada, origen: granja Los Pinos"
                disabled={producerLoading}
                rows={3}
              />
            </div>

            <Button
              onClick={createProduct}
              disabled={producerLoading}
              variant="success"
              style={{ width: "100%" }}
            >
              {producerLoading ? "⏳ Creando producto..." : "✨ Crear Producto"}
            </Button>

            {producerSuccess && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "#dcfce7",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#166534",
                }}
              >
                {producerSuccess}
              </div>
            )}

            {producerError && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "#fee2e2",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#991b1b",
                }}
              >
                {producerError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventario de Productos */}
      {isApproved && (
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px 28px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "20px", color: "#111827" }}>📦 Mis Productos</h3>
            {account && (
              <Button
                onClick={onReloadTokens}
                disabled={loadingTokens}
                variant="secondary"
                size="sm"
              >
                {loadingTokens ? "⏳ Recargando..." : "🔄 Recargar"}
              </Button>
            )}
          </div>

          {loadingTokens && <p style={{ color: "#6b7280" }}>Cargando productos...</p>}

          {tokensError && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee2e2",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#991b1b",
              }}
            >
              {tokensError}
            </div>
          )}

          {!loadingTokens && !tokensError && myTokens.length === 0 && (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "40px", margin: "0 0 8px 0" }}>📭</p>
              <p style={{ color: "#6b7280", margin: 0 }}>Todavía no tienes productos creados.</p>
            </div>
          )}

          {!loadingTokens && !tokensError && myTokens.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "8px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      Nombre
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      Descripción
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myTokens.map((token) => (
                    <tr key={token.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          color: "#111827",
                          fontWeight: "500",
                        }}
                      >
                        #{token.id}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#111827" }}>
                        {token.name}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#6b7280" }}>
                        {token.features || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          color: "#16a34a",
                          fontWeight: "600",
                          textAlign: "right",
                        }}
                      >
                        {token.balance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

