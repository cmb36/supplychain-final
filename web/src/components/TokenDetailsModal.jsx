import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const ROLE_LABELS = [
  "Sin rol",
  "Productor",
  "Fábrica",
  "Retailer",
  "Consumidor",
  "Administrador"
];

const TokenDetailsModal = ({ tokenId, onClose }) => {
  const { contract, account } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [balance, setBalance] = useState(0);
  const [parentTokens, setParentTokens] = useState([]);
  const [childTokens, setChildTokens] = useState([]);
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    if (!contract || !tokenId) return;

    const loadTokenDetails = async () => {
      try {
        setLoading(true);

        // 1. Cargar información básica del token
        const [id, name, features, parentId, creator] = await contract.getTokenInfo(tokenId);
        const bal = await contract.getTokenBalance(tokenId, account);

        setTokenInfo({
          id: Number(id),
          name,
          features,
          parentId: Number(parentId),
          creator,
        });
        setBalance(Number(bal));

        // 2. Cargar trazabilidad hacia atrás (padres)
        const lineage = await contract.traceLineage(tokenId);
        const parents = [];
        
        for (const parentIdBig of lineage) {
          const parentIdNum = Number(parentIdBig);
          if (parentIdNum === 0) continue;
          
          try {
            const [pId, pName, pFeatures, pParentId, pCreator] = await contract.getTokenInfo(parentIdNum);
            parents.push({
              id: Number(pId),
              name: pName,
              features: pFeatures,
              parentId: Number(pParentId),
              creator: pCreator,
            });
          } catch (err) {
            console.error(`Error loading parent token ${parentIdNum}:`, err);
          }
        }
        setParentTokens(parents);

        // 3. Buscar tokens hijos (trazabilidad hacia adelante)
        // Para esto, necesitamos buscar todos los eventos TokenCreated y filtrar los que tienen este token como padre
        try {
          const filter = contract.filters.TokenCreated();
          const events = await contract.queryFilter(filter, 0);
          
          const children = [];
          const tokenIdStr = tokenId.toString();
          
          for (const event of events) {
            try {
              const createdTokenId = Number(event.args[0]);
              const [cId, cName, cFeatures, cParentId, cCreator] = await contract.getTokenInfo(createdTokenId);
              
              // Si este token es el padre del token creado, agregarlo
              if (Number(cParentId).toString() === tokenIdStr) {
                children.push({
                  id: Number(cId),
                  name: cName,
                  features: cFeatures,
                  parentId: Number(cParentId),
                  creator: cCreator,
                });
              }
            } catch (err) {
              // Token puede no existir más o error al obtenerlo
              continue;
            }
          }
          
          setChildTokens(children);
        } catch (err) {
          console.error("Error loading child tokens:", err);
        }

        // 4. Cargar transferencias del token
        try {
          const filter = contract.filters.TransferCreated(null, tokenId);
          const events = await contract.queryFilter(filter, 0);
          
          const transfersData = [];
          
          for (const event of events) {
            try {
              const transferId = Number(event.args[0]);
              const transferData = await contract.transfers(transferId);
              
              // Solo mostrar transferencias aceptadas (status 2)
              if (Number(transferData.status) === 2) {
                transfersData.push({
                  id: Number(transferData.id),
                  from: transferData.from,
                  to: transferData.to,
                  amount: Number(transferData.amount),
                  timestamp: Number(transferData.timestamp),
                });
              }
            } catch (err) {
              console.error(`Error loading transfer:`, err);
            }
          }
          
          // Ordenar por timestamp (más recientes primero)
          transfersData.sort((a, b) => b.timestamp - a.timestamp);
          setTransfers(transfersData);
        } catch (err) {
          console.error("Error loading transfers:", err);
        }

      } catch (err) {
        console.error("Error loading token details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTokenDetails();
  }, [contract, tokenId, account]);

  if (loading) {
    return (
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
        }}
        onClick={onClose}
      >
        <Card
          style={{
            maxWidth: "800px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            margin: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent style={{ padding: "40px", textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                border: "4px solid #3b82f6",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ marginTop: "16px", color: "#6b7280" }}>Cargando detalles del token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
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
        }}
        onClick={onClose}
      >
        <Card
          style={{
            maxWidth: "500px",
            width: "90%",
            margin: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>❌</p>
            <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
              No se pudo cargar la información del token
            </p>
            <Button onClick={onClose}>Cerrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRawMaterial = tokenInfo.parentId === 0;

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
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
        onClick={onClose}
      >
        <div
          style={{
            maxWidth: "900px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "24px 28px",
              borderBottom: "2px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              backgroundColor: "#f9fafb",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#111827" }}>
                  {tokenInfo.name}
                </h2>
                <Badge variant={isRawMaterial ? "success" : "info"}>
                  {isRawMaterial ? "🌾 Materia Prima" : "🏭 Producto Procesado"}
                </Badge>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Token ID: #{tokenInfo.id}</p>
              {tokenInfo.creator.toLowerCase() === account?.toLowerCase() && (
                <Badge variant="success" style={{ marginTop: "8px", fontSize: "11px" }}>
                  ✅ Tu creaste este token
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              style={{ marginLeft: "16px" }}
            >
              ✕ Cerrar
            </Button>
          </div>

          {/* Content */}
          <div style={{ padding: "24px 28px" }}>
            {/* Información Básica */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                marginBottom: "24px",
                border: "1px solid #bae6fd",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600", color: "#0c4a6e" }}>
                📋 Información Básica
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#075985", fontWeight: "500" }}>
                    Tu Balance
                  </p>
                  <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0284c7" }}>
                    {balance}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#075985", fontWeight: "500" }}>
                    Creador
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#0c4a6e",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {tokenInfo.creator.slice(0, 10)}...{tokenInfo.creator.slice(-8)}
                  </p>
                </div>
              </div>
              {tokenInfo.features && (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#075985", fontWeight: "500" }}>
                    Descripción
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#0c4a6e", lineHeight: "1.6" }}>
                    {tokenInfo.features}
                  </p>
                </div>
              )}
            </div>

            {/* Trazabilidad hacia atrás (Padres/Materias Primas) */}
            {parentTokens.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                  ⬅️ Trazabilidad hacia Atrás
                  <span style={{ fontSize: "13px", fontWeight: "400", color: "#6b7280" }}>
                    (Materias primas utilizadas)
                  </span>
                </h3>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {parentTokens.map((parent) => (
                    <div
                      key={parent.id}
                      style={{
                        padding: "12px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        marginBottom: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                            {parent.name}
                          </p>
                          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                            ID: #{parent.id}
                          </p>
                          {parent.features && (
                            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>
                              {parent.features}
                            </p>
                          )}
                        </div>
                        <Badge variant="success" style={{ fontSize: "11px" }}>
                          🌾 Materia Prima
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trazabilidad hacia adelante (Productos creados a partir de este token) */}
            {isRawMaterial && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                  ➡️ Trazabilidad hacia Adelante
                  <span style={{ fontSize: "13px", fontWeight: "400", color: "#6b7280" }}>
                    (Productos creados con esta materia prima)
                  </span>
                </h3>
                {childTokens.length > 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#eff6ff",
                      borderRadius: "8px",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {childTokens.map((child) => (
                      <div
                        key={child.id}
                        style={{
                          padding: "12px",
                          backgroundColor: "white",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                              {child.name}
                            </p>
                            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                              ID: #{child.id}
                            </p>
                            {child.features && (
                              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>
                                {child.features}
                              </p>
                            )}
                          </div>
                          <Badge variant="info" style={{ fontSize: "11px" }}>
                            🏭 Procesado
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "24px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "32px", margin: "0 0 8px 0" }}>🏭</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                      Esta materia prima aún no se ha usado para crear productos procesados
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Historial de Transferencias */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                📤 Historial de Transferencias
                {transfers.length > 0 && (
                  <Badge variant="neutral" style={{ fontSize: "11px" }}>
                    {transfers.length} {transfers.length === 1 ? "transferencia" : "transferencias"}
                  </Badge>
                )}
              </h3>
              {transfers.length > 0 ? (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {transfers.map((transfer) => {
                    const date = new Date(transfer.timestamp * 1000);
                    return (
                      <div
                        key={transfer.id}
                        style={{
                          padding: "12px",
                          backgroundColor: "white",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "14px" }}>📤</span>
                            <Badge variant="success" style={{ fontSize: "11px" }}>
                              Completada
                            </Badge>
                          </div>
                          <p style={{ margin: 0, fontSize: "11px", color: "#78350f" }}>
                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                          </p>
                        </div>
                        <div style={{ fontSize: "12px", color: "#78350f" }}>
                          <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <strong>De:</strong>
                            <span style={{ fontFamily: "monospace" }}>
                              {transfer.from.slice(0, 8)}...{transfer.from.slice(-6)}
                            </span>
                            {transfer.from.toLowerCase() === account?.toLowerCase() && (
                              <Badge variant="info" style={{ fontSize: "10px" }}>Tú</Badge>
                            )}
                          </div>
                          <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <strong>Para:</strong>
                            <span style={{ fontFamily: "monospace" }}>
                              {transfer.to.slice(0, 8)}...{transfer.to.slice(-6)}
                            </span>
                            {transfer.to.toLowerCase() === account?.toLowerCase() && (
                              <Badge variant="info" style={{ fontSize: "10px" }}>Tú</Badge>
                            )}
                          </div>
                          <div>
                            <strong>Cantidad:</strong> {transfer.amount} unidades
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "24px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "32px", margin: "0 0 8px 0" }}>📭</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                    Este token no ha sido transferido todavía
                  </p>
                </div>
              )}
            </div>

            {/* Botón cerrar al final */}
            <div style={{ textAlign: "center", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
              <Button onClick={onClose} variant="outline" style={{ minWidth: "200px" }}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenDetailsModal;
