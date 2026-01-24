// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PoECRegistry {
    struct AnalysisRecord {
        bytes32 dataHash;      // SHA-256 of raw CSV
        bytes32 modelHash;     // SHA-256 of GNN model weights
        bytes32 resultHash;    // SHA-256 of anomaly report
        uint256 timestamp;
        string ipfsCid;        // IPFS link to full report
    }

    // Mapping from resultHash to Record
    mapping(bytes32 => AnalysisRecord) public records;
    
    event RecordAnchored(bytes32 indexed resultHash, uint256 timestamp);

    function anchorAnalysis(
        bytes32 _dataHash,
        bytes32 _modelHash,
        bytes32 _resultHash,
        string memory _ipfsCid
    ) public {
        require(records[_resultHash].timestamp == 0, "Record already exists");
        
        records[_resultHash] = AnalysisRecord({
            dataHash: _dataHash,
            modelHash: _modelHash,
            resultHash: _resultHash,
            timestamp: block.timestamp,
            ipfsCid: _ipfsCid
        });
        
        emit RecordAnchored(_resultHash, block.timestamp);
    }

    function verifyRecord(bytes32 _resultHash) public view returns (bool, uint256, string memory) {
        if (records[_resultHash].timestamp == 0) {
            return (false, 0, "");
        }
        return (true, records[_resultHash].timestamp, records[_resultHash].ipfsCid);
    }
    
    // Detailed verification: Check if stored dataHash and modelHash match provided ones
    function verifyIntegrity(
        bytes32 _dataHash, 
        bytes32 _modelHash, 
        bytes32 _resultHash
    ) public view returns (bool) {
        AnalysisRecord memory r = records[_resultHash];
        if (r.timestamp == 0) return false;
        
        return (r.dataHash == _dataHash && r.modelHash == _modelHash);
    }
}
