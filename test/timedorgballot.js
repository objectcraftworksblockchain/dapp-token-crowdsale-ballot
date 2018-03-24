import ether from 'zeppelin-solidity/test/helpers/ether';
import EVMRevert from 'zeppelin-solidity/test/helpers/EVMRevert';
import { advanceBlock } from 'zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'zeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';

const BigNumber = web3.BigNumber;
// create an interface that returns the tokens balance from the org 
// It doesn't need ERC20 interface?
// 
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var OrgToken = artifacts.require("./OrgToken.sol");
var TimedOrgBallot = artifacts.require("./TimedOrgBallot.sol");

contract('TimedOrgBallot', function([_,  tokenWallet, tokenHolder1, tokenHolder2, outsider]) {
  const holder1Tokens = new BigNumber(400);
  const holder2Tokens = new BigNumber(200);
  const proposals = [web3.fromAscii("HQ in Atlanta"),
                     web3.fromAscii("HQ in DC"),
                     web3.fromAscii("HQ in LA")];
  
   before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
     await advanceBlock();
     web3.toAsciiOriginal = web3.toAscii;
     web3.toAscii = function (input) { return web3.toAsciiOriginal(input).replace(/\u0000/g, '') }
   });

   after(function(){
     web3.toAscii = web3.toAsciiOriginal;
   });
 
   beforeEach(async function () {
   
   this.openingTime = latestTime() + duration.weeks(1);
   this.closingTime = this.openingTime + duration.weeks(1);
   this.afterClosingTime = this.closingTime + duration.seconds(1);
 

   this.token = await OrgToken.new({ from: tokenWallet }); //we are setting owner
   this.orgBallot = await TimedOrgBallot.new(this.token.address,proposals,
                                                     this.openingTime,this.closingTime) ;
   var initialSupply= await this.token.INITIAL_SUPPLY();

   await this.token.transfer(tokenHolder1, holder1Tokens.toNumber(), { from: tokenWallet });
   await this.token.transfer(tokenHolder2, holder2Tokens.toNumber(), { from: tokenWallet });

  });

  it('should be ended only after end', async function () {
    let ended = await this.orgBallot.hasClosed.call();
    ended.should.equal(false);
    await increaseTimeTo(this.afterClosingTime);
    ended = await this.orgBallot.hasClosed.call();
    ended.should.equal(true);
  });

  describe('accepting voting', function () {
    it('should reject voting before start', async function () {
        await this.orgBallot.vote(proposals[0],new BigNumber(10),{from: tokenHolder1}).should.be.rejectedWith(EVMRevert);
  
    });

    it('should accept payments after start', async function () {
        await increaseTimeTo(this.openingTime);
        await this.orgBallot.vote(proposals[0], new BigNumber(10),{from: tokenHolder1});
        (await this.orgBallot.votesReceivedByProposals.call(proposals[0])).should.be.bignumber.equal(new BigNumber(10));
        (await this.orgBallot.votesCastByTokenHolders.call(tokenHolder1)).should.be.bignumber.equal(new BigNumber(10));
    });

    it('should reject payments after end', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.orgBallot.vote(proposals[0],new BigNumber(10),{from: tokenHolder1}).should.be.rejectedWith(EVMRevert);
    });
  });
  
});
 
