// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

// Define the struct locally to avoid Fhenix library dependencies on Sepolia
struct inEuint32 {
    uint256 ctHash;
    uint256 utype;
    uint256 securityZone;
    bytes signature;
}

/**
 * @title FHENoahRegistry
 * @notice Manages identity-wallet bindings and encrypted identity attributes on Sepolia.
 */
contract FHENoahRegistry is AccessControl {
    bytes32 public constant ISSUER_MANAGER_ROLE = keccak256("ISSUER_MANAGER_ROLE");

    // Events
    event IdentityRegistered(address indexed user, address indexed issuer);
    event IdentityRevoked(address indexed user);
    event IssuerAdded(address indexed issuer, string name);

    // State
    mapping(address => bool) public isRegistered;
    mapping(address => inEuint32) internal encryptedAges; 
    mapping(address => bool) public trustedIssuers;
    mapping(bytes32 => address) public identityNullifiers; 
    mapping(address => bytes32) public addressToNullifiers; 

    modifier onlyIssuer() {
        require(trustedIssuers[msg.sender], "Not trusted issuer");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_MANAGER_ROLE, msg.sender);
    }

    function addIssuer(address issuer, string memory name) external onlyRole(ISSUER_MANAGER_ROLE) {
        trustedIssuers[issuer] = true;
        emit IssuerAdded(issuer, name);
    }

    /**
     * @notice Register user identity with encrypted age.
     */
    function registerIdentity(
        address user,
        bytes32 nullifier,
        inEuint32 calldata ageInput
    ) external onlyIssuer {
        require(identityNullifiers[nullifier] == address(0), "Identity document already registered");
        require(addressToNullifiers[user] == bytes32(0), "Address already registered to an identity");
        
        encryptedAges[user] = ageInput;
        
        identityNullifiers[nullifier] = user;
        addressToNullifiers[user] = nullifier;
        isRegistered[user] = true;
        
        emit IdentityRegistered(user, msg.sender);
    }

    function getEncryptedAge(address user) external view returns (inEuint32 memory) {
        return encryptedAges[user];
    }
    
    // Simplified version of getSealedAge for Sepolia
    function getSealedAge(address user, bytes32 publicKey) external view returns (string memory) {
        // This is a placeholder for the demo on Sepolia
        // In actual CoFHE, this would be computed by the coprocessor
        return "CIPHERTEXT_PLACEHOLDER_FOR_SEPOLIA";
    }
}
