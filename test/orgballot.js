import ether from 'zeppelin-solidity/test/helpers/ether';
import EVMRevert from 'zeppelin-solidity/test/helpers/EVMRevert';
import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const BigNumber = web3.BigNumber;
// create an interface that returns the tokens balance from the org 
// It doesn't need ERC20 interface?
// 
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var OrgToken = artifacts.require("./OrgToken.sol");
var OrgBallot = artifacts.require("./OrgBallot.sol");

contract('OrgBallot', function([_,  tokenWallet, tokenHolder1, tokenHolder2, outsider]) {
  const holder1Tokens = new BigNumber(400);
  const holder2Tokens = new BigNumber(200);
  const proposals = [web3.fromAscii("HQ in Atlanta"),
                     web3.fromAscii("HQ in DC"),
                     web3.fromAscii("HQ in LA")];
  
  beforeEach(async function () {
   
   web3.toAsciiOriginal = web3.toAscii;
   web3.toAscii = function (input) { return web3.toAsciiOriginal(input).replace(/\u0000/g, '') }
   
   this.token = await OrgToken.new({ from: tokenWallet }); //we are setting owner
   this.orgBallot = await OrgBallot.new(this.token.address,proposals) ;
   var initialSupply= await this.token.INITIAL_SUPPLY();

   await this.token.transfer(tokenHolder1, holder1Tokens.toNumber(), { from: tokenWallet });
   await this.token.transfer(tokenHolder2, holder2Tokens.toNumber(), { from: tokenWallet });

  });
  afterEach(function(){

   web3.toAscii = web3.toAsciiOriginal;
  });

  it('should create OrgBallot with correct parameters', async function () {
 
    this.orgBallot.should.exist;
    this.token.should.exist;

    const tokenFromOrgBallot = await this.orgBallot.token.call();
    const proposal1 = await this.orgBallot.proposals.call(0);

    tokenFromOrgBallot.should.be.equal(this.token.address);
    web3.toAscii(proposal1).toString().should.be.equal(web3.toAscii(proposals[0]));

  });
  
  describe('voting', function(){

    it("should reject voting unknown proposal", async function(){
        await this.orgBallot.vote(web3.fromAscii("hello"),new BigNumber(10),{from: tokenHolder1}).should.be.rejectedWith(EVMRevert);
    });
    
    it("should reject voting by outsider who doesn't hold any tokens", async function(){
        await this.orgBallot.vote(proposals[0],new BigNumber(10),{from: outsider}).should.be.rejectedWith(EVMRevert);
    });
  
    it("should reject voting with zero votes", async function(){
        await this.orgBallot.vote(proposals[0], new BigNumber(0),{from: tokenHolder1}).should.be.rejectedWith(EVMRevert);
    })
    //Log events
    it("should accept voting with votes", async function(){
        await this.orgBallot.vote(proposals[0], new BigNumber(10),{from: tokenHolder1});
        (await this.orgBallot.votesReceivedByProposals.call(proposals[0])).should.be.bignumber.equal(new BigNumber(10));
        (await this.orgBallot.votesCastByTokenHolders.call(tokenHolder1)).should.be.bignumber.equal(new BigNumber(10));

    });
    it("should emits VotesCasted event", async function(){
        let votesCasted = new BigNumber(10);
        const { logs } = await this.orgBallot.vote(proposals[0], votesCasted ,{from: tokenHolder1});
      
        logs.length.should.be.equal(1);
        logs[0].event.should.be.equal("VotesCasted");
        logs[0].args.voter.should.be.equal(tokenHolder1);
        web3.toAscii(logs[0].args.proposal).should.be.equal(web3.toAscii(proposals[0]));
        logs[0].args.votes.should.be.bignumber.equal(votesCasted);
      });
    describe('multiple voters/proposals', function(){
        const token1HolderVotesCasted = new BigNumber(10);
        const token2HolderVotesCasted = new BigNumber(20);

        beforeEach(async function(){
           await this.orgBallot.vote(proposals[0], token1HolderVotesCasted,{from: tokenHolder1});

        });

        it("should accept voting from second voter", async function(){
           await this.orgBallot.vote(proposals[0], token2HolderVotesCasted,{from: tokenHolder2});
           (await this.orgBallot.votesReceivedByProposals.call(proposals[0])).should.be.bignumber.equal(token1HolderVotesCasted.add(token2HolderVotesCasted));
           (await this.orgBallot.votesCastByTokenHolders.call(tokenHolder2)).should.be.bignumber.equal(token2HolderVotesCasted);
        })
           
        it("should accept voting on multiple proposal", async function(){
           await this.orgBallot.vote(proposals[1], token1HolderVotesCasted,{from: tokenHolder1});
           (await this.orgBallot.votesReceivedByProposals.call(proposals[1])).should.be.bignumber.equal(token1HolderVotesCasted);
           (await this.orgBallot.votesCastByTokenHolders.call(tokenHolder1)).should.be.bignumber.equal(token1HolderVotesCasted.add(token1HolderVotesCasted));
        })
    });


    it("should reject voting with votes exceeding holdings", async function(){
        await this.orgBallot.vote(proposals[0],holder1Tokens.add(1),{from: tokenHolder1}).should.be.rejectedWith(EVMRevert);
    })
  });
});
 
