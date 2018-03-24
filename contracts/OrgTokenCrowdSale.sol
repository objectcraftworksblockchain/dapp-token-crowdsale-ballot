pragma solidity ^0.4.18;

import "./OrgToken.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";

/**
 * @title OrgTokenCrowdsale
 * @dev OrgTokenCrowdsale is a  contract for managing OrgToken crowdsale,
 * allowing investors to purchase tokens with ether. 
 * It inherits from Crowdsale contract from Zeppelin.
 */

contract OrgTokenCrowdsale  is AllowanceCrowdsale {

    function OrgTokenCrowdsale (
      uint256 _rate,
      address _wallet, 
      OrgToken _token,
      address _tokenWallet
    )
      public
      Crowdsale(_rate,_wallet ,_token)
      AllowanceCrowdsale(_tokenWallet)
    {
 
    } 
} 