//SPDX-License-Identifier:MIT

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/governance/TimelockController.sol";
contract TimeLock is TimelockController {
    // minDelay: How long you have to wait before executing
    // proposers is the list of addresses that can propose
    // executor: who can execute when a proposal passes
    constructor( uint256 minDelay,
                 address[] memory proposers,
                 address[] memory executors,
                 address admin)TimelockController(minDelay,proposers,executors,admin){

    }
}