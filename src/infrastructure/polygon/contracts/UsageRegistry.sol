// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UsageRegistry {
    event UsageRecorded(
        bytes32 indexed usageId,
        bytes32 indexed businessId,
        uint256 co2,
        uint256 timestamp
    );

    function recordUsage(
        bytes32 usageId,
        bytes32 businessId,
        uint256 co2
    ) external {
        emit UsageRecorded(
            usageId,
            businessId,
            co2,
            block.timestamp
        );
    }
}
