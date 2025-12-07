# IA.md — Diario Técnico del Proyecto SupplyChain Tracker (PFM 2025)

Este documento registra **todas las decisiones técnicas, problemas reales y soluciones aplicadas** durante el desarrollo del proyecto SupplyChain Tracker, siguiendo la estructura profesional recomendada por la Academia.

---

# 📌 1. Configuración inicial del entorno

### Herramientas utilizadas
- Node.js + npm  
- Foundry (forge, anvil, cast)  
- MetaMask  
- Vite + React  
- GitHub  
- PowerShell / VS Code  

### Pasos realizados
1. Instalación y verificación de Foundry  
2. Creación de estructura base del proyecto  
3. Configuración del repositorio Git  
4. Integración del frontend con ethers.js  
5. Configuración de MetaMask con la red local Anvil:
   - RPC: `http://127.0.0.1:8545`
   - Chain ID: `31337`

---

# 📌 2. Desarrollo del contrato SupplyChain.sol

### Decisiones técnicas
- Uso de `enum` para Roles y Estados de Usuario.  
- Estructura `User` y `Transfer` para trazabilidad.  
- Restricción del flujo de tokens:  
  `Producer → Factory → Retailer → Consumer`
- Doble confirmación para transferencias.  
- Validaciones estrictas:
  - Suficiente balance  
  - Rol permitido  
  - Estado del usuario  

### Funciones principales
- `requestUserRole`
- `approveUser`
- `rejectUser`
- `deactivateUser`
- `createToken`
- `transfer`
- `acceptTransfer`
- `traceLineage`
- Consultas de usuario y token

---

# 📌 3. Tests (Foundry)

### Aspectos cubiertos
- Registro y aprobación de usuarios  
- Creación de tokens base  
- Creación de tokens derivados con parentId  
- Transferencias válidas  
- Rechazo de transferencias no permitidas  
- Validación del flujo completo  
- Consumo de tokens  

### Ejecución
```
forge test -vvv
```

---

# 📌 4. Primeros despliegues y problemas detectados

### Deploy en Anvil
```
anvil
forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://127.0.0.1:8545 --private-key <pk> --broadcast
```

### Problemas enfrentados
- MetaMask mostraba **0 ETH** aunque Anvil sí generaba fondos.  
- MetaMask no sincronizaba la red local.  
- Al cambiar de cuenta, el frontend no actualizaba roles.  
- El panel Admin no aparecía pese a conectar con 0xF39f… (cuenta admin).  
- El frontend seguía usando un contrato viejo → address no actualizada.

---

# 📌 5. Error crítico: Metamask “bloqueado” (caché corrupta)

Este fue el problema más importante del proyecto.

### Síntomas
- Roles incorrectos  
- Balances en 0  
- No aparecía el Panel Admin  
- Frontend mostraba “Formulario” incluso conectado como Admin  
- MetaMask pedía permisos incorrectos  
- Transacciones fallaban o no aparecían  

### Causa real
**Chrome tenía múltiples pestañas abiertas con dApps locales, produciendo conflictos entre permisos, conexiones y caché de MetaMask.**

### Solución definitiva (aportada por compañera del curso)

Ejecutar en Console del navegador:

```js
await window.ethereum.request({
  method: "wallet_revokePermissions",
  params: [{ eth_accounts: {} }]
});

localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Resultado
- MetaMask revocó permisos corruptos  
- El frontend se sincronizó con el contrato correcto  
- Los roles comenzaron a cargar correctamente  
- El Panel Admin reapareció  
- Balances se mostraron correctamente  
- Todo el flujo volvió a funcionar  

---

# 📌 6. Problema adicional: ABI desactualizada

En un momento crítico se detectó:

- El contrato desplegado era **nuevo**, pero  
- La ABI del frontend era antigua  
- Roles, estados y métodos no coincidían  

Esto produjo:
- Admin = None  
- Usuarios no reconocidos  
- Panel incorrecto  

### Solución:
Sincronizar dirección *y ABI* con el contrato desplegado.

---

# 📌 7. Integración con Frontend (React)

### Funcionalidades implementadas
- Conexión a MetaMask  
- Identificación del usuario conectado  
- Registro de rol  
- Panel administrativo  
- Listado de solicitudes pendientes  
- Creación de tokens  
- Transferencias y aceptación  
- Trazabilidad completa  

### Problemas y fixes
1. **El botón “Conectar” se superponía**  
   → Estético, no funcional.

2. **Vite retenía la build antigua**  
   → Solución: reiniciar servidor.

3. **El Panel Admin no aparecía**  
   → Address del contrato no actualizada.  
   → ABI antigua.  
   → Caché de MetaMask corrupta.

---

# 📌 8. Lecciones aprendidas

- La importancia de **sincronizar contrato + ABI + address** en cada deploy.  
- MetaMask puede bloquear totalmente un proyecto si no se limpian permisos.  
- La red local Anvil debe estar alineada con la PK usada en los scripts.  
- React conserva estados que pueden engañar durante debugging.  
- El desarrollo blockchain requiere precisión, pausas y orden mental.  
- Las frustraciones técnicas también forman parte del aprendizaje.

---

# 📌 9. Solución técnica final y estable

1. Limpiar Chrome / MetaMask  
2. Levantar Anvil  
3. Deployar contrato  
4. Actualizar address en Frontend  
5. Reiniciar Vite  
6. Conectar MetaMask  
7. Registrar rol  
8. Aprobar con Admin  
9. Ejecutar flujo completo

---

# 🦋 10. Autora

**Carla Bozzano**  
Ingeniera en Informática · Coach Holística · Desarrolladora Blockchain  

Proyecto desarrollado con disciplina, resiliencia y una enorme capacidad de adaptación.

