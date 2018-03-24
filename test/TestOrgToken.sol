pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/OrgToken.sol";

contract TestOrgToken {
  function testInitialSupply() public {

    OrgToken orgToken = OrgToken(DeployedAddresses.OrgToken());
    Assert.equal(orgToken.balanceOf(msg.sender),orgToken.INITIAL_SUPPLY(),"initial supply");
  
  }
}
