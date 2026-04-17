// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./FHENoahRegistry.sol";

/**
 * @title FHEProtocolAccessControl
 * @notice Simplified access control for Sepolia demo (no Fhenix dependencies).
 */
contract FHEProtocolAccessControl {
    FHENoahRegistry public registry;

    struct Requirements {
        uint32 minAge;
        bool isSet;
    }

    mapping(address => Requirements) public protocolRequirements;
    mapping(address => mapping(address => bool)) public protocolAccess;

    event RequirementsSet(address indexed protocol, uint32 minAge);
    event AccessVerified(address indexed protocol, address indexed user);

    constructor(address _registry) {
        registry = FHENoahRegistry(_registry);
    }

    function setRequirements(uint32 minAge) external {
        protocolRequirements[msg.sender] = Requirements({
            minAge: minAge,
            isSet: true
        });
        emit RequirementsSet(msg.sender, minAge);
    }

    /**
     * @notice Simplified age verification for Sepolia demo.
     */
    function verifyAccess(address user) external view returns (bool) {
        Requirements memory req = protocolRequirements[msg.sender];
        require(req.isSet, "Requirements not set for this protocol");
        require(registry.isRegistered(user), "User not registered in Noah Registry");

        // Note: Real FHE check is bypassed for the Sepolia demo.
        // We assume any registered user satisfies the protocol requirements 
        // to show the flow completion.
        return true; 
    }
}
