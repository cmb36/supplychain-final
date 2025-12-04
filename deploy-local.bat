@echo off

echo.

echo ========================================

echo   Desplegando Contrato en Red Local

echo ========================================

echo.



cd sc



echo Desplegando SupplyChain...

echo.



REM Ejecutar el deploy y capturar output

forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast > deploy_output.txt 2>&1



REM Mostrar el output del deploy

type deploy_output.txt



echo.

echo ========================================

echo   Variable para web\.env

echo ========================================

echo.



REM Extraer direccion del contrato desplegado

powershell -Command "& {$content = Get-Content 'deploy_output.txt' -Raw; if($content -match 'Contract Address:\s+([0-9a-fA-Fx]+)'){$address=$matches[1]} elseif($content -match '0x[a-fA-F0-9]{40}' -and $content -match 'SupplyChain'){$address=($content | Select-String -Pattern '(0x[a-fA-F0-9]{40})' -AllMatches).Matches[0].Value} else {$address='DIRECCION_NO_ENCONTRADA'}; Write-Host \"VITE_CONTRACT_ADDRESS=$address\"}"



echo.

echo Cuenta Admin (Anvil Account #0):

echo   Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

echo   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

echo.

echo Siguiente paso:

echo   1. Copia la linea "VITE_CONTRACT_ADDRESS=..." a tu archivo web/.env

echo   2. Actualiza tambien en web/src/contract.js la variable CONTRACT_ADDRESS

echo   3. Reinicia el frontend: cd web ^&^& npm run dev

echo   4. Conecta MetaMask con la cuenta admin usando la private key de arriba

echo   5. Asegurate de tener Anvil corriendo en otra terminal: anvil

echo.



REM Volver al directorio raiz

cd ..



REM Limpiar archivo temporal

del sc\deploy_output.txt



pause


