var OrgToken = artifacts.require("./OrgToken.sol");
var OrgCrowdsale = artifacts.require("./OrgTokenCrowdsale.sol");
var OrgBallot = artifacts.require("./OrgBallot.sol");
var TimedOrgBallot =artifacts.require("./TimedOrgBallot.sol");
var SafeMath = artifacts.require("./SafeMath.sol");

module.exports = function(deployer,network, accounts) {

  const openingTime = Date.now()/1000|0 + 120;
  const closingTime = openingTime + (3600 * 24 * 7); // week
  const tokenRate = new web3.BigNumber(10);
  const wallet = accounts[0];
  const tokenWallet = accounts[0];
  const from = accounts[0];
  const proposals = ["HQ in Atlanta","HQ in DC","HQ in LA"];
  let orgTokenAddress

  deployer.deploy(SafeMath);
  deployer.link(SafeMath, [OrgToken,OrgCrowdsale,OrgBallot,TimedOrgBallot]);

  deployer.deploy(OrgToken, {from: from})
    .then(async function() {
    var orgTokenInstance = await OrgToken.deployed();
    orgTokenAddress =orgTokenInstance.address;
    console.log("token address" +orgTokenInstance);
    return deployer.deploy(OrgCrowdsale,tokenRate,wallet, 
                          orgTokenAddress,tokenWallet, {from:accounts[0]});
  }).then(async function(){
     var instance = await  OrgCrowdsale.deployed();
        var orgTokenInstance = await OrgToken.deployed();
  
    
     var initialSupply = await orgTokenInstance.totalSupply.call();
      return orgTokenInstance.approve(instance.address, initialSupply,{from:from});
  }).then(async function(){
    var orgTokenInstance = await OrgToken.deployed();
  
  
  return  deployer.deploy(OrgBallot,orgTokenInstance.address,proposals,{from:from});
  }).then(async function(){
    var orgTokenInstance = await OrgToken.deployed();
  
    return deployer.deploy(TimedOrgBallot, orgTokenInstance.address,proposals, openingTime, closingTime, {from:from});
 
  });
}
