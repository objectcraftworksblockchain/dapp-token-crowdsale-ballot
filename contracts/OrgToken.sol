pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract OrgToken is StandardToken {
  string public name = 'OrgToken';
  string public symbol = 'OrgT';
  uint8 public decimals = 2;
  uint public INITIAL_SUPPLY = 12000;

  function OrgToken() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    Transfer(0x0,msg.sender,INITIAL_SUPPLY);
  }

}