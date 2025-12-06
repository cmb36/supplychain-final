import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import RegisterSection from "../RegisterSection";
import TransfersPanel from "./TransfersPanel";
import TokenDetailsModal from "./TokenDetailsModal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import Label from "./ui/Label";

const ROLE_LABELS = [
  "Sin rol",
  "Productor",
  "Fábrica",
  "Comerciante",
  "Consumidor",
  "Administrador",
];

const STATUS_LABELS = [
  "Sin estado",
  "Pendiente",
  "Aprobado",
  "Rechazado",
  "Inactivo",
];

const ROLE_ICONS = {
  1: "🌾",
  2: "🏭",
  3: "🏪",
  4: "🛒",
  5: "👑",
};

const UserDashboard = ({ account, user, loadingUser, onReloadUser, hasAdmin }) => {
  const { contract } = useWeb3();

  const [myTokens, setMyTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState(null);

  const [producerName, setProducerName] = useState("");
  const [producerSupply, setProducerSupply] = useState("");
  const [producerFeatures, setProducerFeatures] = useState("");
  const [producerLoading, setProducerLoading] = useState(false);
  const [producerError, setProducerError] = useState(null);
  const [producerSuccess, setProducerSuccess] = useState(null);

  const [transferTokenId, setTransferTokenId] = useState(null);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [availableRecipients, setAvailableRecipients] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedParentId, setSelectedParentId] = useState(0);
  const [parentAmount, setParentAmount] = useState("");
  const [processedAmount, setProcessedAmount] = useState("");

  const [selectedTokenForDetails, setSelectedTokenForDetails] = useState(null);

  const isApproved = user && Number(user.status) === 2;
  const isPending = user && Number(user.status) === 1;
  const isRejected = user && Number(user.status) === 3;

  const userRole = user ? Number(user.role) : 0;
  const isProducer = userRole === 1;
  const isFactory = userRole === 2;
  const isRetailer = userRole === 3;

  const canTransfer = userRole >= 1 && userRole <= 3;
  const canCreateTokens = userRole === 1 || userRole === 2;

  const loadMyProducts = async () => {
    if (!account || !contract) return;

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
          creator,
          balance: Number(balance),
        });
      }

      setMyTokens(tokens);
    } catch (err) {
      if (err?.message?.includes("No user")) {
        setMyTokens([]);
        return;
      }
      setTokensError("No se pudieron cargar tus productos.");
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (account && contract && user) {
      loadMyProducts();
    }
  }, [account, contract, user]);

  // NUEVO: Obtener destinatarios sin eventos
  const getAvailableRecipients = async (tokenId) => {
    if (!contract || !user) return [];

    const role = Number(user.role);

    const targetRole =
      role === 1 ? 2 :
      role === 2 ? 3 :
      role === 3 ? 4 :
      0;

    if (targetRole === 0) return [];

    const recipients = [];
    let userId = 1;

    while (true) {
      try {
        const u = await contract.users(userId);
        const wallet = u.wallet;
        if (wallet === "0x0000000000000000000000000000000000000000") break;

        const roleVal = Number(u.role);
        const statusVal = Number(u.status);

        if (
          statusVal === 2 &&
          roleVal === targetRole &&
          wallet.toLowerCase() !== account.toLowerCase()
        ) {
          recipients.push({ address: wallet, role: roleVal });
        }
      } catch {
        break;
      }
      userId++;
    }

    return recipients;
  };

  useEffect(() => {
    const load = async () => {
      if (!transferTokenId) return;
      const list = await getAvailableRecipients(transferTokenId);
      setAvailableRecipients(list);
    };
    load();
  }, [transferTokenId, account, user]);

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
        setProducerError("El nombre es obligatorio.");
        return;
      }

      let parentId = 0;
      let amountToCreate = 0;
      let parentAmountToUse = 0;

      if (isProducer) {
        if (!producerSupply || Number(producerSupply) <= 0) {
          setProducerError("El supply debe ser mayor a 0.");
          return;
        }
        amountToCreate = Number(producerSupply);
      }

      if (isFactory) {
        if (!selectedParentId) {
          setProducerError("Selecciona una materia prima.");
          return;
        }
        if (!parentAmount || Number(parentAmount) <= 0) {
          setProducerError("Cantidad de materia prima inválida.");
          return;
        }
        if (!processedAmount || Number(processedAmount) <= 0) {
          setProducerError("Cantidad procesada inválida.");
          return;
        }

        parentId = selectedParentId;
        amountToCreate = Number(processedAmount);
        parentAmountToUse = Number(parentAmount);
      }

      const tx = await contract.createToken(
        producerName.trim(),
        producerFeatures.trim(),
        parentId,
        amountToCreate,
        parentAmountToUse
      );

      await tx.wait();

      setProducerSuccess("Producto creado con éxito");
      await loadMyProducts();

      setTimeout(() => {
        setShowCreateModal(false);
        setProducerSuccess(null);
      }, 1500);
    } catch (err) {
      setProducerError("Error creando producto.");
    } finally {
      setProducerLoading(false);
    }
  };

  const startTransfer = async () => {
    if (!contract || !transferRecipient || !transferAmount) {
      setTransferError("Completa todos los campos.");
      return;
    }

    const amountNum = Number(transferAmount);
    if (amountNum <= 0) {
      setTransferError("La cantidad debe ser mayor a 0.");
      return;
    }

    const token = myTokens.find(t => t.id === transferTokenId);
    if (!token || amountNum > token.balance) {
      setTransferError("Balance insuficiente.");
      return;
    }

    try {
      setTransferLoading(true);
      const tx = await contract.transfer(transferRecipient, transferTokenId, amountNum);
      await tx.wait();

      setTransferSuccess("Transferencia enviada");
      await loadMyProducts();

      setTimeout(() => {
        setTransferTokenId(null);
        setTransferRecipient("");
        setTransferAmount("");
      }, 1500);
    } catch (err) {
      setTransferError("Error en transferencia");
    } finally {
      setTransferLoading(false);
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

  const closeTransferModal = () => {
    setTransferTokenId(null);
    setTransferRecipient("");
    setTransferAmount("");
    setTransferError(null);
    setTransferSuccess(null);
    setAvailableRecipients([]);
  };

  const myCreatedTokens = myTokens.filter(
    t => t.creator.toLowerCase() === account.toLowerCase()
  );

  const receivedMaterials = myTokens.filter(
    t => t.creator.toLowerCase() !== account.toLowerCase()
  );

  const transferableTokens = isRetailer ? myTokens : myCreatedTokens;
  const nonTransferableTokens = isRetailer ? [] : receivedMaterials;

  const rawMaterialsForProcessing = receivedMaterials.filter(
    t => t.parentId === 0 && t.balance > 0
  );

  return (
    <div>
      {user && isPending && (
        <div style={{
          padding: "14px 20px",
          backgroundColor: "#fffbeb",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          ⏳ Tu solicitud está pendiente de aprobación.
        </div>
      )}

      {user && isRejected && (
        <div style={{
          padding: "14px 20px",
          backgroundColor: "#fef2f2",
          borderLeft: "4px solid #dc2626",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          ❌ Tu solicitud fue rechazada.
        </div>
      )}

      {account && !user && (
        <RegisterSection
          account={account}
          hasAdmin={hasAdmin}
          onRegisterSuccess={onReloadUser}
        />
      )}

      {isApproved && (
        <>
          <div style={{
            marginTop: "16px",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px 28px",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h3 style={{ margin: 0 }}>📦 Mis Productos</h3>
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
                <Button onClick={loadMyProducts} size="sm">
                  🔄
                </Button>
              </div>
            </div>

            {loadingTokens && <p>Cargando productos...</p>}
            {tokensError && <p style={{ color: "red" }}>{tokensError}</p>}

            {!loadingTokens && !tokensError && myTokens.length === 0 && (
              <p>No tienes productos todavía.</p>
            )}

            {!loadingTokens && transferableTokens.length > 0 && (
              <div>
                <h4>Transferibles</h4>
                {transferableTokens.map((t) => (
                  <div key={t.id} style={{ marginBottom: "10px" }}>
                    #{t.id} — {t.name} — {t.balance}
                    <Button
                      size="sm"
                      variant="secondary"
                      style={{ marginLeft: "8px" }}
                      onClick={() => setSelectedTokenForDetails(t.id)}
                    >
                      📊 Detalles
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ marginLeft: "8px" }}
                      onClick={() => setTransferTokenId(t.id)}
                    >
                      📤 Transferir
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!loadingTokens && nonTransferableTokens.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>No transferibles</h4>
                {nonTransferableTokens.map((t) => (
                  <div key={t.id} style={{ marginBottom: "10px" }}>
                    #{t.id} — {t.name} — {t.balance}
                    <Button
                      size="sm"
                      variant="secondary"
                      style={{ marginLeft: "8px" }}
                      onClick={() => setSelectedTokenForDetails(t.id)}
                    >
                      📊 Detalles
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MODAL CREAR PRODUCTO */}
          {showCreateModal && (
            <div
              onClick={closeCreateModal}
              style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center",
                justifyContent: "center", zIndex: 1000
              }}
            >
              <Card style={{ maxWidth: "600px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                  <CardTitle>
                    {isProducer ? "🌾 Crear Materia Prima" : "🏭 Procesar Producto"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isFactory && (
                    <>
                      <Label required>Materia Prima</Label>
                      <Select
                        value={selectedParentId}
                        onChange={(e) => setSelectedParentId(Number(e.target.value))}
                      >
                        <option value={0}>Selecciona</option>
                        {rawMaterialsForProcessing.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (Disponible: {m.balance})
                          </option>
                        ))}
                      </Select>

                      {selectedParentId > 0 && (
                        <>
                          <Label required>Cantidad de materia prima</Label>
                          <Input
                            type="number"
                            min="1"
                            value={parentAmount}
                            onChange={(e) => setParentAmount(e.target.value)}
                          />
                        </>
                      )}

                      {selectedParentId > 0 && (
                        <>
                          <Label required>Cantidad procesada a crear</Label>
                          <Input
                            type="number"
                            min="1"
                            value={processedAmount}
                            onChange={(e) => setProcessedAmount(e.target.value)}
                          />
                        </>
                      )}
                    </>
                  )}

                  <Label required>Nombre</Label>
                  <Input
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                  />

                  {isProducer && (
                    <>
                      <Label required>Cantidad (supply)</Label>
                      <Input
                        type="number"
                        value={producerSupply}
                        onChange={(e) => setProducerSupply(e.target.value)}
                      />
                    </>
                  )}

                  <Label>Descripción</Label>
                  <Textarea
                    rows={3}
                    value={producerFeatures}
                    onChange={(e) => setProducerFeatures(e.target.value)}
                  />

                  <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                    <Button
                      variant="success"
                      onClick={createProduct}
                      disabled={producerLoading}
                      style={{ flex: 1 }}
                    >
                      {producerLoading ? "Creando..." : "Crear"}
                    </Button>
                    <Button onClick={closeCreateModal} variant="outline">
                      Cancelar
                    </Button>
                  </div>

                  {producerError && (
                    <p style={{ color: "red", marginTop: "10px" }}>{producerError}</p>
                  )}
                  {producerSuccess && (
                    <p style={{ color: "green", marginTop: "10px" }}>{producerSuccess}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* MODAL TRANSFERENCIA */}
          {transferTokenId && (
            <div
              onClick={closeTransferModal}
              style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center",
                justifyContent: "center", zIndex: 1000
              }}
            >
              <Card style={{ maxWidth: "500px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                  <CardTitle>📤 Transferir Token #{transferTokenId}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label required>Destinatario</Label>
                  <Select
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {availableRecipients.map((r) => (
                      <option key={r.address} value={r.address}>
                        {ROLE_LABELS[r.role]} — {r.address.slice(0, 8)}...{r.address.slice(-6)}
                      </option>
                    ))}
                  </Select>

                  <Label required>Cantidad</Label>
                  <Input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />

                  <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                    <Button
                      onClick={startTransfer}
                      disabled={!transferRecipient || !transferAmount}
                    >
                      Enviar
                    </Button>
                    <Button variant="outline" onClick={closeTransferModal}>
                      Cancelar
                    </Button>
                  </div>

                  {transferError && <p style={{ color: "red" }}>{transferError}</p>}
                  {transferSuccess && <p style={{ color: "green" }}>{transferSuccess}</p>}
                </CardContent>
              </Card>
            </div>
          )}

          <TransfersPanel
            account={account}
            user={user}
            onTransferAccepted={loadMyProducts}
          />

          {selectedTokenForDetails && (
            <TokenDetailsModal
              tokenId={selectedTokenForDetails}
              onClose={() => setSelectedTokenForDetails(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UserDashboard;