# AgentRegistry Contract - Optional Enhancement

## Overview

The `AgentRegistry` contract provides enterprise-grade agent management for PoEC v2:
- Whitelist authorized agents
- Track agent reputation (proofs anchored)
- Enforce daily quotas
- Access control via admin

## Features

### 1. Agent Registration
```solidity
function registerAgent(
    address _agentAddress,
    string memory _agentId,
    string memory _metadata
) public onlyAdmin
```

**Use Case**: Admin adds trusted agents to the registry.

### 2. Activation/Deactivation
```solidity
function activateAgent(address _agentAddress) public onlyAdmin
function deactivateAgent(address _agentAddress) public onlyAdmin
```

**Use Case**: Temporarily disable compromised agents without deleting.

### 3. Proof Anchoring Tracking
```solidity
function recordAnchor() public onlyActiveAgent
```

**Use Case**: Called by agent after each ResultAnchor.anchorProof() to track activity.

### 4. Authorization Check
```solidity
function isAgentAuthorized(address _agentAddress) public view returns (bool)
```

**Use Case**: ResultAnchor contract checks before allowing proof submission.

## Deployment

```bash
cd contracts
npx hardhat run scripts/deploy_agent_registry.js --network localhost
```

Output:
```
✅ AgentRegistry deployed to: 0x...
📝 Default agent registered
Agent Details:
  ID: PoEC-Agent-01
  Address: 0x...
  Active: true
```

## Integration with ResultAnchor (Optional)

Modify `ResultAnchor.sol` to check agent authorization:

```solidity
contract ResultAnchor {
    AgentRegistry public agentRegistry;
    
    constructor(address _agentRegistry) {
        agentRegistry = AgentRegistry(_agentRegistry);
    }
    
    function anchorProof(...) public {
        require(
            agentRegistry.isAgentAuthorized(msg.sender),
            "Agent not authorized"
        );
        
        // ... existing logic ...
        
        // Record activity
        agentRegistry.recordAnchor();
    }
}
```

## Configuration

### Open Access Mode
```solidity
agentRegistry.updateConfig(100, false);  // No whitelist required
```

### Strict Mode
```solidity
agentRegistry.updateConfig(50, true);   // Whitelist + 50 proofs/day limit
```

## Agent Lifecycle

1. **Registration**: Admin calls `registerAgent()`
2. **Activation**: Agent is active by default
3. **Operation**: Agent calls ResultAnchor, which calls `recordAnchor()`
4. **Monitoring**: Admin checks `getAgent()` for activity stats
5. **Deactivation**: Admin can disable if needed

## Use Cases

### Enterprise Deployment
- Multiple agents from different departments
- Quota enforcement per agent
- Audit trail of who anchored what

### Public Network
- Open access mode (no whitelist)
- Reputation tracking only
- Spam prevention via daily limits

### Hybrid Model
- Whitelist for production
- Open for testnet
- Environment-specific configs

## Testing

```javascript
// test/AgentRegistry.test.js
const { expect } = require("chai");

describe("AgentRegistry", function () {
  it("Should register and activate agent", async function () {
    const [admin, agent1] = await ethers.getSigners();
    
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const registry = await AgentRegistry.deploy();
    
    await registry.registerAgent(
      agent1.address,
      "TestAgent",
      "metadata"
    );
    
    const authorized = await registry.isAgentAuthorized(agent1.address);
    expect(authorized).to.equal(true);
  });
});
```

Run:
```bash
npx hardhat test test/AgentRegistry.test.js
```

## Admin Commands

### Register New Agent
```javascript
await agentRegistry.registerAgent(
  "0x...",
  "PoEC-Agent-02",
  "Production agent for fraud detection"
);
```

### Check Agent Stats
```javascript
const agent = await agentRegistry.getAgent("0x...");
console.log("Proofs anchored:", agent.proofsAnchored);
console.log("Last active:", new Date(agent.lastAnchorTime * 1000));
```

### Update Daily Limit
```javascript
await agentRegistry.updateConfig(200, true);  // 200 proofs/day
```

### Deactivate Agent
```javascript
await agentRegistry.deactivateAgent("0x...");
```

## Security Considerations

1. **Admin Key**: Protect admin private key (use multisig in production)
2. **Agent Keys**: Each agent should have separate key
3. **Quotas**: Set realistic daily limits based on expected workload
4. **Monitoring**: Track agent activity for anomalous behavior

## Future Enhancements

- Reputation scoring based on verified proofs
- Staking mechanism (agents lock ETH as collateral)
- Slashing for malicious anchors
- Multi-admin governance
- Time-based access (agent active only during certain hours)

---

**Optional Component**: This contract is not required for basic PoEC v2 operation but provides enterprise features for production deployments with multiple agents.
