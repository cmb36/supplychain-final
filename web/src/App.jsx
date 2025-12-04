import { useState, useEffect } from "react";
import "./App.css";
import { getContract } from "./contract";
import RegisterSection from "./RegisterSection";


// Mapas para traducir enums del contrato
const ROLE_LABELS = [
  "Sin rol",    // 0 = None
  "Productor",  // 1 = Producer
  "Fábrica",    // 2 = Factory
  "Retailer",   // 3 = Retailer
  "Consumidor", // 4 = Consumer
];

const STATUS_LABELS = [
  "Sin estado", // 0 = None
  "Pendiente",  // 1 = Pending
  "Aprobado",   // 2 = Approved
  "Rechazado",  // 3 = Rejected
  "Inactivo",   // 4 = Inactive
];

function App() {
  // ESTADOS BÁSICOS
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(false);

  // ESTADO PARA ADMIN
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminUserId, setAdminUserId] = useState("");   // 👈 ESTE ES EL QUE FALTA/DA ERROR
  const [adminRole, setAdminRole] = useState("1");      // 1 = Productor por defecto

    // ESTADO PARA PRODUCTOR (crear productos)
  const [producerName, setProducerName] = useState("");
  const [producerSupply, setProducerSupply] = useState("");
  const [producerFeatures, setProducerFeatures] = useState("");
  const [producerLoading, setProducerLoading] = useState(false);
  const [producerError, setProducerError] = useState(null);

    // INVENTARIO DEL USUARIO (productos / tokens)
  const [myTokens, setMyTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState(null);


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

  // 1-bis) Cargar información del admin y comprobar si la cuenta conectada es el admin
  const loadAdminInfo = async (providedAccount = null) => {
    try {
      setAdminLoading(true);
      setAdminError(null);

      const addr = providedAccount || account;
      if (!addr) return;

      const { contract } = await getContract();
      const adminAddr = await contract.admin();

      setAdminAddress(adminAddr);
      setIsAdmin(adminAddr.toLowerCase() === addr.toLowerCase());
    } catch (err) {
      console.error("Error al cargar admin:", err);
      setAdminError("No se pudo cargar la información del admin.");
    } finally {
      setAdminLoading(false);
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

  // 3) Solicitar rol (por ahora solo Productor = 1)
  const requestRole = async (roleValue) => {
    if (!account) {
      alert("Primero conecta tu wallet");
      return;
    }

    try {
      setError(null);
      setLoadingRequest(true);

      const { contract } = await getContract();

      const tx = await contract.requestUserRole(roleValue); // 1 = Productor
      await tx.wait();

      // Después de confirmar, recargamos la info del usuario
      await loadUser(contract, account);
    } catch (err) {
      console.error("Error al solicitar rol:", err);

      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setError("Has cancelado la transacción en MetaMask.");
      } else {
        setError("Error al solicitar el rol. Revisa la consola.");
      }
    } finally {
      setLoadingRequest(false);
    }
  };

  // 4) Acciones de ADMIN: aprobar, rechazar, desactivar usuario
  const approveUser = async () => {
    if (!isAdmin) {
      alert("Solo el admin puede aprobar usuarios.");
      return;
    }

    const userIdNum = parseInt(adminUserId, 10);
    const roleNum = parseInt(adminRole, 10);

    if (isNaN(userIdNum) || userIdNum <= 0) {
      setAdminError("Introduce un ID de usuario válido.");
      return;
    }

    if (isNaN(roleNum) || roleNum < 1 || roleNum > 4) {
      setAdminError("Selecciona un rol válido (1 a 4).");
      return;
    }

    try {
      setAdminError(null);
      setAdminLoading(true);

      const { contract } = await getContract();
      const tx = await contract.approveUser(userIdNum, roleNum);
      await tx.wait();

      // Opcional: recargar tu propio usuario por si te auto-apruebas
      await loadUser(null, account);
    } catch (err) {
      console.error("Error al aprobar usuario:", err);
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setAdminError("Has cancelado la transacción en MetaMask.");
      } else {
        setAdminError("Error al aprobar usuario. Revisa la consola.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const rejectUser = async () => {
    if (!isAdmin) {
      alert("Solo el admin puede rechazar usuarios.");
      return;
    }

    const userIdNum = parseInt(adminUserId, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      setAdminError("Introduce un ID de usuario válido.");
      return;
    }

    try {
      setAdminError(null);
      setAdminLoading(true);

      const { contract } = await getContract();
      const tx = await contract.rejectUser(userIdNum);
      await tx.wait();
    } catch (err) {
      console.error("Error al rechazar usuario:", err);
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setAdminError("Has cancelado la transacción en MetaMask.");
      } else {
        setAdminError("Error al rechazar usuario. Revisa la consola.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const deactivateUser = async () => {
    if (!isAdmin) {
      alert("Solo el admin puede desactivar usuarios.");
      return;
    }


    const userIdNum = parseInt(adminUserId, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      setAdminError("Introduce un ID de usuario válido.");
      return;
    }

    try {
      setAdminError(null);
      setAdminLoading(true);

      const { contract } = await getContract();
      const tx = await contract.deactivateUser(userIdNum);
      await tx.wait();
    } catch (err) {
      console.error("Error al desactivar usuario:", err);
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setAdminError("Has cancelado la transacción en MetaMask.");
      } else {
        setAdminError("Error al desactivar usuario. Revisa la consola.");
      }
    } finally {
      setAdminLoading(false);
    }
 };  // fin deactivateUser

  // Crear producto (solo para productores aprobados)
  const createProduct = async () => {
    if (!account) {
      setProducerError("Primero conecta tu wallet.");
      return;
    }

    try {
      setProducerError(null);
      setProducerLoading(true);

      const { contract } = await getContract();

      // Validaciones básicas
      if (!producerName.trim()) {
        setProducerError("El nombre del producto es obligatorio.");
        return;
      }
      if (!producerSupply || Number(producerSupply) <= 0) {
        setProducerError("La cantidad (supply) debe ser mayor a 0.");
        return;
      }

      // Texto libre de características (opcional)
      const featuresText = producerFeatures.trim(); // puede estar vacío

      // parentId = 0 porque es un producto "raíz" del Productor
      const parentId = 0;

      // 👇 Llamada EXACTA a la firma del contrato:
      // createToken(string name, string features, uint256 parentId, uint256 amount)
      const tx = await contract.createToken(
        producerName,               // name
        featuresText,               // features (texto libre)
        parentId,                   // 0 para producto base
        Number(producerSupply)      // amount
      );

      await tx.wait();

      // Recargar inventario del usuario después de crear el producto
      await loadMyProducts(contract, account);


      // Limpiar formularios
      setProducerName("");
      setProducerSupply("");
      setProducerFeatures("");

    } catch (err) {
      console.error("Error al crear producto:", err);
      setProducerError("No se pudo crear el producto. Revisa MetaMask y la consola.");
    } finally {
      setProducerLoading(false);
    }
  };

  // Cargar productos del usuario conectado (inventario básico)
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
      const ids = await contract.getUserTokens(addr); // uint256[]

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



  // 5) Intentar detectar cuenta ya conectada al cargar la página
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

  // 6) Etiquetas bonitas para mostrar
  const roleLabel = user ? ROLE_LABELS[Number(user.role)] : "Sin rol";
  const statusLabel = user ? STATUS_LABELS[Number(user.status)] : "Sin estado";
  const userId = user ? Number(user.id) : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7fb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
          padding: "32px 40px",
        }}
      >
        {/* Cabecera */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "32px",
              margin: 0,
              fontWeight: "700",
              color: "#1f2933",
            }}
          >
            SupplyChain Tracker
          </h1>

          <button
            onClick={connectWallet}
            style={{
              marginTop: "20px",
              padding: "10px 24px",
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "999px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Conectar Wallet
          </button>

          {account && (
            <>
              <p style={{ marginTop: "12px", fontSize: "14px", color: "#4b5563" }}>
                <strong>Wallet conectada:</strong> {account}
              </p>

              {adminAddress && (
                <p style={{ marginTop: "4px", fontSize: "14px", color: "#4b5563" }}>
                  <strong>Admin del contrato:</strong> {adminAddress}{" "}
                  {isAdmin ? "(esta cuenta es el admin)" : ""}
                </p>
              )}
            </>
          )}

        </div>

        {/* Tarjeta de Mi Usuario */}
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            padding: "24px 28px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "22px",
              color: "#111827",
            }}
          >
            Mi Usuario
          </h2>

          {loadingUser ? (
            <p style={{ color: "#6b7280" }}>Cargando información del usuario...</p>
          ) : user ? (
            <>
              <p style={{ margin: "4px 0", fontSize: "15px" }}>
                <strong>ID de usuario:</strong> {userId}
              </p>
              <p style={{ margin: "4px 0", fontSize: "15px" }}>
                <strong>Rol actual:</strong> {roleLabel}
              </p>
              <p style={{ margin: "4px 0", fontSize: "15px" }}>
                <strong>Estado:</strong> {statusLabel}
              </p>
            </>
          ) : (
            <p style={{ color: "#6b7280" }}>
              No tienes usuario registrado todavía en el contrato.
            </p>
          )}

          {error && (
            <p style={{ color: "#dc2626", marginTop: "10px" }}>{error}</p>
          )}

          
          {/* PANEL ADMIN */}
          {isAdmin && (
            <div
              style={{
                marginTop: "24px",
                marginBottom: "8px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  marginBottom: "10px",
                  color: "#111827",
                }}
              >
                Panel de administrador
              </h3>

              <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "10px" }}>
                Usa este panel para aprobar, rechazar o desactivar usuarios.
              </p>

              {/* Campo ID de usuario */}
              <div style={{ marginBottom: "8px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    marginBottom: "4px",
                    color: "#374151",
                  }}
                >
                  ID de usuario
                </label>
                <input
                  type="number"
                  value={adminUserId}
                  onChange={(e) => setAdminUserId(e.target.value)}
                  placeholder="Por ejemplo: 1"
                  style={{
                    width: "160px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Selector de rol */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    marginBottom: "4px",
                    color: "#374151",
                  }}
                >
                  Rol a asignar (para aprobar)
                </label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  style={{
                    width: "200px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                >
                  <option value="1">1 - Productor</option>
                  <option value="2">2 - Fábrica</option>
                  <option value="3">3 - Retailer</option>
                  <option value="4">4 - Consumidor</option>
                </select>
              </div>

              {/* Botones de acción */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={approveUser}
                  disabled={adminLoading}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: adminLoading ? "#9ca3af" : "#16a34a",
                    color: "white",
                    cursor: adminLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Aprobar usuario
                </button>

                <button
                  onClick={rejectUser}
                  disabled={adminLoading}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: adminLoading ? "#9ca3af" : "#f97316",
                    color: "white",
                    cursor: adminLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Rechazar usuario
                </button>

                <button
                  onClick={deactivateUser}
                  disabled={adminLoading}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: adminLoading ? "#9ca3af" : "#dc2626",
                    color: "white",
                    cursor: adminLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Desactivar usuario
                </button>
              </div>

              {adminLoading && (
                <p style={{ marginTop: "8px", fontSize: "13px", color: "#6b7280" }}>
                  Enviando transacción como admin...
                </p>
              )}

              {adminError && (
                <p style={{ marginTop: "8px", fontSize: "13px", color: "#dc2626" }}>
                  {adminError}
                </p>
              )}
            </div>
          )}

        </div>

         <RegisterSection account={account} />

        {/* 🧩 SECCIÓN PRODUCTOR – Crear producto */}
        <section style={{ border: "1px solid #ddd", padding: "1rem", marginTop: "1rem" }}>
          <h2>Crear producto (Productor)</h2>

          {producerError && (
            <p style={{ color: "red" }}>
              {producerError}
            </p>
          )}

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Nombre del producto:
              <input
                type="text"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                style={{ marginLeft: "0.5rem" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Cantidad (supply):
              <input
                type="number"
                min="1"
                value={producerSupply}
                onChange={(e) => setProducerSupply(e.target.value)}
                style={{ marginLeft: "0.5rem" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Descripción del producto:
              <textarea
                value={producerFeatures}
                onChange={(e) => setProducerFeatures(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
              />
            </label>
          </div>

          <button onClick={createProduct} disabled={producerLoading}>
            {producerLoading ? "Creando producto..." : "Crear producto"}
          </button>
        </section>
        {/* 🧾 INVENTARIO DEL USUARIO */}
        <section style={{ border: "1px solid #ddd", padding: "1rem", marginTop: "1rem" }}>
          <h2>Mis productos</h2>

          {loadingTokens && (
            <p style={{ color: "#4b5563" }}>Cargando productos...</p>
          )}

          {tokensError && (
            <p style={{ color: "red" }}>{tokensError}</p>
          )}

          {!loadingTokens && !tokensError && myTokens.length === 0 && (
            <p style={{ color: "#6b7280" }}>
              Todavía no tienes productos creados en este usuario.
            </p>
          )}

          {!loadingTokens && !tokensError && myTokens.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>ID</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>Nombre</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>Descripción</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {myTokens.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{t.id}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{t.name}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{t.features}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{t.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

      </div>
    </div>
  );
}

export default App;
