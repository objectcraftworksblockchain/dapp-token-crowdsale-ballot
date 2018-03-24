import React, { Component } from 'react'
import OrgTokenContract from '../build/contracts/OrgToken.json'
import OrgTokenCrowdsaleContract from '../build/contracts/OrgTokenCrowdsale.json'
import OrgBallotContract from '../build/contracts/OrgBallot.json'
import TimedOrgBallotContract from '../build/contracts/TimedOrgBallot.json'
import 'babel-polyfill';
import getWeb3 from './utils/getWeb3'
import Select from 'react-select';


import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import 'react-select/dist/react-select.css';
import './App.css'

import { Table, Panel } from 'react-bootstrap'


class ProposalVoting extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      votes: '', proposal: props.proposal,
      account: props.accounts[1],
      votesReceivedByProposal: null,
      voteTransactionObject:[]
    };

    this.orgBallotInstance = props.orgBallotInstance;
    this.accounts = props.accounts;
    this.web3 = props.web3;
    this.votesChanged = this.votesChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAccountChange = this.handleAccountChange.bind(this);
    this.inputStyle = { "marginTop": "2px" };
    var self = this;
    this.orgBallotInstance.votesReceivedByProposals.call(this.state.proposal).then(function(balance){
      self.setState({votesReceivedByProposal: balance.c[0]  })
  });
  }


  votesChanged(event) {
    this.setState({ votes: event.target.value });
  }

  handleAccountChange(evt) {
    this.setState({ account: evt.target.value });
  }
  handleSubmit(event) {

    event.preventDefault();
    var self = this;

    this.orgBallotInstance.vote(self.web3.fromAscii(self.state.proposal),
      self.web3.toBigNumber(self.state.votes).toNumber(),
      { from: this.state.account, gas: 8500000 })
      .then(async function (result) {

        if(self.state.voteTransactionObject.length < 1)
          self.setState({voteTransactionObject:[result]})
          else {
           var  voteTransactionObject = self.state.voteTransactionObject.slice()
           voteTransactionObject.unshift(result);
          self.setState({voteTransactionObject: voteTransactionObject });
          }
       
        console.log(result);
        var votesReceived = await self.orgBallotInstance
          .votesReceivedByProposals.call(self.web3.fromAscii(self.state.proposal));
        console.log(votesReceived);
        self.setState({
          votes: 0,
          votesReceivedByProposal: votesReceived.c[0]
        })
      });



  }


  render() {
    var transactionFeeDisplay =(<div/>);
    var gasPrice = this.web3.eth.gasPrice;
    var lastTransaction =this.state.voteTransactionObject[0];
   
    if(!!lastTransaction){
      var transactionFee =  lastTransaction.receipt.gasUsed * gasPrice ;
      transactionFeeDisplay = (<div><small>Transaction Fee(Gas cost): {this.web3.fromWei(transactionFee,'ether')} ether. 
       ${(this.web3.fromWei(transactionFee,'ether')*531).toFixed(2)} at 1eth=$530</small>
     </div> )   
   }
    return (

      <div className="list-group-item">
        <form className="form-inline" onSubmit={this.handleSubmit}>
          <div className="form-group">
            <div className="input-group">
              <span className="input-group-addon">{this.state.proposal}&nbsp;
                <span className="badge">{this.state.votesReceivedByProposal}</span></span>
              <span className="input-group-addon">
                <select className="" value={this.state.account}
                  onChange={this.handleAccountChange}>
                  <option value={this.accounts[1]}>Account 1</option>
                  <option value={this.accounts[2]}>Account 2</option>
                </select>
              </span>
              <input type="number" value={this.state.votes} 
                     onChange={this.votesChanged} 
                     style={this.inputStyle} className="form-control input-group-addon"
              />
              <span className="input-group-btn">
                <button type="submit" value="submit" className="btn btn-default">Vote</button>
              </span>
            </div>
          </div>
        </form>
        <div>{transactionFeeDisplay}</div>
      </div>
    );
  }
}

