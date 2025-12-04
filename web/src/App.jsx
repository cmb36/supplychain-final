import { useState, useEffect } from "react";
import "./App.css";
import { getContract } from "./contract";
import Header from "./components/Header";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";

function App() {
  // ESTADOS BÁSICOS
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState(null);

  // ESTADO PARA ADMIN
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState(null);
  const [hasAdmin, setHasAdmin] = useState(true); // Por defecto true hasta verificar

  // INVENTARIO DEL USUARIO (productos / tokens)
  const [myTokens, setMyTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState(null);

  // Flag para evitar reconexión automática después de desconectar
  const [manualDisconnect, setManualDisconnect] = useState(false);

  // 1) Conectar wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Instala MetaMask para continuar");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        alert("No se encontraron cuentas en MetaMask");
        return;
      }

      const selected = accounts[0];
      setAccount(selected);
      setManualDisconnect(false); // Reset flag al conectar

      // Cargar datos del usuario al conectar
      await loadUser(null, selected);
      // Cargar info del admin al conectar
      await loadAdminInfo(selected);
      await loadMyProducts(null, selected);
    } catch (err) {
      console.error("Error al conectar wallet:", err);
      alert("No se pudo conectar la wallet. Revisa MetaMask.");
    }
  };

  // 1-bis) Desconectar wallet completamente
  const disconnectWallet = async () => {
    // Marcar como desconexión manual para evitar reconexión automática
    setManualDisconnect(true);

    // Limpiar estados de la aplicación
    setAccount(null);
    setUser(null);
    setIsAdmin(false);
    setAdminAddress(null);
    setHasAdmin(true);
    setMyTokens([]);
    setError(null);
    setTokensError(null);

    // Revocar permisos de MetaMask
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      console.warn('Error revoking MetaMask permissions:', error);
      // Continuar con la desconexión aunque falle la revocación
    }

    // Limpiar todos los almacenamientos
    localStorage.clear();
    sessionStorage.clear();

    // Recargar la página para asegurar un estado completamente limpio
    window.location.reload();
  };

  // 1-ter) Cargar información del admin y comprobar si la cuenta conectada es el admin
  const loadAdminInfo = async (providedAccount = null) => {
    try {
      const addr = providedAccount || account;
      if (!addr) return;

      const { contract } = await getContract();
      const adminAddr = await contract.admin();
      const hasAdminValue = await contract.hasAdmin();

      setAdminAddress(adminAddr);
      setHasAdmin(hasAdminValue);
      
      // Verificar si la cuenta actual es admin
      if (adminAddr && adminAddr !== '0x0000000000000000000000000000000000000000') {
        setIsAdmin(adminAddr.toLowerCase() === addr.toLowerCase());
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Error al cargar admin:", err);
      setHasAdmin(false); // Si hay error, asumir que no hay admin
    }
  };

  // 2) Cargar info de usuario desde el contrato
  const loadUser = async (existingContract = null, providedAccount = null) => {
    try {
      setLoadingUser(true);
      setError(null);

      const addr = providedAccount || account;
      if (!addr) return;

      const { contract } = existingContract
        ? { contract: existingContract }
        : await getContract();

      const userData = await contract.getUserByAddress(addr);

      // ethers v6 devuelve BigInt → comparamos con 0n
      if (userData.id === 0n) {
        setUser(null);
      } else {
        setUser(userData);
      }
    } catch (err) {
      console.error("Error al cargar usuario:", err);
      setError("No se pudo cargar la información del usuario.");
    } finally {
      setLoadingUser(false);
    }
  };

  // 3) Cargar productos del usuario conectado (inventario básico)
  const loadMyProducts = async (existingContract = null, providedAccount = null) => {
    try {
      setLoadingTokens(true);
      setTokensError(null);

      const addr = providedAccount || account;
      if (!addr) {
        setMyTokens([]);
        return;
      }

      const { contract } = existingContract
        ? { contract: existingContract }
        : await getContract();

      // Obtener IDs de tokens que pertenecen a este usuario
      const ids = await contract.getUserTokens(addr);

      const tokens = [];

      for (const idBig of ids) {
        const id = Number(idBig);
        if (!id) continue;

        const [tokenId, name, features, parentId] = await contract.getTokenInfo(id);
        const balance = await contract.getTokenBalance(id, addr);

        tokens.push({
          id: Number(tokenId),
          name,
          features,
          parentId: Number(parentId),
          balance: Number(balance),
        });
      }

      setMyTokens(tokens);
    } catch (err) {
      console.error("Error al cargar productos del usuario:", err);

      // Si el contrato dice "No user", no ponemos error rojo; simplemente lista vacía
      if (err?.message?.includes("No user")) {
        setMyTokens([]);
        return;
      }

      setTokensError("No se pudieron cargar tus productos.");
    } finally {
      setLoadingTokens(false);
    }
  };

  // 4) Intentar detectar cuenta ya conectada al cargar la página
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) return;

        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          const selected = accounts[0];
          setAccount(selected);
          await loadUser(null, selected);
          await loadAdminInfo(selected);
          await loadMyProducts(null, selected);
        }
      } catch (err) {
        console.error("Error en init useEffect:", err);
      }
    };

    init();
  }, []);

  // 5) Detectar cambios de cuenta en MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      console.log('🔄 accountsChanged event:', accounts);
      
      // Solo procesar si no es una desconexión manual
      if (manualDisconnect) {
        console.log('⏸️ Ignorando accountsChanged porque fue desconexión manual');
        return;
      }

      if (accounts.length === 0) {
        console.log('🔌 No hay cuentas, desconectando...');
        disconnectWallet();
      } else if (accounts[0] !== account) {
        console.log('👤 Cambio de cuenta detectado:', {
          anterior: account,
          nueva: accounts[0],
        });
        
        // Usuario cambió de cuenta
        const newAccount = accounts[0];
        setAccount(newAccount);
        setManualDisconnect(false); // Reset flag al cambiar cuenta
        
        await loadUser(null, newAccount);
        await loadAdminInfo(newAccount);
        await loadMyProducts(null, newAccount);
      }
    };

    const handleChainChanged = () => {
      console.log('🔄 Chain changed, reloading page...');
      // Recargar la página cuando cambie la red
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Cleanup
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [account, manualDisconnect]);

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
              <AdminDashboard account={account} adminAddress={adminAddress} />
            ) : (
              <UserDashboard
                account={account}
                user={user}
                loadingUser={loadingUser}
                onReloadUser={() => loadUser(null, account)}
                myTokens={myTokens}
                loadingTokens={loadingTokens}
                tokensError={tokensError}
                onReloadTokens={() => loadMyProducts(null, account)}
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

        {/* Error global */}
        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
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
    </div>
  );
}

export default App;
