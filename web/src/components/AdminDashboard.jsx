import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const ROLE_LABELS = {
  0: "Sin rol",
  1: "Productor",
  2: "Fábrica",
  3: "Comerciante",
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

  // NUEVO → Cargar usuarios directamente desde mapping users()
  const loadUsers = async () => {
    if (!contract) return;

    setLoading(true);
    setAdminError(null);

    try {
      const pending = [];
      const approved = [];

      let userId = 1;

      while (true) {
        try {
          const u = await contract.users(userId);
          const wallet = u.wallet;

          if (wallet === "0x0000000000000000000000000000000000000000") break;

          const role = Number(u.role);
          const status = Number(u.status);

          if (status === 1) {
            pending.push({ userId, address: wallet, requestedRole: role });
          }

          if (status === 2) {
            approved.push({ userId, address: wallet, role });
          }
        } catch {
          break;
        }

        userId++;
      }

      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setAdminError("Error al cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar
  useEffect(() => {
    if (account && contract) loadUsers();
  }, [account, contract]);

  // Aprobar usuario
  const handleApprove = async (userId, address) => {
    if (!contract) return;

    setActionLoading(true);
    setAdminError(null);

    try {
      const userData = await contract.getUserByAddress(address);
      const requestedRole = Number(userData.role);

      const tx = await contract.approveUser(userId, requestedRole);
      await tx.wait();

      loadUsers();
    } catch (error) {
      console.error("Error aprobando usuario:", error);
      setAdminError("Error al aprobar usuario.");
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar
  const handleReject = async (userId) => {
    if (!contract) return;

    setActionLoading(true);

    try {
      const tx = await contract.rejectUser(userId);
      await tx.wait();
      loadUsers();
    } catch {
      setAdminError("Error al rechazar usuario.");
    } finally {
      setActionLoading(false);
    }
  };

  // Desactivar
  const handleDeactivate = async (userId) => {
    if (!contract) return;

    setActionLoading(true);

    try {
      const tx = await contract.deactivateUser(userId);
      await tx.wait();
      loadUsers();
    } catch {
      setAdminError("Error al desactivar usuario.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* HEADER */}
      <Card style={{ marginBottom: "20px", border: "2px solid #0ea5e9" }}>
        <CardContent>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              👑
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px" }}>Panel de Administrador</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                Gestiona usuarios y permisos del sistema
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PENDING */}
      <Card style={{ marginBottom: "20px" }}>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <CardTitle>⏳ Solicitudes Pendientes</CardTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Button onClick={loadUsers} disabled={loading} variant="ghost" size="sm">
                {loading ? "⏳" : "🔄"}
              </Button>
              <Badge variant="warning">{pendingUsers.length} pendientes</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p style={{ textAlign: "center" }}>Cargando...</p>
          ) : pendingUsers.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              No hay solicitudes pendientes
            </p>
          ) : (
            pendingUsers.map((u) => (
              <div
                key={u.userId}
                style={{
                  border: "1px solid #e5e7eb",
                  marginBottom: "12px",
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#fffbeb",
                }}
              >
                <p>
                  Rol solicitado:{" "}
                  <strong style={{ color: "#f59e0b" }}>{ROLE_LABELS[u.requestedRole]}</strong>
                </p>
                <p style={{ fontFamily: "monospace" }}>
                  Usuario: {u.address.slice(0, 8)}...{u.address.slice(-6)}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="success"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleApprove(u.userId, u.address)}
                  >
                    ✅ Aprobar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleReject(u.userId)}
                  >
                    ❌ Rechazar
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* APPROVED */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <CardTitle>✅ Usuarios Aprobados</CardTitle>
            <Badge variant="success">{approvedUsers.length} usuarios</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {approvedUsers.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              No hay usuarios aprobados todavía
            </p>
          ) : (
            approvedUsers.map((u) => (
              <div
                key={u.userId}
                style={{
                  border: "1px solid #e5e7eb",
                  marginBottom: "12px",
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#f0fdf4",
                }}
              >
                <p>
                  Rol:{" "}
                  <strong style={{ color: "#16a34a" }}>{ROLE_LABELS[u.role]}</strong>
                </p>

                <p style={{ fontFamily: "monospace" }}>
                  {u.address.slice(0, 8)}...{u.address.slice(-6)}
                </p>

                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleDeactivate(u.userId)}
                >
                  🚫 Desactivar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {adminError && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#fee2e2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          ⚠️ {adminError}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