function Proposals(props) {


  if (!props.proposals)
    return <p />;
  const converterfix = function (input) { return props.converter(input).replace(/\u0000/g, '') }

  const listItems = props.proposals.map((p, index) => {
    var proposalAscii = converterfix(p);

    return (<ProposalVoting key={index} accounts={props.accounts}
      account={props.accounts[index]}
      orgBallotInstance={props.orgBallotInstance} web3={props.web3}
      votesReceivedByProposal={props.votesReceivedByProposals[proposalAscii]} proposal={proposalAscii} />);
  }
  );
  return (
    <div className="list-group">{listItems}</div>
  );
}
function TokenEvents(props) {
  var rows = (<tr></tr>);
  if (!!props.events && !!props.events.map) {
    rows = props.events.map((evt, index) => {
      return (<tr key={evt.blockNumber}><td>{evt.blockNumber}</td><td>{"Account " +
        props.accounts.findIndex(function (a) { return a === evt.args.to })}</td>
        <td>{evt.args.value.toString()}</td></tr>);
    });
  }
  return (
    <Panel>
      <Panel.Heading>Transfer Events</Panel.Heading>
      <Table striped bordered condensed responsive>
        <tbody><tr><th>Block#</th><th>Account</th><th>Tokens</th></tr>
          {rows}
        </tbody>
      </Table>
    </Panel>
  );

}

