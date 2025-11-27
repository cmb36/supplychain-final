// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain sc;

    address admin = address(0xA);
    address producer = address(0xB);
    address factory  = address(0xC);
    address retailer = address(0xD);

    function setUp() public {
        vm.startPrank(admin);
        sc = new SupplyChain();
        vm.stopPrank();

        vm.prank(producer);
        sc.requestUserRole(SupplyChain.Role.Producer);
        vm.startPrank(admin);
        sc.approveUser(1, SupplyChain.Role.Producer);
        vm.stopPrank();

        vm.prank(factory);
        sc.requestUserRole(SupplyChain.Role.Factory);
        vm.startPrank(admin);
        sc.approveUser(2, SupplyChain.Role.Factory);
        vm.stopPrank();

        vm.prank(retailer);
        sc.requestUserRole(SupplyChain.Role.Retailer);
        vm.startPrank(admin);
        sc.approveUser(3, SupplyChain.Role.Retailer);
        vm.stopPrank();
    }

    function test_Flow_CreateRawAndTransfer() public {
        vm.startPrank(producer);
        uint256 tokenId = sc.createToken("Trigo", '{"grade":"A"}', 0, 100);
        assertEq(tokenId, 1);
        assertEq(sc.getTokenBalance(tokenId, producer), 100);
        vm.stopPrank();

        vm.startPrank(producer);
        uint256 txId = sc.createTransfer(tokenId, factory, 40);
        vm.stopPrank();

        vm.startPrank(factory);
        sc.acceptTransfer(txId);
        vm.stopPrank();

        assertEq(sc.getTokenBalance(tokenId, producer), 60);
        assertEq(sc.getTokenBalance(tokenId, factory), 40);
    }

    function test_Transfer_WrapperCreatesTransfer() public {
        // Producer crea un token de materia prima
        vm.startPrank(producer);
        uint256 tokenId = sc.createToken("Trigo", "{}", 0, 50);

        // Usamos la NUEVA función transfer(...) en lugar de createTransfer(...)
        uint256 txId = sc.transfer(factory, tokenId, 20);
        vm.stopPrank();

        // Factory acepta la transferencia
        vm.startPrank(factory);
        sc.acceptTransfer(txId);
        vm.stopPrank();

        // Comprobamos los balances finales
        assertEq(sc.getTokenBalance(tokenId, producer), 30);
        assertEq(sc.getTokenBalance(tokenId, factory), 20);
    }

    function test_Revert_ConsumerCannotSend() public {
        // Registrar y aprobar un Consumer
        address consumer = address(0xE);
        vm.prank(consumer);
        sc.requestUserRole(SupplyChain.Role.Consumer);
        vm.startPrank(admin);
        sc.approveUser(4, SupplyChain.Role.Consumer);
        vm.stopPrank();

        // Producer crea materia prima y le transfiere al Consumer de forma ilegal (debe fallar antes)
        vm.startPrank(producer);
        uint256 tokenId = sc.createToken("Trigo", "{}", 0, 10);
        // Producer solo puede enviar a Factory; enviar a Consumer debe revertir por "Invalid next role"
        vm.expectRevert(bytes("Invalid next role"));
        sc.createTransfer(tokenId, consumer, 1);
        vm.stopPrank();
    }

    function test_Consumer_Consume() public {
        // Arrange: Producer crea y envía a Factory; Factory a Retailer; Retailer a Consumer
        address consumer = address(0xE);

        // Registrar y aprobar Consumer
        vm.prank(consumer);
        sc.requestUserRole(SupplyChain.Role.Consumer);
        vm.startPrank(admin);
        sc.approveUser(4, SupplyChain.Role.Consumer);
        vm.stopPrank();

        // Producer crea materia prima
        vm.startPrank(producer);
        uint256 tokenId = sc.createToken("Trigo", "{}", 0, 20);
        // Producer -> Factory
        uint256 txPF = sc.createTransfer(tokenId, factory, 20);
        vm.stopPrank();

        vm.startPrank(factory);
        sc.acceptTransfer(txPF);
        // Factory -> Retailer
        uint256 txFR = sc.createTransfer(tokenId, retailer, 15);
        vm.stopPrank();

        vm.startPrank(retailer);
        sc.acceptTransfer(txFR);
        // Retailer -> Consumer
        uint256 txRC = sc.createTransfer(tokenId, consumer, 10);
        vm.stopPrank();

        vm.startPrank(consumer);
        sc.acceptTransfer(txRC);
        // Consume 4 unidades
        sc.consume(tokenId, 4);
        assertEq(sc.getTokenBalance(tokenId, consumer), 6);
        vm.stopPrank();
    }

    function test_CancelUserBlocksActions() public {
        // Registrar y aprobar Producer (ya lo haces en setUp: userId=1)
        // Producer crea OK
        vm.startPrank(producer);
        uint256 tokenId = sc.createToken("Maiz", "{}", 0, 5);
        vm.stopPrank();

        // Producer se cancela
        vm.startPrank(producer);
        sc.cancelMyUser();
        vm.stopPrank();

        // Ahora intentar crear token debe fallar por onlyApproved
        vm.startPrank(producer);
        vm.expectRevert(bytes("User not approved"));
        sc.createToken("Trigo", "{}", 0, 1);
        vm.stopPrank();
    }

    function test_AdminDeactivateUser() public {
        // Desactivar Factory (userId=2 en setUp)
        vm.startPrank(admin);
        sc.deactivateUser(2);
        vm.stopPrank();

        // Factory intenta aceptar una transferencia => bloqueado
        vm.startPrank(factory);
        vm.expectRevert(bytes("User not approved"));
        // cualquier función con onlyApproved: por ejemplo, acceptTransfer(999) da error por approved antes
        // simulamos la llamada mínima
        // Nota: no hay transfer 999; pero el revert esperado es "User not approved" anterior
        sc.acceptTransfer(1);
        vm.stopPrank();
    }

    function test_GetUserTokens() public {
        // Producer crea dos tokens de materia prima
        vm.startPrank(producer);
        uint256 tokenId1 = sc.createToken("Trigo", "{}", 0, 100);
        uint256 tokenId2 = sc.createToken("Maiz", "{}", 0, 50);
        vm.stopPrank();

        // Obtenemos los tokens del Producer
        uint256[] memory tokensProducer = sc.getUserTokens(producer);

        // Debe tener exactamente 2 tokens
        assertEq(tokensProducer.length, 2);

        // Y deben corresponder a los tokenIds creados
        assertEq(tokensProducer[0], tokenId1);
        assertEq(tokensProducer[1], tokenId2);
    }


}
