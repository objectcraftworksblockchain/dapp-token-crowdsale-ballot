pragma solidity ^0.4.18;


import "zeppelin-solidity/contracts/math/SafeMath.sol";

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract OrgToken is StandardToken {
  using SafeMath for uint256;

  string public constant name = 'OrgToken';
  string public constant symbol = 'ORG';
  uint8 public constant decimals = 18;
  
  uint256 public constant INITIAL_SUPPLY =  uint256(12000) * (uint256(10)  ** uint256(decimals));

  function OrgToken() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    Transfer(0x0,msg.sender,INITIAL_SUPPLY);
  }

}