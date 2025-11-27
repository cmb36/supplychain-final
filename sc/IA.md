# IA.md – Diario técnico SupplyChain Tracker

## 1. Estructura del proyecto

- Raíz: `supplychain-final/`
  - `sc/` → contratos + tests + scripts Foundry
  - `web/` → frontend React (pendiente de implementar)

## 2. Contrato SupplyChain – resumen

- Enums:
  - `Role { None, Producer, Factory, Retailer, Consumer }`
  - `UserStatus { None, Pending, Approved, Rejected, Canceled }`
  - `TransferStatus { Pending, Accepted, Rejected }`
- Structs:
  - `User { id, wallet, role, status }`
  - `Token { id, name, features, parentId, balance[address] }`
  - `Transfer { id, tokenId, from, to, amount, status, timestamp }`
- Eventos principales:
  - `UserRequested`, `UserApproved`, `UserRejected`, `UserCanceled`
  - `TokenCreated`
  - `TransferCreated`, `TransferAccepted`, `TransferRejected`
  - `TokenConsumed`

## 3. Funciones públicas principales

- Gestión de usuarios:
  - `requestUserRole(Role requested)`
  - `approveUser(uint256 userId, Role role)`
  - `rejectUser(uint256 userId)`
  - `cancelMyUser()`
  - `deactivateUser(uint256 userId)`
- Tokens:
  - `createToken(string name, string features, uint256 parentId, uint256 amount)`
  - `getTokenInfo(uint256 tokenId)`
  - `getTokenBalance(uint256 tokenId, address owner)`
  - `traceLineage(uint256 tokenId)`
- Transferencias:
  - `createTransfer(uint256 tokenId, address to, uint256 amount)`
  - `transfer(address to, uint256 tokenId, uint256 amount)`  // wrapper alineado con README
  - `acceptTransfer(uint256 transferId)`
  - `rejectTransfer(uint256 transferId)`
  - `consume(uint256 tokenId, uint256 amount)`
- Funciones auxiliares:
  - `getUserByAddress(address who)`
  - `getUserTokens(address user)`
  - `getUserTransfers(address user)`

## 4. Tests actuales (forge test)

- `test_Flow_CreateRawAndTransfer`
- `test_Revert_ConsumerCannotSend`
- `test_Consumer_Consume`
- `test_CancelUserBlocksActions`
- `test_AdminDeactivateUser`
- `test_Transfer_WrapperCreatesTransfer`
- `test_GetUserTokens`

_Comando:_

```bash
forge test -vvv
```

---

## 5. Deploy a Ethereum Sepolia (Alchemy)

Comando utilizado (sin claves):

```bash
forge script script/Deploy.s.sol:DeploySupplyChain \
  --rpc-url "SEPOLIA_RPC_URL" \
  --private-key PRIVATE_KEY \
  --broadcast

Dirección del contrato desplegado:
👉 (se completará después del deploy real)

Fecha: 2025-11-25
Red: Ethereum Sepolia (Alchemy)

### 5.1. Preparación del entorno

- Se creó una App en Alchemy con la red: **Ethereum > Sepolia**
- Se obtuvo el endpoint RPC HTTPS correspondiente:

  `https://eth-sepolia.g.alchemy.com/v2/<API_KEY>`

- Se seleccionó en MetaMask la cuenta a utilizar para firmar la transacción.
- Se obtuvo **ETH de prueba** desde un Faucet de Sepolia (1.134 SepoliaETH).
- Se exportó la private key de la cuenta de MetaMask (solo para uso local en el comando).

### 5.2. Comando utilizado (sin claves reales)

