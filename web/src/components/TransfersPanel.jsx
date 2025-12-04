import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const ROLE_LABELS = {
  1: "Productor",
  2: "Fábrica",
  3: "Retailer",
  4: "Consumidor",
};

const TransfersPanel = ({ account, user, onTransferAccepted }) => {
  const { contract } = useWeb3();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTransfers = async () => {
    if (!account || !contract) return;

    setLoading(true);
    setError(null);

    try {
      
      // Obtener eventos de transferencias
      const filter = contract.filters.TransferCreated();
      const events = await contract.queryFilter(filter, 0);
      
      const allTransfers = [];
      
      for (const event of events) {
        try {
          const transferId = Number(event.args[0]);
          const transferData = await contract.transfers(transferId);
          
          const fromAddress = transferData.from.toLowerCase();
          const toAddress = transferData.to.toLowerCase();
          const currentAddress = account.toLowerCase();
          
          // Solo mostrar transferencias donde el usuario es from o to
          if (fromAddress === currentAddress || toAddress === currentAddress) {
            allTransfers.push({
              id: transferId,
              tokenId: Number(transferData.tokenId),
              from: transferData.from,
              to: transferData.to,
              amount: Number(transferData.amount),
              status: Number(transferData.status), // 0=Pending, 1=Accepted, 2=Rejected
              timestamp: Number(transferData.timestamp),
              isIncoming: toAddress === currentAddress,
              isOutgoing: fromAddress === currentAddress,
            });
          }
        } catch (err) {
          console.error('Error procesando transferencia:', err);
        }
      }
      
      // Ordenar por timestamp descendente
      allTransfers.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransfers(allTransfers);
    } catch (error) {
      console.error('Error cargando transferencias:', error);
      setError('Error al cargar transferencias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && contract && user) {
      loadTransfers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contract, user]);

  const handleAccept = async (transferId) => {
    if (!contract) return;
    
    setActionLoading(true);
    setError(null);

    try {
      const tx = await contract.acceptTransfer(transferId);
      await tx.wait();
      
      // Recargar transferencias
      await loadTransfers();
      
      // Recargar inventario de productos del padre (UserDashboard)
      if (onTransferAccepted) {
        await onTransferAccepted();
      }
    } catch (error) {
      console.error('Error aceptando transferencia:', error);
      setError('Error al aceptar la transferencia.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (transferId) => {
    if (!contract) return;
    
    setActionLoading(true);
    setError(null);

    try {
      const tx = await contract.rejectTransfer(transferId);
      await tx.wait();
      
      // Recargar transferencias
      await loadTransfers();
    } catch (error) {
      console.error('Error rechazando transferencia:', error);
      setError('Error al rechazar la transferencia.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingIncoming = transfers.filter(t => t.isIncoming && t.status === 0);
  const pendingOutgoing = transfers.filter(t => t.isOutgoing && t.status === 0);
  const completed = transfers.filter(t => t.status !== 0);

  return (
    <div style={{ marginTop: "20px" }}>
      {/* Transferencias Pendientes Entrantes */}
      {pendingIncoming.length > 0 && (
        <Card style={{ marginBottom: "20px" }}>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                📥 Transferencias Recibidas Pendientes
              </CardTitle>
              <Badge variant="warning">{pendingIncoming.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingIncoming.map((transfer) => (
                <div
                  key={transfer.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "#fffbeb",
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#111827", fontWeight: "600" }}>
                      Token ID: #{transfer.tokenId}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                      De: <span style={{ fontFamily: "monospace" }}>{transfer.from.slice(0, 8)}...{transfer.from.slice(-6)}</span>
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                      Cantidad: <strong>{transfer.amount}</strong>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAccept(transfer.id)}
                      disabled={actionLoading}
                    >
                      ✅ Aceptar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(transfer.id)}
                      disabled={actionLoading}
                    >
                      ❌ Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transferencias Pendientes Salientes */}
      {pendingOutgoing.length > 0 && (
        <Card style={{ marginBottom: "20px" }}>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                📤 Transferencias Enviadas Pendientes
              </CardTitle>
              <Badge variant="info">{pendingOutgoing.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingOutgoing.map((transfer) => (
                <div
                  key={transfer.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "#f0f9ff",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px", color: "#111827", fontWeight: "600" }}>
                    Token ID: #{transfer.tokenId}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                    Para: <span style={{ fontFamily: "monospace" }}>{transfer.to.slice(0, 8)}...{transfer.to.slice(-6)}</span>
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                    Cantidad: <strong>{transfer.amount}</strong>
                  </p>
                  <Badge variant="warning" style={{ marginTop: "8px" }}>
                    ⏳ Esperando aceptación
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Transferencias */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle style={{ margin: 0 }}>📜 Historial de Transferencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {completed.slice(0, 5).map((transfer) => (
                <div
                  key={transfer.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px",
                    backgroundColor: transfer.status === 1 ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#111827" }}>
                        Token #{transfer.tokenId} - {transfer.amount} unidades
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                        {transfer.isIncoming ? "De" : "Para"}: {transfer.isIncoming ? transfer.from : transfer.to}
                      </p>
                    </div>
                    <Badge variant={transfer.status === 1 ? "success" : "error"}>
                      {transfer.status === 1 ? "✅ Aceptada" : "❌ Rechazada"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
          <p>Cargando transferencias...</p>
        </div>
      )}

      {!loading && transfers.length === 0 && (
        <Card>
          <CardContent style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
              No hay transferencias todavía
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#991b1b",
            border: "1px solid #fecaca",
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default TransfersPanel;

