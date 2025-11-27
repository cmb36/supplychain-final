// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SupplyChain.sol";

contract DeploySupplyChain is Script {
    function run() external {
        // forge usará la private key que le pasemos por CLI
        vm.startBroadcast();
        new SupplyChain();
        vm.stopBroadcast();
    }
}
