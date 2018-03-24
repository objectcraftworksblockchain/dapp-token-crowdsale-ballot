import ether from 'zeppelin-solidity/test/helpers/ether';
import EVMRevert from 'zeppelin-solidity/test/helpers/EVMRevert';

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var OrgToken = artifacts.require("./OrgToken.sol");
var OrgTokenCrowdsale = artifacts.require("./OrgTokenCrowdsale.sol");

contract('OrgTokenCrowdsale', function([_, investor, wallet, purchaser, tokenWallet]) {
  const RATE  = new BigNumber(10);
 
 beforeEach(async function () {

   this.token = await OrgToken.new({ from: tokenWallet }); //we are setting owner
   this.crowdsale = await OrgTokenCrowdsale.new(RATE, wallet, this.token.address, tokenWallet);
   var initialSupply= await this.token.INITIAL_SUPPLY();
   await this.token.approve(this.crowdsale.address, initialSupply, { from: tokenWallet });
  
  });

  it('should create OrgTokenCrowdsale with correct parameters', async function () {

    this.crowdsale.should.exist;
    this.token.should.exist;

    const crowdsaletoken = await this.crowdsale.token.call();
    const rate = await this.crowdsale.rate.call();
    const walletAddress = await this.crowdsale.wallet.call();
    const tokenWalletAddress = await this.crowdsale.tokenWallet.call();

    rate.should.be.bignumber.equal(RATE);
    walletAddress.should.be.equal(wallet);
    crowdsaletoken.should.be.equal(this.token.address);
    tokenWalletAddress.should.be.equal(tokenWallet);

  });
  
});
 
