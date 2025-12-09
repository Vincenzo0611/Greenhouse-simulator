// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SensorToken is ERC20, Ownable {
    constructor() ERC20("SensorToken", "SNS") Ownable(msg.sender) {}

    function rewardSensor(address sensor, uint256 amount) public onlyOwner {
        _mint(sensor, amount);
    }
}