```bash
forge script script/Deploy.s.sol:DeploySupplyChain \
  --rpc-url "SEPOLIA_RPC_URL" \
  --private-key PRIVATE_KEY \
  --broadcast

Donde:

SEPOLIA_RPC_URL es el RPC HTTPS de Alchemy.

PRIVATE_KEY es la clave privada de la cuenta MetaMask utilizada para firmar.

5.3. Resultado del deploy

El contrato fue desplegado correctamente en Ethereum Sepolia.

Dirección del contrato desplegado:
0xcd719932a0F99Be0fEc3bf0CD6056162A831d2e1

Transacción / Broadcast:
El archivo de broadcast generado por Foundry se encuentra en:

supplychain-final/sc/broadcast/Deploy.s.sol/<timestamp>/


Incluye:

Hash de transacción

Gas utilizado

Dirección del contrato

Bytecode y metadata

(El hash exacto se puede verificar en Etherscan o en el archivo broadcast.)

Explorer:
https://sepolia.etherscan.io/address/0xcd719932a0F99Be0fEc3bf0CD6056162A831d2e1

5.4. Fecha

Fecha del deploy: 25 de noviembre de 2025

Red utilizada: Ethereum Sepolia (Alchemy)

## 6. Uso de IA en el desarrollo

### 6.1. IAs utilizadas

- **ChatGPT (modelo GPT-5.1 Thinking)** como asistente principal durante todo el proyecto.
- Ámbitos de uso:
  - Diseño y refactorización del contrato `SupplyChain.sol`.
  - Propuesta y corrección de tests en `SupplyChain.t.sol`.
  - Guía paso a paso en la configuración de Foundry (forge/anvil/cast).
  - Asistencia en el proceso de deploy (local y testnet con Alchemy).
  - Estructuración de la documentación técnica (`IA.md`) y ajuste del README.

### 6.2. Tiempo estimado trabajando con IA

- **Smart Contract + Tests:** ~ 15–20 horas efectivas de trabajo guiado con IA.
- **Configuración de herramientas y Deploy (Foundry + Alchemy + Sepolia):** ~ 6–8 horas.
- **Frontend (React + Web3) y revisión final:** se estimará al cierre del desarrollo, pero se prevé ~ 8–10 horas adicionales.

Estas cifras son aproximadas, basadas en las sesiones de trabajo y en los tramos de desarrollo acompañados por IA.

### 6.3. Errores habituales detectados en el uso de IA

A partir del análisis de los chats y la experiencia práctica, se identifican varios patrones de error:

1. **Suposiciones sin datos suficientes**  
   - En ocasiones, la IA completó información que no estaba disponible (por ejemplo, suponer estados o configuraciones de herramientas externas), lo que llevó a respuestas incorrectas hasta que se aportaron más detalles.

2. **Adelantarse de bloque o de paso**  
   - A veces, la IA proponía varios pasos a la vez (deploy, frontend, documentación) cuando la alumna solo quería avanzar una micro-tarea. Esto se corrigió explícitamente pidiendo “un paso de cada vez”.

3. **Confusión entre entornos (local vs testnet)**  
   - Hubo momentos de confusión entre:
     - cuentas de **Anvil** (local)  
     - cuentas de **MetaMask** en testnet  
     - diferentes RPC (Shape, Sepolia, etc.)
   - Esto generó errores como `insufficient funds` hasta que se aclaró:
     - Anvil solo sirve para entorno local.
     - Para testnet se necesita MetaMask + faucet + RPC correcto.

4. **Verborrea excesiva en algunas respuestas**  
   - En ciertos momentos, las explicaciones fueron demasiado largas para lo que se necesitaba en una etapa concreta del desarrollo.  
   - Se corrigió pidiendo respuestas más cortas y secuenciales.

En conjunto, estos errores no impidieron el avance del proyecto, pero muestran la importancia de:
- validar siempre las respuestas de la IA,
- avanzar por pasos,
- y mantener criterio propio como desarrolladora.

### 6.4. Ficheros y registros de los chats de IA

- Durante el desarrollo se han utilizado múltiples sesiones de ChatGPT para:
  - Diseño del contrato y los tests.
  - Configuración del entorno (Foundry, Anvil, Alchemy, MetaMask).
  - Proceso de deploy en testnet.
  - Planificación del frontend y documentación.
- Los registros de estos chats (capturas y/o exportaciones en PDF) se adjuntan junto con la entrega del proyecto, como evidencia del uso de IA y soporte para la retrospectiva.

