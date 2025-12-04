import "./App.css";
import { useWeb3 } from "./contexts/Web3Context";
import Header from "./components/Header";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";

function App() {
  const { account, isAdmin, user, hasAdmin, connectWallet, disconnectWallet, refreshUser } = useWeb3();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#f5f7fb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header sticky siempre visible */}
      <Header
        account={account}
        isAdmin={isAdmin}
        user={user}
        loadingUser={false}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />

      {/* Contenido principal */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        {/* Vista según si es Admin o Usuario Regular */}
        {account && (
          <>
            {isAdmin ? (
              <AdminDashboard account={account} adminAddress={account} />
            ) : (
              <UserDashboard
                account={account}
                user={user}
                loadingUser={false}
                onReloadUser={refreshUser}
                hasAdmin={hasAdmin}
              />
            )}
          </>
        )}

        {/* Mensaje cuando no hay wallet conectada */}
        {!account && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px 32px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔗</div>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#111827", fontWeight: "700" }}>
              Bienvenido a SupplyChain Tracker
            </h2>
            <p style={{ margin: "0 0 32px 0", fontSize: "15px", color: "#6b7280", lineHeight: "1.6", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
              Conecta tu wallet MetaMask usando el botón en la parte superior para acceder al sistema de trazabilidad.
            </p>
            <div
              style={{
                display: "inline-block",
                padding: "20px 28px",
                backgroundColor: "#f0f9ff",
                borderRadius: "10px",
                border: "1px solid #bae6fd",
                textAlign: "left",
              }}
            >
              <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#075985", fontWeight: "700" }}>
                📋 Características del Sistema
              </p>
              <ul style={{ margin: 0, padding: 0, paddingLeft: "20px", fontSize: "13px", color: "#0c4a6e", lineHeight: "1.8" }}>
                <li>Trazabilidad completa de productos</li>
                <li>Gestión de roles: Producer, Factory, Retailer, Consumer</li>
                <li>Transferencias seguras entre actores</li>
                <li>Sistema descentralizado en blockchain</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
