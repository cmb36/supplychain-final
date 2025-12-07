# 🟦 README.md — SupplyChain Tracker (PFM 2025)

## 📌 Descripción general

Proyecto final desarrollado en el marco del **PFM – Trazabilidad en Blockchain (CodeCrypto Academy, 2025)**.

**SupplyChain Tracker** es una aplicación descentralizada (dApp) que permite:

- Registrar usuarios con distintos roles de la cadena de suministro.  
- Aprobar/rechazar usuarios desde un panel administrativo.  
- Crear tokens que representan productos o materias primas.  
- Procesarlos, transferirlos y consultar su trazabilidad completa.  
- Interactuar con el contrato mediante un **frontend en React + MetaMask**.  
- Garantizar transparencia e integridad mediante un **smart contract en Solidity**.

---

# 🧱 Tecnologías utilizadas

- **Solidity (0.8.x)**  
- **Foundry (forge, anvil)**  
- **JavaScript / React (Vite)**  
- **ethers.js**  
- **MetaMask**  
- **GitHub / Git**  

---

# 🧩 Funcionalidades principales

### Usuarios y Roles
El sistema define cinco roles:

- **Admin** → Control del sistema  
- **Producer** → Crea materia prima  
- **Factory** → Procesa productos  
- **Retailer** → Comercializa  
- **Consumer** → Recibe y consume  

Los usuarios deben **solicitar un rol** y ser **aprobados por el Admin** antes de operar.

### Tokens y Producto
Cada producto/token posee:

- ID  
- Nombre  
- Descripción  
- Creador  
- Cantidad  
- Parent ID (si proviene de otro token)

### Transferencias
El flujo permitido:

```
Producer → Factory → Retailer → Consumer
```

Las transferencias requieren:

- Verificación de rol  
- Suficiente cantidad  
- Aceptación por parte del receptor  

### Trazabilidad
Es posible consultar:

- Linaje completo del producto  
- Transferencias históricas  
- Balances por usuario  

---

# 🗂️ Estructura del repositorio

```
supplychain-final/
├── README.md
├── docs/
│   ├── IA.md                # Diario técnico del desarrollo
│   └── README_SPEC.md       # Especificación original
├── sc/
│   ├── src/
│   │   └── SupplyChain.sol  # Smart contract principal
│   ├── test/                # Tests (Foundry)
│   ├── script/
│   │   └── Deploy.s.sol     # Script de deploy
│   └── foundry.toml
└── web/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── contract.js       # ABI + Address del contrato
    │   └── components/, contexts/, hooks/, assets/
    ├── public/
    ├── package.json
    └── vite.config.js
```

---

# 🧪 Tests (Foundry)

Ejecutar:

```
forge test -vvv
```

Cubre:

- Registro y aprobación de usuarios  
- Creación de tokens base y derivados  
- Transferencias válidas e inválidas  
- Consumo final  
- Restricciones por rol  
- Validación del flujo completo  

---

# 🚀 Cómo ejecutar el proyecto

## 1) Levantar red local

```
anvil
```

## 2) Desplegar contrato en Anvil

```
forge script script/Deploy.s.sol:DeploySupplyChain   --rpc-url http://127.0.0.1:8545   --private-key <private_key_anvil>   --broadcast
```

El terminal mostrará:

```
Deployed SupplyChain to: 0x....
```

Copiar esta dirección en:

```
web/src/contract.js
```

## 3) Ejecutar el frontend

```
cd web
npm install
npm run dev
```

Abrir en navegador:

```
http://localhost:5173
```

Con MetaMask conectado a:

```
http://127.0.0.1:8545   (Anvil Local)
ChainId: 31337
```

---

# 🧠 Decisiones técnicas relevantes

- Modelo de roles mediante `enum`.
- Estructura de trazabilidad basada en `parentId`.
- Sistema de balances por token y usuario.
- Validaciones estrictas de flujo entre roles.
- Transferencias con doble confirmación (createTransfer → acceptTransfer).
- Arquitectura frontend organizada en `contexts`, `hooks`, y `services`.

---

# 🔐 Seguridad

- Validación de permisos por rol.  
- Restricción de flujo de producto.  
- Prevención de transferencias inválidas.  
- Estados de usuario: Pending / Approved / Rejected / Canceled.  

---

# 🛠️ Troubleshooting (importante)

En Chrome, MetaMask puede quedar bloqueado cuando hay muchas pestañas con dApps locales abiertas.

Síntomas:

- Roles no se actualizan  
- Balances se muestran en 0  
- Pantalla queda congelada  
- No aparece el Panel de Admin  

**Solución comprobada (vía console):**

```js
await window.ethereum.request({
  method: "wallet_revokePermissions",
  params: [{ eth_accounts: {} }]
});

localStorage.clear();
sessionStorage.clear();
location.reload();
```

Esto:

- Revoca permisos corruptos  
- Limpia la caché de la dApp  
- Fuerza a MetaMask a reconectar al nodo real  
- Desbloquea los roles y saldos  

---

# 🦋 Autora

**Carla Bozzano**  
Ingeniera en Informática · Coach Holística · Desarrolladora Blockchain  

Proyecto creado con intención, disciplina y propósito.