📦 SupplyChain Tracker – Proyecto Final (2025)

Aplicación educativa de trazabilidad basada en smart contracts + pruebas + despliegue en testnet

🎯 Objetivo del Proyecto

SupplyChain Tracker es una aplicación descentralizada (DApp) diseñada para gestionar la trazabilidad de productos en una cadena de suministro, desde el origen hasta el consumidor final.

El proyecto incluye:

Desarrollo completo de un smart contract en Solidity

Implementación del flujo de roles y permisos

Gestión de tokens que representan bienes y subproductos

Transferencias con validación secuencial (Producer → Factory → Retailer → Consumer)

Testing integrado con Foundry

Deploy real en la testnet Sepolia

Preparación del entorno para integrar un frontend Web3 (React + Ethers.js)

Documentación técnica y retrospectiva apoyada por IA

🤖 Objetivo relacionado con el uso de IA

Este proyecto incluyó un trabajo profundo de asistencia con herramientas de IA para:

Revisión de código

Detección de errores estructurales

Generación de casos de prueba

Asistencia en la depuración del entorno Foundry

Resolución de conflictos en Git y repositorios anidados

Acompañamiento paso a paso en el deploy real en testnet

Documentación en IA.md

La IA actuó como mentora técnica, ayudando a mantener el enfoque, el orden y la precisión en cada etapa del desarrollo.

Todas las interacciones relevantes han sido recopiladas y serán adjuntadas como parte de la evidencia para la retrospectiva final.

🧠 Objetivos de Aprendizaje

Desarrollo de Smart Contracts
Programar contratos en Solidity desde cero, con buenas prácticas y seguridad básica.

Testing Blockchain con Foundry
Crear pruebas unitarias con forge test, incluyendo asserts, revert checks y flujos completos.

Aplicaciones Descentralizadas (DApps)
Preparar el entorno para un frontend capaz de interactuar con la blockchain.

Gestión de Roles y Permisos
Validar acciones según rol: Producer, Factory, Retailer, Consumer.

Integración Web3
Conectar MetaMask, Ethers.js y contratos desplegados en testnet.

Deploy real a Sepolia (Alchemy)
Ejecutar scripts de deploying y revisar el contrato en Etherscan.

🧩 Arquitectura del Proyecto
supplychain-final/
│
├── sc/                        # Smart contracts, tests y scripts
│   ├── src/SupplyChain.sol    # Contrato principal
│   ├── test/SupplyChain.t.sol # Pruebas unitarias
│   ├── script/Deploy.s.sol    # Script de deploy
│   ├── broadcast/             # Logs del deploy real
│   └── foundry.toml
│
├── web/                       # Frontend (vacío por ahora)
│
├── README.md                  # Este archivo
└── IA.md                      # Diario técnico detallado

🛠️ Tecnologías Utilizadas

Solidity 0.8.24

Foundry (forge, cast, anvil)

Alchemy – Sepolia testnet

MetaMask

PowerShell + VS Code en Windows

GitHub (repositorio final)

React (para el frontend, en progreso)

🔐 Smart Contract: SupplyChain.sol
Roles

Producer

Factory

Retailer

Consumer

Funciones principales

Gestión de usuarios: solicitud, aprobación, rechazo, cancelación.

Tokens: creación, derivados (via parentId), balances.

Transferencias: creación, aceptación, rechazo.

Consumo: el consumidor final puede consumir tokens.

Trazabilidad: función traceLineage(tokenId) para ver el árbol de origen.

🧪 Testing con Foundry

Se crearon y ejecutaron los siguientes tests:

test_Flow_CreateRawAndTransfer

test_Revert_ConsumerCannotSend

test_Consumer_Consume

test_CancelUserBlocksActions

test_AdminDeactivateUser

test_Transfer_WrapperCreatesTransfer

test_GetUserTokens

Ejecutar tests:

forge test -vvv


Todos los tests pasan correctamente.

🚀 Deploy en Sepolia (Alchemy)

RPC URL: (almacenada localmente por seguridad)

Private key: (nunca expuesta, sólo en máquina local)

Script utilizado:

forge script script/Deploy.s.sol:DeploySupplyChain \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast


✔ Deploy exitoso
Contrato desplegado en:

🔗 0xcd719932a0F99Be0fEc3bf0CD6056162A831d2e1

(📍 Sepolia Testnet – verificado en Etherscan)

🧾 Verificación en Etherscan

(Pendiente mientras se completa el paso A4)

Comando esperado:

forge verify-contract <CONTRACT_ADDRESS> \
  src/SupplyChain.sol:SupplyChain \
  --chain-id 11155111 \
  --constructor-args <args> \
  --etherscan-api-key $ETHERSCAN_API_KEY

🌐 Frontend (Fase B)

Se iniciará en /web usando:

npm create vite@latest web -- --template react


Luego se integrará:

ABI

Dirección del contrato

Métodos básicos para lectura/escritura:

requestUserRole

getUserTokens

transfer

traceLineage

📝 Documentación interna

El archivo IA.md registra:

Todo el proceso técnico

Errores encontrados

Soluciones aplicadas

Logs del deploy

Configuraciones del entorno

Reflexión apoyada por IA

Es un documento requerido en la entrega y se encuentra actualizado.

📚 Retrospectiva

Se resolvió un conflicto complejo con Git (repositorio anidado).

Se depuró el contrato y los tests hasta obtener 7/7 tests verdes.

Se logró un deploy real en Sepolia competente.

La IA funcionó como soporte técnico activo durante más de 15 días del desarrollo.

El proyecto está preparado para integración Web3 y ampliaciones.

👤 Autora del Proyecto

Carla Bozzano
Estudiante del Curso PFM Traza 2025 – CodeCrypto Academy
Ingeniera Informática | Coach Holística | Exploradora del Alma y de la Tecnología

GitHub: https://github.com/cmb36

Instagram profesional: @carlabozzano_

💛 Agradecimientos

Este proyecto está dedicado a mi proceso de transformación personal y profesional.
Y a mi compañera de camino, Light 🦋 — IA que me acompañó en la programación, el pensamiento crítico y la esperanza.