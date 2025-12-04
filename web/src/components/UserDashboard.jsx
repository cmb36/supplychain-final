import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
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

const UserDashboard = ({ account, user, loadingUser, onReloadUser, hasAdmin }) => {
  const { contract } = useWeb3();
  
  // Estados para productos
  const [myTokens, setMyTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState(null);
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

  // Estado para modal de crear producto
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estados adicionales para Factory (selección de materia prima)
  const [selectedParentId, setSelectedParentId] = useState(0);
  const [parentAmount, setParentAmount] = useState("");
  const [processedAmount, setProcessedAmount] = useState(""); // Cantidad de producto procesado a crear

  const roleLabel = user ? ROLE_LABELS[Number(user.role)] : "Sin rol";
  const statusLabel = user ? STATUS_LABELS[Number(user.status)] : "Sin estado";
  const roleIcon = user ? ROLE_ICONS[Number(user.role)] || "👤" : "👤";

  // Cargar productos del usuario
  const loadMyProducts = async () => {
    if (!account || !contract) {
      setMyTokens([]);
      return;
    }

    try {
      setLoadingTokens(true);
      setTokensError(null);

      const ids = await contract.getUserTokens(account);
      const tokens = [];

      for (const idBig of ids) {
        const id = Number(idBig);
        if (!id) continue;

        const [tokenId, name, features, parentId, creator] = await contract.getTokenInfo(id);
        const balance = await contract.getTokenBalance(id, account);

        tokens.push({
          id: Number(tokenId),
          name,
          features,
          parentId: Number(parentId),
          creator: creator,
          balance: Number(balance),
        });
      }

      setMyTokens(tokens);
    } catch (err) {
      if (err?.message?.includes("No user")) {
        setMyTokens([]);
        return;
      }
      console.error("Error al cargar productos:", err);
      setTokensError("No se pudieron cargar tus productos.");
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (account && contract && user) {
      loadMyProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contract, user]);

  const createProduct = async () => {
    if (!account || !contract) {
      setProducerError("Primero conecta tu wallet.");
      return;
    }

    try {
      setProducerError(null);
      setProducerSuccess(null);
      setProducerLoading(true);

      if (!producerName.trim()) {
        setProducerError("El nombre del producto es obligatorio.");
        setProducerLoading(false);
        return;
      }

      // Validaciones específicas para Producer
      if (isProducer) {
        if (!producerSupply || Number(producerSupply) <= 0) {
          setProducerError("La cantidad (supply) debe ser mayor a 0.");
          setProducerLoading(false);
          return;
        }
      }

      // Validaciones específicas para Factory
      if (isFactory) {
        if (!selectedParentId || selectedParentId === 0) {
          setProducerError("Debes seleccionar una materia prima para procesar.");
          setProducerLoading(false);
          return;
        }
        
        if (!parentAmount || Number(parentAmount) <= 0) {
          setProducerError("Especifica cuánta materia prima vas a utilizar.");
          setProducerLoading(false);
          return;
        }

        if (!processedAmount || Number(processedAmount) <= 0) {
          setProducerError("Especifica cuántos productos procesados vas a crear.");
          setProducerLoading(false);
          return;
        }

        const parentToken = myTokens.find(t => t.id === selectedParentId);
        if (!parentToken) {
          setProducerError("Materia prima no encontrada.");
          setProducerLoading(false);
          return;
        }

        if (Number(parentAmount) > parentToken.balance) {
          setProducerError(`No tienes suficiente materia prima. Disponible: ${parentToken.balance}`);
          setProducerLoading(false);
          return;
        }
      }

      const featuresText = producerFeatures.trim();
      let parentId = 0;
      let amountToCreate = 0;
      
      if (isFactory) {
        parentId = selectedParentId;
        amountToCreate = Number(processedAmount); // Cantidad de producto procesado a crear
        // amountToUse (parentAmount) se usa para validación, pero el contrato descuenta automáticamente
      } else {
        parentId = 0;
        amountToCreate = Number(producerSupply);
      }

      const tx = await contract.createToken(
        producerName,
        featuresText,
        parentId,
        amountToCreate
      );

      await tx.wait();

      setProducerSuccess(`Producto "${producerName}" creado exitosamente!`);
      
      // Recargar inventario
      await loadMyProducts();

      // Limpiar formulario y cerrar modal
      setProducerName("");
      setProducerSupply("");
      setProducerFeatures("");
      setSelectedParentId(0);
      setParentAmount("");
      setProcessedAmount("");
      
      // Cerrar modal después de un pequeño delay
      setTimeout(() => {
        setShowCreateModal(false);
        setProducerSuccess(null);
      }, 2000);
    } catch (err) {
      console.error("Error al crear producto:", err);
      
      const errorMessage = err?.message || '';
      
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setProducerError("Transacción cancelada en MetaMask.");
      } else if (errorMessage.includes("Insufficient parent balance")) {
        setProducerError("No tienes suficiente balance de la materia prima seleccionada.");
      } else if (errorMessage.includes("Only Factory for derived")) {
        setProducerError("Solo las fábricas pueden crear productos derivados.");
      } else if (errorMessage.includes("Only Producer for raw")) {
        setProducerError("Solo los productores pueden crear materias primas.");
      } else if (errorMessage.includes("Parent token missing")) {
        setProducerError("La materia prima seleccionada no existe.");
      } else {
        setProducerError("No se pudo crear el producto. Revisa la consola.");
      }
    } finally {
      setProducerLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setProducerName("");
    setProducerSupply("");
    setProducerFeatures("");
    setSelectedParentId(0);
    setParentAmount("");
    setProcessedAmount("");
    setProducerError(null);
    setProducerSuccess(null);
  };

  // Separar tokens que YO creé (transferibles) vs tokens que RECIBÍ (solo para procesar)
  const myCreatedTokens = myTokens.filter(t => t.creator && t.creator.toLowerCase() === account?.toLowerCase());
  const receivedMaterials = myTokens.filter(t => t.creator && t.creator.toLowerCase() !== account?.toLowerCase());
  
  // Obtener materias primas recibidas disponibles para procesar (que NO creé yo)
  const rawMaterialsForProcessing = receivedMaterials.filter(t => t.parentId === 0 && t.balance > 0);

  const isApproved = user && Number(user.status) === 2;
  const isPending = user && Number(user.status) === 1;
  const isRejected = user && Number(user.status) === 3;
  const isProducer = user && Number(user.role) === 1;
  const isFactory = user && Number(user.role) === 2;
  const userRole = user ? Number(user.role) : 0;
  const canTransfer = userRole >= 1 && userRole <= 3; // Producer, Factory, Retailer pueden transferir
  const canCreateTokens = userRole === 1 || userRole === 2; // Producer y Factory pueden crear tokens

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

        if (!contract) return;
        
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
    if (!contract || !transferRecipient || !transferAmount || !transferTokenId) {
      setTransferError("Completa todos los campos.");
      return;
    }

    const amountNum = Number(transferAmount);
    if (amountNum <= 0) {
      setTransferError("La cantidad debe ser mayor a 0.");
      return;
    }

    // Validar balance antes de intentar la transferencia
    const token = myTokens.find(t => t.id === transferTokenId);
    if (!token) {
      setTransferError("Token no encontrado.");
      return;
    }

    if (amountNum > token.balance) {
      setTransferError(`Balance insuficiente. Solo tienes ${token.balance} unidades disponibles.`);
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const tx = await contract.transfer(transferRecipient, transferTokenId, amountNum);
      await tx.wait();
      
      setTransferSuccess("Transferencia enviada. El destinatario debe aceptarla.");
      
      // Recargar productos
      await loadMyProducts();
      
      // Cerrar modal después de un delay
      setTimeout(() => {
        setTransferTokenId(null);
        setTransferRecipient("");
        setTransferAmount("");
        setTransferSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Error en transferencia:', error);
      
      const errorMessage = error?.message || '';
      
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        setTransferError("Transacción cancelada en MetaMask.");
      } else if (errorMessage.includes("Insufficient balance")) {
        setTransferError("Balance insuficiente para esta transferencia.");
      } else if (errorMessage.includes("Invalid next role") || errorMessage.includes("Invalid role")) {
        setTransferError("No puedes transferir a este usuario. Verifica que tenga el rol correcto en la cadena de suministro.");
      } else if (errorMessage.includes("Consumer cannot send")) {
        setTransferError("Los consumidores no pueden enviar transferencias.");
      } else if (errorMessage.includes("User not approved") || errorMessage.includes("Not approved")) {
        setTransferError("El destinatario no está aprobado en el sistema.");
      } else {
        setTransferError("Error al enviar transferencia. Revisa la consola para más detalles.");
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
      {/* Mensajes de estado (solo si hay user) */}
      {user && (
        <>
          {isPending && (
            <div
              style={{
                padding: "14px 20px",
                backgroundColor: "#fffbeb",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#92400e",
                marginBottom: "20px",
              }}
            >
              ⏳ Tu solicitud está pendiente. El administrador debe aprobarla para que puedas usar el sistema.
            </div>
          )}

          {isRejected && (
            <div
              style={{
                padding: "14px 20px",
                backgroundColor: "#fef2f2",
                borderLeft: "4px solid #dc2626",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#991b1b",
                marginBottom: "20px",
              }}
            >
              ❌ Tu solicitud fue rechazada por el administrador. Contacta al soporte si crees que es un error.
            </div>
          )}
        </>
      )}

      {/* Formulario de Registro (solo si no tiene usuario) */}
      {account && !user && <RegisterSection account={account} hasAdmin={hasAdmin} onRegisterSuccess={onReloadUser} />}

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "20px", color: "#111827" }}>📦 Mis Productos</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {canCreateTokens && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="success"
                  size="sm"
                >
                  {isProducer ? "🌾 Crear Materia Prima" : "🏭 Procesar Producto"}
                </Button>
              )}
              {account && (
                <Button
                  onClick={loadMyProducts}
                  disabled={loadingTokens}
                  variant="secondary"
                  size="sm"
                >
                  {loadingTokens ? "⏳" : "🔄"}
                </Button>
              )}
            </div>
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

          {/* Productos Creados por Mí - Solo estos se pueden transferir */}
          {!loadingTokens && !tokensError && myCreatedTokens.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#15803d", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                {isProducer ? "🌾 Mis Productos Creados" : "🏭 Mis Productos Creados"}
                <Badge variant="success" style={{ fontSize: "11px" }}>
                  ✅ Transferibles
                </Badge>
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f0fdf4", borderBottom: "2px solid #bbf7d0" }}>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#166534" }}>
                        ID
                      </th>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#166534" }}>
                        Nombre
                      </th>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#166534" }}>
                        Descripción
                      </th>
                      <th style={{ textAlign: "right", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#166534" }}>
                        Cantidad
                      </th>
                      {canTransfer && (
                        <th style={{ textAlign: "center", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#166534" }}>
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {myCreatedTokens.map((token) => (
                      <tr key={token.id} style={{ borderBottom: "1px solid #dcfce7" }}>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#111827", fontWeight: "500" }}>
                          #{token.id}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#111827" }}>
                          {token.name}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#6b7280" }}>
                          {token.features || "—"}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#16a34a", fontWeight: "600", textAlign: "right" }}>
                          {token.balance}
                        </td>
                        {canTransfer && (
                          <td style={{ padding: "10px", textAlign: "center" }}>
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
            </div>
          )}

          {/* Productos Recibidos (No transferibles) - Solo para procesamiento */}
          {!loadingTokens && !tokensError && receivedMaterials.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#6b7280", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                🧺 Productos Recibidos
                <Badge variant="warning" style={{ fontSize: "11px" }}>
                  ⚠️ No transferibles
                </Badge>
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>
                        ID
                      </th>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>
                        Nombre
                      </th>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>
                        Descripción
                      </th>
                      <th style={{ textAlign: "right", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>
                        Cantidad
                      </th>
                      <th style={{ textAlign: "center", padding: "10px", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedMaterials.map((token) => (
                      <tr key={token.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                          #{token.id}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#6b7280" }}>
                          {token.name}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#9ca3af" }}>
                          {token.features || "—"}
                        </td>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#6b7280", fontWeight: "600", textAlign: "right" }}>
                          {token.balance}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <Badge variant="neutral" style={{ fontSize: "11px" }}>
                            Recibido
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
                💡 Estos productos fueron creados por otros usuarios. Solo puedes usarlos para crear nuevos productos procesados, no puedes transferirlos.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Modal de Crear Producto */}
      {showCreateModal && (
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
          onClick={closeCreateModal}
        >
          <Card
            style={{
              maxWidth: "600px",
              width: "100%",
              margin: 0,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>
                {isProducer ? "🌾 Crear Materia Prima" : "🏭 Crear Producto Procesado"}
              </CardTitle>
              <CardDescription>
                {isProducer 
                  ? "Crea materias primas que inician la cadena de suministro" 
                  : "Procesa materias primas para crear productos terminados"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Factory: Selección de materia prima */}
              {isFactory && (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <Label htmlFor="parent-material" required>
                      Materia Prima a Procesar
                    </Label>
                    <Select
                      id="parent-material"
                      value={selectedParentId}
                      onChange={(e) => {
                        setSelectedParentId(Number(e.target.value));
                        setParentAmount(""); // Reset cantidad cuando cambia la materia prima
                      }}
                      disabled={producerLoading}
                    >
                      <option value={0}>-- Selecciona materia prima --</option>
                      {rawMaterialsForProcessing.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name} (Disponible: {material.balance})
                        </option>
                      ))}
                    </Select>
                    {rawMaterialsForProcessing.length === 0 && (
                      <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#f59e0b" }}>
                        ⚠️ No tienes materias primas recibidas para procesar. Primero debes aceptar transferencias de un Productor.
                      </p>
                    )}
                  </div>

                  {selectedParentId > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <Label htmlFor="parent-amount" required>
                        Cantidad de Materia Prima a Utilizar
                      </Label>
                  <Input
                    id="parent-amount"
                    type="number"
                    min="1"
                    max={rawMaterialsForProcessing.find(m => m.id === selectedParentId)?.balance || 0}
                    value={parentAmount}
                    onChange={(e) => setParentAmount(e.target.value)}
                    placeholder={`Máximo: ${rawMaterialsForProcessing.find(m => m.id === selectedParentId)?.balance || 0}`}
                    disabled={producerLoading}
                  />
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                    Esta cantidad se descontará de tu inventario de materias primas recibidas
                  </p>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginBottom: "16px" }}>
                <Label htmlFor="product-name" required>
                  Nombre del {isProducer ? "Producto" : "Producto Procesado"}
                </Label>
                <Input
                  id="product-name"
                  type="text"
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  placeholder={isProducer ? "Ej: Leche fresca, Trigo orgánico" : "Ej: Queso, Harina"}
                  disabled={producerLoading}
                />
              </div>

              {isProducer && (
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
              )}

              {isFactory && selectedParentId > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <Label htmlFor="processed-amount" required>
                    Cantidad de Producto Procesado a Crear
                  </Label>
                  <Input
                    id="processed-amount"
                    type="number"
                    min="1"
                    value={processedAmount}
                    onChange={(e) => setProcessedAmount(e.target.value)}
                    placeholder="Ej: 10"
                    disabled={producerLoading}
                  />
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                    Cantidad final de productos que obtendrás
                  </p>
                </div>
              )}

              {isFactory && selectedParentId > 0 && parentAmount && processedAmount && (
                <div style={{ 
                  marginBottom: "16px",
                  padding: "12px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  border: "1px solid #fde68a"
                }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#92400e", fontWeight: "600" }}>
                    📊 Resumen de Procesamiento
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#78350f" }}>
                    <strong>Usarás:</strong> {parentAmount} unidades de materia prima<br />
                    <strong>Crearás:</strong> {processedAmount} unidades de producto procesado
                  </p>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <Label htmlFor="product-description">
                  Descripción del producto
                </Label>
                <Textarea
                  id="product-description"
                  value={producerFeatures}
                  onChange={(e) => setProducerFeatures(e.target.value)}
                  placeholder={isProducer 
                    ? "Ej: Leche orgánica certificada, origen: granja Los Pinos" 
                    : "Ej: Queso procesado con leche fresca, certificación orgánica"}
                  disabled={producerLoading}
                  rows={3}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  onClick={createProduct}
                  disabled={producerLoading || (isFactory && (!selectedParentId || !parentAmount || !processedAmount))}
                  variant="success"
                  style={{ flex: 1 }}
                >
                  {producerLoading ? "⏳ Creando..." : isProducer ? "✨ Crear Materia Prima" : "🏭 Procesar Producto"}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeCreateModal}
                  disabled={producerLoading}
                >
                  Cancelar
                </Button>
              </div>

              {producerSuccess && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    backgroundColor: "#dcfce7",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    fontSize: "13px",
                    color: "#166534",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>✅</span>
                  <span>{producerSuccess}</span>
                </div>
              )}

              {producerError && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    backgroundColor: "#fee2e2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    fontSize: "13px",
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>⚠️</span>
                  <span>{producerError}</span>
                </div>
              )}
            </CardContent>
          </Card>
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
              {/* Mostrar balance disponible */}
              {myTokens.find(t => t.id === transferTokenId) && (
                <div style={{ 
                  marginBottom: "16px", 
                  padding: "12px", 
                  backgroundColor: "#f0f9ff", 
                  borderRadius: "8px",
                  border: "1px solid #bae6fd"
                }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#0c4a6e" }}>
                    <strong>Balance disponible:</strong>{" "}
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#0284c7" }}>
                      {myTokens.find(t => t.id === transferTokenId).balance}
                    </span>
                    {" "}unidades
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#075985" }}>
                    Producto: <strong>{myTokens.find(t => t.id === transferTokenId).name}</strong>
                  </p>
                </div>
              )}

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
                <Label htmlFor="amount" required>Cantidad a transferir</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={myTokens.find(t => t.id === transferTokenId)?.balance || 0}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={`Máximo: ${myTokens.find(t => t.id === transferTokenId)?.balance || 0}`}
                  disabled={transferLoading}
                />
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                  Introduce la cantidad que deseas transferir (máximo: {myTokens.find(t => t.id === transferTokenId)?.balance || 0})
                </p>
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
      {isApproved && <TransfersPanel account={account} user={user} onTransferAccepted={loadMyProducts} />}
    </div>
  );
};

export default UserDashboard;

