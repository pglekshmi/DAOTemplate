//SPDX-License-Identifier:MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable{
    uint256 private value;

    constructor(address initialOwner)Ownable(initialOwner){

    }

    event valueStored(uint256 newValue);
 
    function store(uint256 newValue) public onlyOwner{
        value=newValue;
        emit valueStored(newValue);
    }

    function retrieve() public view returns(uint256){
        return value;
    }

}
