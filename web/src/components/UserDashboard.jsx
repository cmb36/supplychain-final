import { useState, useEffect } from "react";
import { getContract } from "../contract";
import RegisterSection from "../RegisterSection";
import TransfersPanel from "./TransfersPanel";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import Label from "./ui/Label";

const ROLE_LABELS = [
  "Sin rol",      // 0
  "Productor",    // 1
  "Fábrica",      // 2
  "Retailer",     // 3
  "Consumidor",   // 4
  "Administrador" // 5
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
  5: "👑", // Admin
};

const UserDashboard = ({ account, user, loadingUser, onReloadUser, myTokens, loadingTokens, tokensError, onReloadTokens, hasAdmin }) => {
  const [producerName, setProducerName] = useState("");
  const [producerSupply, setProducerSupply] = useState("");
  const [producerFeatures, setProducerFeatures] = useState("");
  const [producerLoading, setProducerLoading] = useState(false);
  const [producerError, setProducerError] = useState(null);
  const [producerSuccess, setProducerSuccess] = useState(null);

  // Estados para transferencia
  const [transferTokenId, setTransferTokenId] = useState(null);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [availableRecipients, setAvailableRecipients] = useState([]);

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
  const userRole = user ? Number(user.role) : 0;
  const canTransfer = userRole >= 1 && userRole <= 3; // Producer, Factory, Retailer pueden transferir

  // Obtener rol objetivo según flujo: Producer->Factory->Retailer->Consumer
  const getTargetRole = (currentRole) => {
    if (currentRole === 1) return 2; // Producer -> Factory
    if (currentRole === 2) return 3; // Factory -> Retailer
    if (currentRole === 3) return 4; // Retailer -> Consumer
    return 0; // Consumer y Admin no pueden transferir
  };

  // Cargar destinatarios disponibles
  useEffect(() => {
    const loadRecipients = async () => {
      if (!user || !transferTokenId) return;
      
      try {
        const targetRole = getTargetRole(userRole);
        if (targetRole === 0) {
          setAvailableRecipients([]);
          return;
        }

        const { contract } = await getContract();
        
        // Obtener todos los eventos UserRequested para encontrar usuarios
        const filter = contract.filters.UserRequested();
        const events = await contract.queryFilter(filter, 0);
        
        const recipients = [];
        const seenAddresses = new Set();
        
        for (const event of events) {
          try {
            const userAddress = event.args[1];
            const addressLower = userAddress.toLowerCase();
            
            // Skip si ya procesamos esta dirección o es la cuenta actual
            if (seenAddresses.has(addressLower) || addressLower === account.toLowerCase()) {
              continue;
            }
            
            // Verificar si tiene el rol objetivo y está aprobado
            const userData = await contract.getUserByAddress(userAddress);
            const role = Number(userData.role);
            const status = Number(userData.status);
            
            if (role === targetRole && status === 2) { // Status 2 = Approved
              recipients.push({
                address: userAddress,
                role: role,
              });
              seenAddresses.add(addressLower);
            }
          } catch (err) {
            console.error('Error verificando usuario:', err);
          }
        }
        
        setAvailableRecipients(recipients);
      } catch (error) {
        console.error('Error cargando destinatarios:', error);
        setAvailableRecipients([]);
      }
    };

    if (transferTokenId) {
      loadRecipients();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferTokenId, user, account]);

  // Iniciar transferencia
  const startTransfer = async () => {
    if (!transferRecipient || !transferAmount || !transferTokenId) {
      setTransferError("Completa todos los campos.");
      return;
    }

    const amountNum = Number(transferAmount);
    if (amountNum <= 0) {
      setTransferError("La cantidad debe ser mayor a 0.");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const { contract } = await getContract();
      
      const tx = await contract.transfer(transferRecipient, transferTokenId, amountNum);
      await tx.wait();
      
      setTransferSuccess("Transferencia enviada. El destinatario debe aceptarla.");
      
      // Limpiar formulario
      setTransferTokenId(null);
      setTransferRecipient("");
      setTransferAmount("");
      
      // Recargar productos
      if (onReloadTokens) {
        await onReloadTokens();
      }
    } catch (error) {
      console.error('Error en transferencia:', error);
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        setTransferError("Transacción cancelada en MetaMask.");
      } else {
        setTransferError("Error al enviar transferencia. Revisa la consola.");
      }
    } finally {
      setTransferLoading(false);
    }
  };

  // Abrir modal de transferencia
  const openTransferModal = async (tokenId) => {
    setTransferTokenId(tokenId);
    setTransferRecipient("");
    setTransferAmount("");
    setTransferError(null);
    setTransferSuccess(null);
    await loadRecipients(tokenId);
  };

  // Cerrar modal de transferencia
  const closeTransferModal = () => {
    setTransferTokenId(null);
    setTransferRecipient("");
    setTransferAmount("");
    setTransferError(null);
    setTransferSuccess(null);
    setAvailableRecipients([]);
  };

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
          maxWidth: "700px",
          marginLeft: "auto",
          marginRight: "auto",
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
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Rol</p>
                <Badge variant="info" style={{ fontSize: "14px", padding: "6px 16px" }}>
                  {roleIcon} {roleLabel}
                </Badge>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Estado</p>
                <Badge 
                  variant={isApproved ? "success" : isPending ? "warning" : "error"}
                  style={{ fontSize: "14px", padding: "6px 16px" }}
                >
                  {isApproved ? "✅" : isPending ? "⏳" : "❌"} {statusLabel}
                </Badge>
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
            maxWidth: "700px",
            marginLeft: "auto",
            marginRight: "auto",
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

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                onClick={createProduct}
                disabled={producerLoading}
                variant="success"
                size="lg"
              >
                {producerLoading ? "⏳ Creando producto..." : "✨ Crear Producto"}
              </Button>
            </div>

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
                    {canTransfer && (
                      <th
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#374151",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Acciones
                      </th>
                    )}
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
                      {canTransfer && (
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTransferModal(token.id)}
                          >
                            📤 Transferir
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Transferencia */}
      {transferTokenId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={closeTransferModal}
        >
          <Card
            style={{
              maxWidth: "500px",
              width: "100%",
              margin: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>📤 Transferir Token #{transferTokenId}</CardTitle>
              <CardDescription>
                {userRole === 1 && "Envía materias primas a una Fábrica"}
                {userRole === 2 && "Envía productos procesados a un Retailer"}
                {userRole === 3 && "Envía productos a un Consumidor"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ marginBottom: "16px" }}>
                <Label htmlFor="recipient" required>Destinatario</Label>
                <Select
                  id="recipient"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  disabled={transferLoading}
                >
                  <option value="">-- Selecciona destinatario --</option>
                  {availableRecipients.map((recipient) => (
                    <option key={recipient.address} value={recipient.address}>
                      {ROLE_LABELS[recipient.role]} - {recipient.address.slice(0, 8)}...{recipient.address.slice(-6)}
                    </option>
                  ))}
                </Select>
                {availableRecipients.length === 0 && (
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#f59e0b" }}>
                    ⚠️ No hay usuarios aprobados con el rol requerido para recibir esta transferencia.
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <Label htmlFor="amount" required>Cantidad</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Cantidad a transferir"
                  disabled={transferLoading}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="default"
                  onClick={startTransfer}
                  disabled={transferLoading || !transferRecipient || !transferAmount || availableRecipients.length === 0}
                  style={{ flex: 1 }}
                >
                  {transferLoading ? "⏳ Enviando..." : "📤 Enviar Transferencia"}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeTransferModal}
                  disabled={transferLoading}
                >
                  Cancelar
                </Button>
              </div>

              {transferSuccess && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    backgroundColor: "#dcfce7",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    fontSize: "13px",
                    color: "#166534",
                  }}
                >
                  ✅ {transferSuccess}
                </div>
              )}

              {transferError && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    backgroundColor: "#fee2e2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    fontSize: "13px",
                    color: "#991b1b",
                  }}
                >
                  ⚠️ {transferError}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panel de Transferencias */}
      {isApproved && <TransfersPanel account={account} user={user} />}
    </div>
  );
};

export default UserDashboard;

