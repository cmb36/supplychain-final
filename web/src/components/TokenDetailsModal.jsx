import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const ROLE_LABELS = [
  "Sin rol",
  "Productor",
  "Fábrica",
  "Comerciante",
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
  const [supplyChainPath, setSupplyChainPath] = useState([]);

  useEffect(() => {
    if (!contract || !tokenId) return;

    const loadTokenDetails = async () => {
      try {
        setLoading(true);

        // 1. Cargar información básica del token
        const [id, name, features, parentId, creator] = await contract.getTokenInfo(tokenId);
        const bal = await contract.getTokenBalance(tokenId, account);

        const currentTokenInfo = {
          id: Number(id),
          name,
          features,
          parentId: Number(parentId),
          creator,
        };
        
        setTokenInfo(currentTokenInfo);
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

        // 4. Cargar transferencias del token con información de usuarios
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
                // Obtener información de roles de los usuarios
                let fromRole = "Desconocido";
                let toRole = "Desconocido";
                
                try {
                  const fromUser = await contract.getUserByAddress(transferData.from);
                  fromRole = ROLE_LABELS[Number(fromUser.role)] || "Desconocido";
                } catch (e) {
                  // Usuario puede no existir
                }
                
                try {
                  const toUser = await contract.getUserByAddress(transferData.to);
                  toRole = ROLE_LABELS[Number(toUser.role)] || "Desconocido";
                } catch (e) {
                  // Usuario puede no existir
                }
                
                transfersData.push({
                  id: Number(transferData.id),
                  from: transferData.from,
                  to: transferData.to,
                  amount: Number(transferData.amount),
                  timestamp: Number(transferData.timestamp),
                  fromRole,
                  toRole,
                });
              }
            } catch (err) {
              console.error(`Error loading transfer:`, err);
            }
          }
          
          // Ordenar por timestamp (más antiguas primero para ver la ruta)
          transfersData.sort((a, b) => a.timestamp - b.timestamp);
          setTransfers(transfersData);
          
          // 5. Construir la ruta completa de la cadena de suministro
          const path = [];
          
          // Empezar con el creador original del token
          try {
            const creatorUser = await contract.getUserByAddress(currentTokenInfo.creator);
            path.push({
              address: currentTokenInfo.creator,
              role: ROLE_LABELS[Number(creatorUser.role)] || "Desconocido",
              action: "Creó el token",
              timestamp: null,
            });
          } catch (e) {
            path.push({
              address: currentTokenInfo.creator,
              role: "Desconocido",
              action: "Creó el token",
              timestamp: null,
            });
          }
          
          // Agregar cada transferencia como un paso
          for (const transfer of transfersData) {
            path.push({
              address: transfer.to,
              role: transfer.toRole,
              action: `Recibió ${transfer.amount} unidades`,
              timestamp: transfer.timestamp,
              from: transfer.from,
              fromRole: transfer.fromRole,
            });
          }
          
          setSupplyChainPath(path);
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

            {/* Ruta Completa de la Cadena de Suministro */}
            {supplyChainPath.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                  🔗 Ruta Completa de Trazabilidad
                  <span style={{ fontSize: "13px", fontWeight: "400", color: "#6b7280" }}>
                    (Del productor al consumidor)
                  </span>
                </h3>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "2px solid #86efac",
                  }}
                >
                  {supplyChainPath.map((step, index) => (
                    <div key={index}>
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "white",
                          borderRadius: "8px",
                          border: "2px solid #bbf7d0",
                          position: "relative",
                        }}
                      >
                        {/* Número de paso */}
                        <div
                          style={{
                            position: "absolute",
                            top: "-12px",
                            left: "16px",
                            backgroundColor: "#22c55e",
                            color: "white",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: "700",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          {index + 1}
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <Badge variant="success" style={{ fontSize: "11px" }}>
                                {step.role}
                              </Badge>
                              <span style={{ fontSize: "13px", color: "#15803d", fontWeight: "600" }}>
                                {step.action}
                              </span>
                            </div>
                            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                              <strong>Dirección:</strong>
                            </p>
                            <p
                              style={{
                                margin: "0 0 8px 0",
                                fontSize: "12px",
                                fontFamily: "monospace",
                                color: "#166534",
                                wordBreak: "break-all",
                              }}
                            >
                              {step.address}
                              {step.address.toLowerCase() === account?.toLowerCase() && (
                                <Badge variant="info" style={{ fontSize: "10px", marginLeft: "8px" }}>Tú</Badge>
                              )}
                            </p>
                            
                            {step.from && (
                              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #dcfce7" }}>
                                <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#6b7280" }}>
                                  <strong>Transferido desde:</strong>
                                </p>
                                <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#6b7280" }}>
                                  {step.fromRole}: <span style={{ fontFamily: "monospace", fontSize: "10px" }}>{step.from}</span>
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {step.timestamp && (
                            <div style={{ textAlign: "right" }}>
                              <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
                                {new Date(step.timestamp * 1000).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </p>
                              <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af" }}>
                                {new Date(step.timestamp * 1000).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Flecha hacia abajo entre pasos */}
                      {index < supplyChainPath.length - 1 && (
                        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                          <div style={{ fontSize: "24px", color: "#22c55e" }}>⬇️</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trazabilidad hacia atrás (Padres/Materias Primas) */}
            {parentTokens.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                  ⬅️ Materias Primas Utilizadas
                  <span style={{ fontSize: "13px", fontWeight: "400", color: "#6b7280" }}>
                    (Tokens padre)
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
                          <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#9ca3af" }}>
                            <strong>Creador:</strong> <span style={{ fontFamily: "monospace", fontSize: "10px" }}>{parent.creator}</span>
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
                            <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#9ca3af" }}>
                              <strong>Creador:</strong> <span style={{ fontFamily: "monospace", fontSize: "10px" }}>{child.creator}</span>
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

            {/* Historial Detallado de Transferencias */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                📤 Historial Detallado de Transferencias
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
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  {transfers.map((transfer, index) => {
                    const date = new Date(transfer.timestamp * 1000);
                    return (
                      <div
                        key={transfer.id}
                        style={{
                          padding: "14px",
                          backgroundColor: "white",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                backgroundColor: "#f59e0b",
                                color: "white",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "700",
                              }}
                            >
                              {index + 1}
                            </div>
                            <Badge variant="success" style={{ fontSize: "11px" }}>
                              ✓ Completada
                            </Badge>
                          </div>
                          <p style={{ margin: 0, fontSize: "11px", color: "#78350f" }}>
                            {date.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        
                        {/* De */}
                        <div style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #fef3c7" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "12px", color: "#92400e" }}>📤 De:</strong>
                            <Badge variant="warning" style={{ fontSize: "10px" }}>
                              {transfer.fromRole}
                            </Badge>
                            {transfer.from.toLowerCase() === account?.toLowerCase() && (
                              <Badge variant="info" style={{ fontSize: "10px" }}>Tú</Badge>
                            )}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "11px",
                              fontFamily: "monospace",
                              color: "#78350f",
                              wordBreak: "break-all",
                            }}
                          >
                            {transfer.from}
                          </p>
                        </div>
                        
                        {/* Para */}
                        <div style={{ marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "12px", color: "#92400e" }}>📥 Para:</strong>
                            <Badge variant="warning" style={{ fontSize: "10px" }}>
                              {transfer.toRole}
                            </Badge>
                            {transfer.to.toLowerCase() === account?.toLowerCase() && (
                              <Badge variant="info" style={{ fontSize: "10px" }}>Tú</Badge>
                            )}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "11px",
                              fontFamily: "monospace",
                              color: "#78350f",
                              wordBreak: "break-all",
                            }}
                          >
                            {transfer.to}
                          </p>
                        </div>
                        
                        {/* Cantidad */}
                        <div
                          style={{
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px solid #fef3c7",
                          }}
                        >
                          <strong style={{ fontSize: "12px", color: "#92400e" }}>Cantidad transferida:</strong>{" "}
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "#78350f" }}>
                            {transfer.amount} unidades
                          </span>
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
