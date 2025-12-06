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

const ROLE_ICONS = {
  1: "🌾",
  2: "🏭",
  3: "🏪",
  4: "🛒",
  5: "👑",
};

const STATUS_LABELS = {
  0: "Sin estado",
  1: "Pendiente",
  2: "Aprobado",
  3: "Rechazado",
  4: "Inactivo",
};

const Header = ({ account, isAdmin, user, loadingUser, onConnect, onDisconnect }) => {
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const userRole = user ? Number(user.role) : 0;
  const userStatus = user ? Number(user.status) : 0;
  const roleLabel = ROLE_LABELS[userRole] || "Sin rol";
  const roleIcon = ROLE_ICONS[userRole] || "👤";
  const statusLabel = STATUS_LABELS[userStatus] || "Sin estado";
  const isApproved = userStatus === 2;
  const isPending = userStatus === 1;

  return (
    <header
      style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "64px",
          }}
        >
          {/* Logo y Título */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              📦
            </div>
            <div>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#111827",
                  margin: 0,
                  lineHeight: "1.2",
                }}
              >
                SupplyChain Tracker
              </h1>
              <p
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  margin: 0,
                  lineHeight: "1",
                }}
              >
                Sistema de Trazabilidad
              </p>
            </div>
          </div>

          {/* Acciones de la derecha */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Información del usuario */}
            {account && user && !loadingUser && (
              <>
                {/* Badge de Rol */}
                <Badge variant={isApproved ? "success" : isPending ? "warning" : "info"}>
                  {roleIcon} {roleLabel}
                </Badge>

                {/* Badge de Estado */}
                <Badge variant={isApproved ? "success" : isPending ? "warning" : "error"}>
                  {isApproved ? "✅" : isPending ? "⏳" : "❌"} {statusLabel}
                </Badge>
              </>
            )}

            {/* Dirección de la cuenta */}
            {account && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontFamily: "monospace",
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  {formatAddress(account)}
                </span>
              </div>
            )}

            {/* Botón de Conectar/Desconectar */}
            <Button
              onClick={account ? onDisconnect : onConnect}
              variant={account ? "destructive" : "default"}
              size="default"
            >
              <span style={{ fontSize: "16px" }}>
                {account ? "🔌" : "🔗"}
              </span>
              <span>{account ? "Desconectar" : "Conectar"}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

