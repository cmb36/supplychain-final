import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const ROLE_LABELS = {
  0: "Sin rol",
  1: "Productor",
  2: "Fábrica",
  3: "Retailer",
  4: "Consumidor",
  5: "Administrador",
};

const AdminDashboard = ({ account, adminAddress }) => {
  const { contract } = useWeb3();
  const [adminError, setAdminError] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar usuarios pendientes y aprobados
  const loadUsers = async () => {
    if (!contract) return;
    
    setLoading(true);
    setAdminError(null);
    
    try {
      
      // Obtener eventos UserRequested para encontrar usuarios
      const filter = contract.filters.UserRequested();
      const events = await contract.queryFilter(filter, 0);
      
      const pending = [];
      const approved = [];
      
      for (const event of events) {
        try {
          const userId = Number(event.args[0]);
          const userAddress = event.args[1];
          const requestedRole = Number(event.args[2]);
          
          // Obtener estado actual del usuario
          const userData = await contract.getUserByAddress(userAddress);
          const status = Number(userData.status);
          const currentRole = Number(userData.role);
          
          // Status: 1=Pending, 2=Approved, 3=Rejected, 4=Canceled
          if (status === 1) {
            // Pendiente
            pending.push({
              userId,
              address: userAddress,
              requestedRole,
            });
          } else if (status === 2) {
            // Aprobado
            approved.push({
              userId,
              address: userAddress,
              role: currentRole,
            });
          }
        } catch (err) {
          console.error('Error procesando usuario:', err);
        }
      }
      
      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setAdminError('Error al cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    if (account && contract) {
      loadUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contract]);

  // Aprobar usuario
  const handleApprove = async (userId, address) => {
    if (!contract) return;
    
    setActionLoading(true);
    setAdminError(null);
    
    try {
      
      // Obtener el rol solicitado del usuario
      const userData = await contract.getUserByAddress(address);
      const requestedRole = Number(userData.role);
      
      const tx = await contract.approveUser(userId, requestedRole);
      await tx.wait();
      
      // Recargar lista de usuarios
      await loadUsers();
    } catch (error) {
      console.error('Error aprobando usuario:', error);
      setAdminError('Error al aprobar usuario. Revisa la consola.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar usuario
  const handleReject = async (userId) => {
    if (!contract) return;
    
    setActionLoading(true);
    setAdminError(null);
    
    try {
      const tx = await contract.rejectUser(userId);
      await tx.wait();
      
      // Recargar lista de usuarios
      await loadUsers();
    } catch (error) {
      console.error('Error rechazando usuario:', error);
      setAdminError('Error al rechazar usuario. Revisa la consola.');
    } finally {
      setActionLoading(false);
    }
  };

  // Desactivar usuario
  const handleDeactivate = async (userId) => {
    if (!contract) return;
    
    setActionLoading(true);
    setAdminError(null);
    
    try {
      const tx = await contract.deactivateUser(userId);
      await tx.wait();
      
      // Recargar lista de usuarios
      await loadUsers();
    } catch (error) {
      console.error('Error desactivando usuario:', error);
      setAdminError('Error al desactivar usuario. Revisa la consola.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", marginLeft: "auto", marginRight: "auto" }}>
      {/* Header del Panel de Admin */}
      <Card style={{ marginBottom: "20px", border: "2px solid #0ea5e9" }}>
        <CardContent>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
        </CardContent>
      </Card>

      {/* Solicitudes Pendientes */}
      <Card style={{ marginBottom: "20px" }}>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle style={{ margin: 0 }}>⏳ Solicitudes Pendientes</CardTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Button
                onClick={loadUsers}
                disabled={loading}
                variant="ghost"
                size="sm"
              >
                {loading ? "⏳" : "🔄"}
              </Button>
              <Badge variant="warning">
                {pendingUsers.length} pendientes
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
              <p>Cargando solicitudes...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
              <p style={{ fontSize: "16px", marginBottom: "4px" }}>No hay solicitudes pendientes</p>
              <p style={{ fontSize: "13px" }}>Las nuevas solicitudes aparecerán aquí</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingUsers.map((user) => (
                <div
                  key={user.userId}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "#fffbeb",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#111827", fontWeight: "600" }}>
                        Rol solicitado: <span style={{ color: "#f59e0b" }}>{ROLE_LABELS[user.requestedRole]}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                        Usuario: {user.address.slice(0, 8)}...{user.address.slice(-6)}
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#9ca3af" }}>
                        ID: {user.userId}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(user.userId, user.address)}
                        disabled={actionLoading}
                      >
                        ✅ Aprobar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(user.userId)}
                        disabled={actionLoading}
                      >
                        ❌ Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuarios Aprobados */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle style={{ margin: 0 }}>✅ Usuarios Aprobados</CardTitle>
            <Badge variant="success">
              {approvedUsers.length} usuarios
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
              <p>Cargando usuarios...</p>
            </div>
          ) : approvedUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
              <p style={{ fontSize: "16px" }}>No hay usuarios aprobados todavía</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {approvedUsers.map((user) => (
                <div
                  key={user.userId}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "#f0fdf4",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#111827", fontWeight: "600" }}>
                        Rol: <span style={{ color: "#16a34a" }}>{ROLE_LABELS[user.role]}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                        Usuario: {user.address.slice(0, 8)}...{user.address.slice(-6)}
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#9ca3af" }}>
                        ID: {user.userId}
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeactivate(user.userId)}
                        disabled={actionLoading}
                      >
                        🚫 Desactivar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

