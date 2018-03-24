pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";

import "./OrgToken.sol";

/**
 * @title OrgBallot
 * @dev OrgWeightedVoting is a contract for conduting a voting 
 * to elect officers to board, 
 * 
 */ 

contract OrgBallot {

    using SafeMath for uint256;

    OrgToken public token;

    bytes32[] public proposals;

    mapping (address => uint256 ) public votesCastByTokenHolders; 

    mapping (bytes32 => uint256 ) public votesReceivedByProposals;

    event VotesCasted(address indexed voter, bytes32 indexed proposal, uint256 votes);


    function OrgBallot(OrgToken _token, bytes32[] _proposals) public {
        token = _token;
        proposals = _proposals;
    } 
   
    function vote(bytes32 proposal, uint256 tokenWeightedVotes) public {

        _validateVote(proposal,tokenWeightedVotes);
        
        require(tokenWeightedVotes > 0);
  
        require(isProposalKnown(proposal) == true);

        uint256 totalWeight = token.balanceOf(msg.sender);
        require(totalWeight > 0);

        uint256 votesCast = votesCastByTokenHolders[msg.sender];
        uint256 availableVotes = totalWeight.sub(votesCast);
   
        require(availableVotes >= tokenWeightedVotes);


        votesCastByTokenHolders[msg.sender] = votesCast.add(tokenWeightedVotes);
        votesReceivedByProposals[proposal] = votesReceivedByProposals[proposal].add(tokenWeightedVotes);
       
        VotesCasted(msg.sender, proposal, tokenWeightedVotes);
    }
    //Override    
    function _validateVote(bytes32 proposal, uint256 tokenWeightedVotes) internal {
    
    }

    function getAllProposals() public view returns(bytes32[]){
        return proposals;
    }

    function isProposalKnown(bytes32 proposal) private view returns(bool) {
        for(uint256 index = 0; index < proposals.length; index++){
            if(proposals[index] == proposal){
                return true;
            }
        }
        return false;
    }    
}