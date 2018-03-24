pragma solidity ^0.4.18;

import "./OrgBallot.sol";

/**
 * @title TimedOrgBallot
 * @dev TimedOrgBallot is a contract for conduting a voting within a schedule
 * 
 * 
 */ 

contract TimedOrgBallot is OrgBallot  {

    uint256 public openingTime;
    uint256 public closingTime;

    modifier votingOpen {
        require(now >= openingTime && now <= closingTime);
        _;
    }
    
    function TimedOrgBallot(
        OrgToken _token,
        bytes32[] _proposals,
        uint256 _openingTime,
        uint256 _closingTime
    ) 
        public 
        OrgBallot(_token,_proposals)
    {
        openingTime = _openingTime;
        closingTime = _closingTime;
    } 
   
    function hasClosed() public view returns (bool) {
        return now > closingTime;
    }

    function _validateVote(bytes32 proposal, uint256 tokenWeightedVotes) internal votingOpen {
        super._validateVote(proposal, tokenWeightedVotes); 
    }
}