function VotesCastedEvents(props) {
  //debugger;
  const events = props.events;

  var rows = (<tr></tr>);
  if (!!events && !!events.map) {
    const converterfix = function (input) { return props.converter(input).replace(/\u0000/g, '') }

    rows = events.map((evt, index) =>
      <tr key={evt.blockNumber}><td>{evt.blockNumber}</td>
        <td>{converterfix(evt.args.proposal)}</td><td>{evt.args.votes.toString()}</td></tr>
    );
  }

  return (
    <Panel>
      <Panel.Heading>VotesCasted Events</Panel.Heading>
      <Table striped bordered condensed responsive>
        <tbody><tr><th>Block#</th><th>Proposal</th><th>Votes</th></tr>
          {rows}
        </tbody>
      </Table>
    </Panel>

  );

}
function EthereumAddresses(props) {
  if (props.accounts == null) {
    return (<p> web3 provider not found</p>);
  }

  const addresses = props.accounts;
  const listItems = addresses.map((address, index) => {
    var obj = {};
    obj.label = "Account " + index + "-" + address;
    obj.value = address;
    return obj;
  }
  );
  return (
    <div><Select
      name="wallet"
      value={props.value}
      onChange={props.handleChange}
      options={listItems} />
      <p>Account Balance: {props.accountBalance} ether </p>
    </div>);
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      tokenBalance: 0,
      remainingTokens: -1,
      web3: null,
      accounts: null,
      selectedAccount:null,
      selectedAccountBalance: 0,
      transferEvents: [],
      votesCastedEvents: [],
      buyTokenTransactionLog:[]
    };

    this.buyTokens = this.buyTokens.bind(this);
    this.accountSelected = this.accountSelected.bind(this);
  }

  buyTokens(accountNo) {
    var self = this;
    //  this.transfer.stopWatching();
    console.log("account 1: " + this.state.accounts[accountNo]);
    this.orgTokenCrowdsaleInstance.buyTokens(
      this.state.accounts[accountNo],
      {
        from: this.state.accounts[accountNo],
        value: this.state.web3.toWei(10, 'wei'), gas: 8500000
      }
    ).then(async function (result) {
      
     
        if(self.state.buyTokenTransactionLog.length < 1)
          self.setState({buyTokenTransactionLog:[result]})
          else {
           var  buyTokenTransactionLog = self.state.buyTokenTransactionLog.slice()
           buyTokenTransactionLog.unshift(result);
          self.setState({buyTokenTransactionLog: buyTokenTransactionLog });
          }

      var tokenBalance = await self.orgTokenInstance.balanceOf(self.state.accounts[0]);
      var token2Balance = await self.orgTokenInstance.balanceOf(self.state.accounts[1]);
      var token3Balance = await self.orgTokenInstance.balanceOf(self.state.accounts[2]);
      var remainingTokens = await self.orgTokenCrowdsaleInstance.remainingTokens();

      var accountBalance =await self.state.web3.eth.getBalance(self.state.selectedAccount.value);
      self.setState({
        selectedAccountBalance: self.state.web3.fromWei(accountBalance, 'ether').toString(),
        token2Balance: token2Balance.c[0], token3Balance: token3Balance.c[0],
        tokenBalance: tokenBalance.c[0], remainingTokens: remainingTokens.c[0]
      });
    });

  }

  accountSelected(account) {
    if(account==null)
    return;
    console.log(account);
     var balance =this.state.web3.eth.getBalance(account.value);
     
    console.log("balance" + balance.toNumber());
    this.setState({
      selectedAccount: account, selectedAccountBalance:
        this.state.web3.fromWei(balance, 'ether').toString()
   
    });

  }


  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3,
          accounts: results.web3.eth.accounts,
          asciiconverter: results.web3.toAscii,

        })
        // Instantiate contract once web3 provided.
        this.instantiateContracts()
      })
      .catch((e) => {
        console.log('Error finding web3.' + e)
      })
  }

  instantiateContracts() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */


    const contract = require('truffle-contract')

    const orgTokenContract = contract(OrgTokenContract)
    orgTokenContract.setProvider(this.state.web3.currentProvider)

    const orgTokenCrowdsaleContract = contract(OrgTokenCrowdsaleContract)
    orgTokenCrowdsaleContract.setProvider(this.state.web3.currentProvider)

    const orgBallot = contract(OrgBallotContract)
    orgBallot.setProvider(this.state.web3.currentProvider);
    const timedOrgBallot = contract(TimedOrgBallotContract)
    timedOrgBallot.setProvider(this.state.web3.currentProvider);

    // Declaring this for later so we can chain functions on SimpleStorage.

    // Get accounts.
    this.state.web3.eth.getAccounts(async (error, accounts) => {
      this.orgBallotInstance = await orgBallot.deployed();
      this.orgTokenInstance = await orgTokenContract.deployed();
      this.orgTokenCrowdsaleInstance = await orgTokenCrowdsaleContract.deployed();
      this.setState({ orgTokenInstance: this.orgTokenInstance });
      this.setState({ orgTokenCrowdsaleInstance: this.orgTokenCrowdsaleInstance });
      this.setState({selectedAccount:{label:"Account 1-" + accounts[1],value:accounts[1]}});
      this.accountSelected(this.state.selectedAccount);
      var balance = await this.orgTokenInstance.balanceOf.call(this.state.web3.eth.accounts[0]);
      //var remainingTokens = await this.orgTokenCrowdsaleInstance.remainingTokens.call();
      var self = this;
      this.transfer = this.orgTokenInstance.Transfer();
      this.transfer.watch((err, response) => {
        var token = self.state.transferEvents;
        if(token==null)
         token =[response];
         else {
          token =token.slice();
          token.unshift(response) ;
         }
        self.setState({
          transferEvents: token
        });
      });

      this.votesCasted = this.orgBallotInstance.VotesCasted();
      this.votesCasted.watch((err, response) => {
        var ballot = self.state.votesCastedEvents;
        if(ballot==null)
          ballot =[response];
else{
         ballot=ballot.slice();
         ballot.unshift(response) ;

}
        self.setState({
          votesCastedEvents: ballot
        });
      });
      //  this.transfer.stopWatching();
      //this.votesCasted.stopWatching();
      var proposals = await this.orgBallotInstance.getAllProposals.call();
      var tokenBalance = await this.orgTokenInstance.balanceOf(this.state.accounts[0]);
      var token2Balance = await this.orgTokenInstance.balanceOf(this.state.accounts[1]);
      var token3Balance = await this.orgTokenInstance.balanceOf(this.state.accounts[2]);
      var remainingTokens = await this.orgTokenCrowdsaleInstance.remainingTokens();
      var votes = [];

      const converterfix = function (input) {
        return self.state.web3.toAscii(input)
          .replace(/\u0000/g, '')
      }

      for (var index = 0; index < proposals.length; index++) {
        var proposalAscii = converterfix(proposals[0]);
        votes[proposalAscii] = (await this.orgBallotInstance.votesReceivedByProposals
          .call(this.state.web3.fromAscii(proposalAscii))).c[0];
      }
      return this.setState({
        proposals: proposals, votes: votes,
        token2Balance: token2Balance.c[0], token3Balance: token3Balance.c[0],
        tokenBalance: tokenBalance.c[0], remainingTokens: remainingTokens.c[0]
      });
    });        // Update state with the result.
  }


  render() {
    const accounts = this.state.accounts;
    var transactionFeeDisplay =(<div/>);
    
    var lastTransaction =this.state.buyTokenTransactionLog[0];
   
    if(!!lastTransaction){
       var gasPrice = this.state.web3.eth.gasPrice;
   
      var transactionFee =  lastTransaction.receipt.gasUsed * gasPrice ;
    
      transactionFeeDisplay = (<div><small>Transaction Fee(Gas cost): {this.state.web3.fromWei(transactionFee,'ether')} ether.
        ${(this.state.web3.fromWei(transactionFee,'ether')*531).toFixed(2)} at 1eth=$530</small>
      
      </div>)
    }
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">Org</a>
        </nav>

        <main className="container">

          <div className="pure-g">
            <div className="pure-u-1-2 pure-u-md-1-3">
              <div className="l-box">
                <h2>Wallet</h2>
                <EthereumAddresses
                  accountBalance={this.state.selectedAccountBalance}
                  value={this.state.selectedAccount}
                  accounts={accounts} handleChange={this.accountSelected} />
              </div>
            </div>
            <div className="pure-u-1-2 pure-u-lg-1-3">
              <div className="l-box">
                <h2>CrowdSale<span className="small pull-right">Available Tokens:  {this.state.remainingTokens}</span></h2>

                <button onClick={(e) => this.buyTokens(1, e)}>Buy 100 tokens for Account1</button>
                &nbsp;
                <button onClick={(e) => this.buyTokens(2, e)}>Buy 100 tokens for Account2</button>

                <div>{transactionFeeDisplay}</div>
              </div>
            </div>
          </div>

          <div className="pure-u-1-1">
            <div className="pure-u-1-2 pure-u-md-1-2">
              <div className="l-box">
                <h2>OrgBallot</h2>
                <Proposals accounts={accounts}
                  votesReceivedByProposals={this.state.votes}
                  converter={this.state.asciiconverter}
                  orgBallotInstance={this.orgBallotInstance}
                  proposals={this.state.proposals}
                  web3={this.state.web3} />
                <VotesCastedEvents accounts={this.state.accounts}
                  converter={this.state.asciiconverter}
                  events={this.state.votesCastedEvents} />

              </div>
            </div>
            <div className="pure-u-1-2 pure-u-md-1-2">
              <div className="l-box">
                <h2>OrgToken</h2>
                <p>Token Wallet: {this.state.tokenBalance}</p>
                <p>Account 1: {this.state.token2Balance}</p>
                <p>Account 2: {this.state.token3Balance}</p>
                <TokenEvents accounts={this.state.accounts}
                  events={this.state.transferEvents} />

              </div>
            </div>



          </div>
        </main>
      </div>
    );
  }
}

export default App
