// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentRegistry
 * @dev Registry for x402-style agents with reputation tracking and access control.
 * Allows whitelisting agents, tracking their anchoring activity, and enforcing quotas.
 */
contract AgentRegistry {
    
    struct Agent {
        address agentAddress;
        string agentId;              // Human-readable identifier (e.g., "PoEC-Agent-01")
        bool isActive;               // Can this agent anchor proofs?
        uint256 registeredAt;        // Registration timestamp
        uint256 proofsAnchored;      // Total proofs submitted
        uint256 lastAnchorTime;      // Last activity timestamp
        string metadata;             // IPFS CID or JSON metadata
    }
    
    // Mappings
    mapping(address => Agent) public agents;
    mapping(string => address) public agentIdToAddress;
    
    address[] public agentAddresses;
    
    // Access control
    address public admin;
    
    // Configuration
    uint256 public dailyAnchorLimit = 100;  // Max proofs per agent per day
    bool public requireWhitelist = true;     // Only registered agents can anchor
    
    // Events
    event AgentRegistered(
        address indexed agentAddress,
        string agentId,
        uint256 timestamp
    );
    
    event AgentActivated(address indexed agentAddress);
    event AgentDeactivated(address indexed agentAddress);
    
    event ProofAnchored(
        address indexed agentAddress,
        string agentId,
        uint256 timestamp
    );
    
    event ConfigUpdated(uint256 dailyLimit, bool whitelistRequired);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyActiveAgent() {
        require(agents[msg.sender].isActive, "Agent not active");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Register a new agent (admin only).
     * @param _agentAddress The Ethereum address of the agent
     * @param _agentId Human-readable identifier
     * @param _metadata IPFS CID or JSON metadata about the agent
     */
    function registerAgent(
        address _agentAddress,
        string memory _agentId,
        string memory _metadata
    ) public onlyAdmin {
        require(agents[_agentAddress].registeredAt == 0, "Agent already registered");
        require(agentIdToAddress[_agentId] == address(0), "Agent ID already taken");
        
        agents[_agentAddress] = Agent({
            agentAddress: _agentAddress,
            agentId: _agentId,
            isActive: true,
            registeredAt: block.timestamp,
            proofsAnchored: 0,
            lastAnchorTime: 0,
            metadata: _metadata
        });
        
        agentIdToAddress[_agentId] = _agentAddress;
        agentAddresses.push(_agentAddress);
        
        emit AgentRegistered(_agentAddress, _agentId, block.timestamp);
    }
    
    /**
     * @dev Activate an agent (admin only).
     */
    function activateAgent(address _agentAddress) public onlyAdmin {
        require(agents[_agentAddress].registeredAt > 0, "Agent not registered");
        agents[_agentAddress].isActive = true;
        emit AgentActivated(_agentAddress);
    }
    
    /**
     * @dev Deactivate an agent (admin only).
     */
    function deactivateAgent(address _agentAddress) public onlyAdmin {
        require(agents[_agentAddress].registeredAt > 0, "Agent not registered");
        agents[_agentAddress].isActive = false;
        emit AgentDeactivated(_agentAddress);
    }
    
    /**
     * @dev Record a proof anchor by an agent (called by ResultAnchor contract).
     * Can also be called directly by agent for tracking.
     */
    function recordAnchor() public onlyActiveAgent {
        Agent storage agent = agents[msg.sender];
        
        // Check daily limit
        if (block.timestamp - agent.lastAnchorTime < 1 days) {
            // Within same day - check if limit exceeded
            // NOTE: This is a simplified check. Production would need better time tracking.
            require(agent.proofsAnchored < dailyAnchorLimit, "Daily anchor limit exceeded");
        }
        
        agent.proofsAnchored++;
        agent.lastAnchorTime = block.timestamp;
        
        emit ProofAnchored(msg.sender, agent.agentId, block.timestamp);
    }
    
    /**
     * @dev Check if an agent is authorized to anchor proofs.
     */
    function isAgentAuthorized(address _agentAddress) public view returns (bool) {
        if (!requireWhitelist) {
            return true;  // Open access mode
        }
        
        Agent memory agent = agents[_agentAddress];
        return agent.isActive && agent.registeredAt > 0;
    }
    
    /**
     * @dev Get agent details.
     */
    function getAgent(address _agentAddress) public view returns (Agent memory) {
        return agents[_agentAddress];
    }
    
    /**
     * @dev Get agent by ID.
     */
    function getAgentByIdString(string memory _agentId) public view returns (Agent memory) {
        address agentAddr = agentIdToAddress[_agentId];
        require(agentAddr != address(0), "Agent ID not found");
        return agents[agentAddr];
    }
    
    /**
     * @dev Get total number of registered agents.
     */
    function getAgentCount() public view returns (uint256) {
        return agentAddresses.length;
    }
    
    /**
     * @dev Get agent address by index (for iteration).
     */
    function getAgentAddressByIndex(uint256 index) public view returns (address) {
        require(index < agentAddresses.length, "Index out of bounds");
        return agentAddresses[index];
    }
    
    /**
     * @dev Update configuration (admin only).
     */
    function updateConfig(uint256 _dailyLimit, bool _requireWhitelist) public onlyAdmin {
        dailyAnchorLimit = _dailyLimit;
        requireWhitelist = _requireWhitelist;
        
        emit ConfigUpdated(_dailyLimit, _requireWhitelist);
    }
    
    /**
     * @dev Transfer admin rights (admin only).
     */
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }
    
    /**
     * @dev Update agent metadata (admin only).
     */
    function updateAgentMetadata(address _agentAddress, string memory _metadata) public onlyAdmin {
        require(agents[_agentAddress].registeredAt > 0, "Agent not registered");
        agents[_agentAddress].metadata = _metadata;
    }
}
