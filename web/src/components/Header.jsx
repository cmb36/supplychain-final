import Button from "./ui/Button";

const Header = ({ account, isAdmin, onConnect, onDisconnect }) => {

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Badge de Admin */}
            {account && isAdmin && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  border: "1px solid #93c5fd",
                }}
              >
                <span>👑</span>
                <span>Admin</span>
              </div>
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

