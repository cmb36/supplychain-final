📘 IA.md – Diario Técnico del Proyecto SupplyChain Tracker
Documento técnico creado para registrar decisiones, aprendizajes, problemas reales y soluciones aplicadas durante el desarrollo del proyecto SupplyChain Tracker, realizado en el marco del curso Ethereum/Blockchain de CodeCrypto Academy.
________________________________________
🌐 1. Contexto y propósito del proyecto
El proyecto consiste en construir una aplicación descentralizada para gestionar la trazabilidad de productos en una cadena de suministro, garantizando transparencia, control de roles y seguridad en cada etapa.
Los requisitos principales fueron:
•	Contrato inteligente con roles y permisos claros.
•	Tokenización de productos (materia prima y derivados).
•	Flujo de transferencias validado y seguro.
•	Tests automatizados con Foundry.
•	Deploy en red de pruebas (Sepolia).
•	Frontend Web3 funcional (React + MetaMask).
Este documento registra el proceso técnico completo desde cero.
________________________________________
🧩 2. Estructura final del proyecto
supplychain-final/
│
├── sc/                     # Smart contracts + tests + scripts
│   ├── src/                # SupplyChain.sol
│   ├── test/               # SupplyChain.t.sol
│   ├── script/             # Deploy.s.sol
│   └── foundry.toml
│
├── web/                    # Frontend (React + Vite)
│   ├── src/                # Contextos, componentes, hooks, ABI
│   └── package.json
│
├── docs/                   # Documentación del proyecto
│   ├── IA.md               # Este diario técnico
│   └── README_SPEC.md      # Especificaciones adicionales
│
└── README.md               # Documento principal del repositorio
________________________________________
🧱 3. Diseño del contrato SupplyChain.sol
El contrato se basa en tres pilares:
✔ Gestión de usuarios
Roles definidos: Producer, Factory, Retailer, Consumer y Admin.
El administrador controla:
•	aprobación de usuarios
•	rechazo
•	desactivación
✔ Tokenización de productos
Cada token incluye:
•	nombre
•	características
•	cantidad
•	parentId
•	balances por usuario
•	creador
Permite crear:
•	materia prima (parentId = 0)
•	productos derivados
✔ Transferencias validadas
Cada transferencia debe cumplir:
•	flujo correcto: Producer → Factory → Retailer → Consumer
•	receptor aprobado
•	aceptación explícita
•	balance suficiente
La función traceLineage permite obtener el linaje completo.
________________________________________
🛠 4. Decisiones técnicas relevantes
🟣 Control de acceso
Uso de modificadores para garantizar:
•	estado del usuario
•	rol correcto
•	integridad del flujo
🟣 Manejo de balances
Se utilizó:
mapping(address => uint256) balances;
dentro del struct del token.
Modelo más simple y adecuado para nuestro negocio.
🟣 Modelo de transferencias
Patrón pull: el receptor acepta, evitando entregas no deseadas.
🟣 Trazabilidad
Implementación optimizada del linaje mediante traceLineage.
________________________________________
🧪 5. Testing con Foundry
Los tests cubren:
•	Registro y aprobación
•	Creación de tokens
•	Transferencias válidas
•	Errores esperados
•	Consumo por parte del Consumer
Comando principal:
forge test -vvv
Todos los tests pasan en la versión final.
________________________________________
🚀 6. Deploy y configuración del entorno
🟣 Deploy local (Anvil)
Usado para desarrollo y pruebas con MetaMask + frontend.
🟣 Deploy en testnet (Sepolia – Alchemy)
Contrato desplegado en:
0xcd719932a0F99Be0fEc3bf0CD6056162A831d2e1
Se utilizaron variables de entorno para proteger claves privadas.
________________________________________
🧩 Inicialización del Admin
Después de cada deploy en Anvil, se debe reclamar la administración:
cast send <contract> "claimAdmin()" \
  --private-key <clave_anvil> \
  --rpc-url http://127.0.0.1:8545
Notas:
•	Solo una vez por deploy.
•	En testnet NO debe repetirse.
•	En Anvil sí, porque la cadena se reinicia cada vez.
________________________________________
🖥 7. Integración Web3 – Frontend
Frontend desarrollado con:
•	React + Vite
•	ethers.js v6
•	Contexto Web3 propio
•	Arquitectura por componentes
Incluye:
•	conexión MetaMask
•	registro de usuario
•	panel del administrador
•	panel por roles
•	creación y transferencias de tokens
•	trazabilidad completa
El objetivo fue claridad + funcionalidad real para demostrar todo el flujo.
________________________________________
🔧 8. Problemas encontrados y soluciones aplicadas
🟣 Repositorios Git conflictivos
Había un .git dentro de sc/ → impedía versionar la raíz.
Solución: eliminarlo y crear uno limpio en /.
🟣 Confusión entre Anvil, MetaMask y Testnet
Cuentas distintas, saldos distintos y RPC distintos.
Solución: documentación clara + uso consistente de cada entorno.
🟣 Integración del frontend
Se reestructuró completamente:
•	lógica de roles
•	carga de usuario
•	listeners
•	refresh automático
•	soporte para claimAdmin
•	trazabilidad
🟣 Ayuda de IA

Se utilizaron distintas herramientas de IA para apoyar el desarrollo, siempre con validación manual posterior:
- ChatGPT (*Light*) → apoyo en diseño del contrato, depuración de errores, estructura del frontend, documentación y claridad conceptual.
- Cursor (con IA integrada) → sugerencias de código directamente en el editor, refactors puntuales y ayuda contextual en archivos concretos.
Toda la lógica crítica fue revisada, probada y ajustada manualmente antes de considerarse definitiva.

🟣 Validación manual
Cada decisión generada por IA fue revisada, testeada y depurada manualmente.
________________________________________
🧠 9. Aprendizajes técnicos y personales
•	Avanzar por pasos pequeños.
•	Validar respuestas de la IA antes de aplicarlas.
•	Mantener claridad en la estructura del proyecto.
•	Comprender profundamente roles, permisos y flujos.
•	Integrar contrato + frontend de forma real.
•	Deploy en testnet y diferencias con entornos locales.
•	Aprender a gestionar errores reales de blockchain.
Este proyecto ha sido tanto técnico como personal: precisión, disciplina y confianza en el proceso.
________________________________________
🦋 10. Conclusión
SupplyChain Tracker es un sistema completo que incluye:
•	contrato inteligente
•	testing
•	deployments (local + testnet)
•	interfaz web fully functional
•	documentación técnica detallada
Representa un cierre sólido del módulo y un paso hacia desarrollos más avanzados en Web3.
________________________________________
✨ 11. Autora
Carla Bozzano
Ingeniera en Informática · Coach Holística · Desarrolladora Blockchain
Creado con intención, precisión y propósito.

