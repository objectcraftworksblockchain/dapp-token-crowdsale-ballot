
var OrgToken = artifacts.require("./OrgToken.sol");
contract('OrgToken', function([owner,anotherAccount]) {
 let initialSupply 
 let orgToken 
 beforeEach(async function(){
    orgToken = await OrgToken.new();
    initialSupply = (await orgToken.INITIAL_SUPPLY()).toNumber();
 });

 it("should assign the token supply to the contract owner",async  function() {
    var balance = await  orgToken.balanceOf(owner);
      assert.equal(balance, initialSupply,  "owner is assigned entire initial supply");
   });

  it("should log Transfer event of transferring initial supply to the owner", function(done){
      var transferEvent = orgToken.Transfer({}, {fromBlock:0,toBlock:'latest'});
      //can promisefy 
      transferEvent.get(function(error ,result){
        if(error){
          done(error);
        }

        assert.isTrue(result.length==1,"Transfer event is not fired");
        assert.equal(result[0].args.from,0x0);
        assert.equal(result[0].args.to,owner);
        assert.equal(result[0].args.value, initialSupply);
        done();
     });
   });
});
 
