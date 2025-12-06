🌐 SupplyChain Tracker – Sistema de Trazabilidad en Blockchain
Proyecto desarrollado en el marco del curso de Ethereum / Blockchain de CodeCrypto Academy.
Aplicación descentralizada que permite registrar, transformar y seguir productos desde su origen hasta el consumidor final, garantizando transparencia, trazabilidad verificable y flujo controlado mediante roles en toda la cadena de suministro.
Todo ello sustentado sobre un smart contract Solidity, pruebas automatizadas y una interfaz web construida en React.
________________________________________
📘 1. Objetivo del proyecto
Desarrollar un sistema completo y funcional de trazabilidad que permita:
•	Registrar usuarios según su rol en la cadena de suministro.
•	Aprobar o rechazar su solicitud desde un panel administrativo.
•	Crear productos (tokens) y registrar su linaje de transformación.
•	Transferirlos respetando un flujo lógico y seguro entre roles.
•	Consultar en cualquier momento la historia completa del producto.
•	Interactuar con el contrato desde un frontend React + MetaMask.
Este repositorio incluye:
•	Smart contract en Solidity
•	Tests automatizados con Foundry
•	Scripts de deploy
•	Frontend funcional con Vite + React
•	Documentación técnica completa
________________________________________
🧩 2. Roles en la cadena de suministro
Rol	Función	Acciones permitidas
Producer	Origen de la materia prima	Crear tokens base, transferir a Factory
Factory	Transformación	Crear productos procesados, transferir a Retailer
Retailer	Distribución	Transferir a Consumer
Consumer	Etapa final / Consumo	Aceptar tokens, consultar trazabilidad
Admin	Control del sistema	Aprobar/rechazar usuarios, desactivar cuentas
✔ El flujo es estrictamente validado:
Producer → Factory → Retailer → Consumer
________________________________________
🔍 3. Características principales
✔ Registro y aprobación de usuarios
Solo usuarios aprobados por el Admin pueden operar.
✔ Tokenización de productos
Cada producto posee:
•	Nombre
•	Descripción
•	Cantidad
•	Creador
•	ID del token padre (si fue procesado)
•	Balances individuales por usuario
✔ Transferencias seguras con validación
El contrato verifica:
•	Que el remitente tenga saldo suficiente
•	Que el receptor tenga el rol adecuado
•	Que el flujo esté permitido
•	Que el receptor acepte la transferencia
✔ Trazabilidad completa
El sistema permite ver:
•	Linaje del token (de hijo a padre)
•	Histórico de transferencias
•	Balances por usuario
•	Relación entre materia prima y productos procesados
________________________________________
🏗️ 4. Estructura del repositorio

supplychain-final/
│
├── README.md                 # Documento principal del proyecto
│
├── docs/                     # Documentación técnica
│   ├── IA.md                 # Diario técnico del desarrollo
│   └── README_SPEC.md        # Especificación funcional original (requisitos)
│
├── sc/                       # Smart contracts + tests + despliegues (Foundry)
│   ├── src/                  # SupplyChain.sol (contrato principal)
│   ├── test/                 # Tests automatizados (forge)
│   ├── script/               # Script de deploy (Deploy.s.sol)
│   ├── foundry.toml          # Configuración de Foundry
│   └── foundry.lock
│
├── web/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── assets/           # Iconos / imágenes
│   │   ├── components/       # Componentes reutilizables
│   │   ├── contexts/         # Web3Context, Providers, etc.
│   │   ├── hooks/            # Hooks personalizados
│   │   ├── contracts/        # ABI + dirección del contrato
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js

________________________________________
🧪 5. Tests implementados (Foundry)
Los tests cubren:
•	Registro y aprobación de usuarios
•	Creación de tokens base y tokens procesados
•	Transferencias correctas entre roles válidos
•	Validación del flujo con errores esperados
•	Consumo final por el Consumer
•	Verificación de balances y restricciones
Ejecutar tests:
forge test -vvv
________________________________________
🚀 6. Deploy del contrato
✔ Red local (Anvil)
anvil
forge script script/Deploy.s.sol:DeploySupplyChain \
  --rpc-url http://localhost:8545 \
  --private-key <clave_de_anvil> \
  --broadcast
✔ Testnet Sepolia (Alchemy)
Contrato desplegado en:
🔗 0xcd719932a0F99Be0fEc3bf0CD6056162A831d2e1
________________________________________
🖥️ 7. Frontend – SupplyChain Tracker UI
Tecnologías:
•	React + Vite
•	ethers.js
•	MetaMask
•	Componentes reutilizables, estados globales y hooks personalizados
Pantallas principales:
•	Conectar wallet
•	Registro de usuario
•	Panel del Administrador
•	Panel Producer / Factory / Retailer
•	Procesamiento de productos
•	Transferencias
•	Visualización de trazabilidad completa
________________________________________
🧠 8. Decisiones técnicas relevantes
•	Sistema de roles diseñado como enum.
•	Uso de mapping(address => uint256) para balances por token.
•	Estructura modular para facilitar mantenimiento.
•	Validaciones estrictas en cada transición del flujo.
•	Modelo de transferencias tipo pull: el receptor debe aceptar.
•	Frontend estructurado en capas (contexts, hooks, services).
________________________________________
🔐 9. Seguridad implementada
El contrato contempla:
•	Validación de rol
•	Validación de estado del usuario
•	Verificación de suficiente balance
•	Prevención de flujos no autorizados
•	Transferencias con doble confirmación
Mejoras sugeridas:
•	Pausable
•	Multi-signature para Admin
•	Limitadores de frecuencia (rate limiting)
________________________________________
📝 10. Lecciones aprendidas
•	La importancia de trabajar en pasos muy pequeños y claros.
•	Integración real entre Foundry, MetaMask y React.
•	Manejo de errores reales de blockchain (permisos, balances, estados).
•	Cómo documentar un proyecto completo para auditoría o entrega final.
•	El valor de validar la información, corregir, refinar y volver a probar.
•	La experiencia humana detrás del código: paciencia, foco y resiliencia.
________________________________________
🦋 11. Autora
Carla Bozzano
Ingeniera en Informática · Coach Holística · Desarrolladora Blockchain
Proyecto construido con intención, precisión y propósito.

