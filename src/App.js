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
import './css/pure-grids-responsiveness-min.css'
import 'react-select/dist/react-select.css';
import './App.css'

import { Table, Panel } from 'react-bootstrap'


class ProposalVoting extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      votesReceivedByProposal: null,
      voteTransactionObject: [],
      tokenDecimalMultiplier: 10 ** 18,
      votes:''
    };
     
    this.orgBallotInstance = props.orgBallotInstance;
    this.accounts = props.accounts;
    this.web3 = props.web3;
    this.votesChanged = this.votesChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAccountChange = this.handleAccountChange.bind(this);
    this.inputStyle = { "marginTop": "2px" };
    var self = this;
    this.orgBallotInstance.votesReceivedByProposals.call(this.props.proposal)
    .then(function (balance) {
      self.setState({ 
        votesReceivedByProposal: balance.dividedBy(self.state.tokenDecimalMultiplier)
        .toFormat(0) })
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

    this.orgBallotInstance.vote(self.web3.fromAscii(self.props.proposal),
      self.web3.toBigNumber(self.state.votes).mul(10 ** 18),
      { from: self.props.account.value, gas: 8500000 })
      .then(async function (result) {

        if (self.state.voteTransactionObject.length < 1)
          self.setState({ voteTransactionObject: [result] })
        else {
          var voteTransactionObject = self.state.voteTransactionObject.slice()
          voteTransactionObject.unshift(result);
          self.setState({ voteTransactionObject: voteTransactionObject });
        }

        console.log(result);
        var votesReceived = await self.orgBallotInstance
          .votesReceivedByProposals.call(self.web3.fromAscii(self.props.proposal));
        console.log(votesReceived);
        self.setState({
          votes: '',
          votesReceivedByProposal: votesReceived.dividedBy(self.state.tokenDecimalMultiplier).toFormat(2)
        })
      });



  }


  render() {
    var transactionFeeDisplay = (<div />);
    var gasPrice = this.web3.eth.gasPrice;
    var lastTransaction = this.state.voteTransactionObject[0];

    if (!!lastTransaction) {
      var transactionFee = lastTransaction.receipt.gasUsed * gasPrice;
      transactionFeeDisplay = (<div><small>Transaction Fee(Gas cost): {this.web3.fromWei(transactionFee, 'ether')} ether.
       ${(this.web3.fromWei(transactionFee, 'ether') * 531).toFixed(2)} at 1eth=$530</small>
      </div>)
    }
    return (
      <div className="list-group-item">
        <div className="list-group-item-heading">
          <span className="badge pull-right">
            <small>Votes: {this.state.votesReceivedByProposal} </small></span>
        </div>
        <form className="form-inline proposal" onSubmit={this.handleSubmit}>
        
          <div className="form-group">
            <label className="control-label proposal-label">{this.props.proposal}</label>

            <input type="number" value={this.state.votes}
              onChange={this.votesChanged}
              placeholder="tokens"
              className="form-control input-sm votes" />
          </div>
          <button type="submit" value="submit" className="btn  btn-default btn-sm">Vote</button>
        </form>
        <div>{transactionFeeDisplay}</div>

      </div>
    );
  }
}

function Proposals(props) {
  console.log("props.proposals: " + props.data);
  if (!props.data)
    return <p />;

  const converterfix = function (input) {
    return props.converter(input).replace(/\u0000/g, '')
  }
    var listItems = props.data.map((p, index) => {
      var proposalAscii = converterfix(p);

      return (<ProposalVoting key={index} accounts={props.accounts}
        account={props.selectedAccount}
        orgBallotInstance={props.orgBallotInstance} web3={props.web3}
        proposal={proposalAscii} />);
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
          <tbody><tr><th>Block#</th><th>Account</th><th>Tokens(10**18)</th></tr>
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
          <tbody><tr><th>Block#</th><th>Proposal</th><th>Votes(10**18)</th></tr>
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
        selectedAccount: null,
        selectedAccountBalance: 0,
        transferEvents: [],
        votesCastedEvents: [],
        buyTokenTransactionLog: [],
        tokenDecimalMultiplier: 10 ** 18,
        ballotProposals: null
      };

      this.buyTokens = this.buyTokens.bind(this);
      this.accountSelected = this.accountSelected.bind(this);

    }

    buyTokens() {
      var self = this;
      //  this.transfer.stopWatching();
      this.orgTokenCrowdsaleInstance.buyTokens(
        this.state.selectedAccount.value,
        {
          from: this.state.selectedAccount.value,
          value: this.state.web3.toWei(0.01, 'ether'), gas: 8500000
        }
      ).then(async function (result) {


        if (self.state.buyTokenTransactionLog.length < 1)
          self.setState({ buyTokenTransactionLog: [result] })
        else {
          var buyTokenTransactionLog = self.state.buyTokenTransactionLog.slice()
          buyTokenTransactionLog.unshift(result);
          self.setState({ buyTokenTransactionLog: buyTokenTransactionLog });
        }

        var crowdSaleWallet = await self.orgTokenCrowdsaleInstance.wallet.call();

        var selectedAccountTokensBalance = await self.orgTokenInstance.balanceOf.call(self.state.selectedAccount.value);
        var remainingTokens = await self.orgTokenCrowdsaleInstance.remainingTokens.call();

        var accountBalance = await self.state.web3.eth.getBalance(self.state.selectedAccount.value);
        var crowdSaleWalletBalance = await self.state.web3.eth.getBalance(crowdSaleWallet);


        self.setState({
          crowdSaleWalletBalance: self.state.web3.fromWei(crowdSaleWalletBalance, 'ether').toString(),
          remainingTokens: remainingTokens.dividedBy(self.state.tokenDecimalMultiplier).toFormat(0),

          selectedAccountTokensBalance: selectedAccountTokensBalance.dividedBy(self.state.tokenDecimalMultiplier).toFormat(0),
          selectedAccountBalance: self.state.web3.fromWei(accountBalance, 'ether').toString()

        });
      });

    }

    async accountSelected(account) {
      if (account == null)
        return;

      var balance = await this.state.web3.eth.getBalance(account.value);
      var selectedAccountTokensBalance = await this.orgTokenInstance.balanceOf.call(account.value);

      this.setState({
        selectedAccount: account,
        selectedAccountBalance: this.state.web3.fromWei(balance, 'ether').toString(),
        selectedAccountTokensBalance: selectedAccountTokensBalance.dividedBy(this.state.tokenDecimalMultiplier).toFormat(0),


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
        var self = this;

        self.tokenSymbol = await this.orgTokenInstance.symbol.call();
        self.tokenDecimals = await this.orgTokenInstance.decimals.call();



        this.transfer = this.orgTokenInstance.Transfer();
        this.transfer.watch((err, response) => {
          var token = self.state.transferEvents;
          if (token == null)
            token = [response];
          else {
            token = token.slice();
            token.unshift(response);
          }
          self.setState({
            transferEvents: token
          });
        });

        this.votesCasted = this.orgBallotInstance.VotesCasted();
        this.votesCasted.watch((err, response) => {
          var ballot = self.state.votesCastedEvents;
          if (ballot == null)
            ballot = [response];
          else {
            ballot = ballot.slice();
            ballot.unshift(response);

          }
          self.setState({
            votesCastedEvents: ballot
          });
        });

        var proposals = await this.orgBallotInstance.getAllProposals.call();
        var crowdSaleWallet = await self.orgTokenCrowdsaleInstance.wallet.call();
        self.tokenRate = (await self.orgTokenCrowdsaleInstance.rate.call()).toString();

        var selectedAccountTokensBalance = await self.orgTokenInstance.balanceOf.call(accounts[0]);
        var remainingTokens = await self.orgTokenCrowdsaleInstance.remainingTokens.call();

        var accountBalance = await self.state.web3.eth.getBalance(accounts[0]);
        var crowdSaleWalletBalance = await self.state.web3.eth.getBalance(crowdSaleWallet);

        console.log("proposals at init " + proposals);


        this.setState({
          orgTokenInstance: this.orgTokenInstance,
          orgTokenCrowdsaleInstance: this.orgTokenCrowdsaleInstance,
          selectedAccount: { label: "Account 0-" + accounts[0], value: accounts[0] },
          ballotProposals: proposals,
          crowdSaleWalletBalance: self.state.web3.fromWei(crowdSaleWalletBalance, 'ether').toString(),
          remainingTokens: remainingTokens.dividedBy(self.state.tokenDecimalMultiplier).toFormat(0),
          selectedAccountTokensBalance: selectedAccountTokensBalance.dividedBy(self.state.tokenDecimalMultiplier).toFormat(0),
          selectedAccountBalance: self.state.web3.fromWei(accountBalance, 'ether').toString(),
        });

        //  this.accountSelected(this.state.selectedAccount);

      });        // Update state with the result.
    }


    render() {
      const accounts = this.state.accounts;
      var transactionFeeDisplay = (<div />);

      var lastTransaction = this.state.buyTokenTransactionLog[0];

      if (!!lastTransaction) {
        var gasPrice = this.state.web3.eth.gasPrice;

        var transactionFee = lastTransaction.receipt.gasUsed * gasPrice;

        transactionFeeDisplay = (<div><small>Transaction Fee(Gas cost): {this.state.web3.fromWei(transactionFee, 'ether')} ether.
        ${(this.state.web3.fromWei(transactionFee, 'ether') * 531).toFixed(2)} at 1eth=$530</small>

        </div>)
      }
      return (
        <div className="App">
          <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" target="_blank" className="pure-menu-heading pure-menu-link">Org</a>
            <a href="https://github.com/objectcraftworks/dapp-token-crowdsale-ballot.git"
              className="btn btn-success  pull-right github">GitHub</a>

          </nav>

          <main className="container">
            <div className="row">

              <div className="col-sm-12">
                <p>
                  This dapp implements the org pattern that goes to crowdsale and offers token holder voting.
                  It connects to three contracts  token, crowdsale and token holder voting which are deployed on the test network Ropsten.
                  Token and Crowdsale contracts are using Zeppelin contracts.
                   TDD tests explore ethereum and solidity contract development concepts through the web3 api.</p>

                <p>
                  To see in action, you need to have MetaMask or a local running client connected to the test network Ropsten.
                  You can also get the source code and run locally as well.
                 </p>
                <p>
                  You can start with this app by buying some tokens. You will see the tokens being added to the account.
                  You can vote using these tokens. Events and Gas Cost are displayed.
                  To simulate multiple token buyers, Account 1 and Account 2 are used.
                  Account 0 is used as the wallet that receives the crowdsale proceeds.
                  </p>

              </div>
            </div>
            <div className="pure-g">
              <div className="pure-u-1 pure-u-md-1-2">
                <div className="l-box">
                  <h3>HD Wallet</h3>
                  <EthereumAddresses
                    accountBalance={this.state.selectedAccountBalance}
                    value={this.state.selectedAccount}
                    accounts={accounts} handleChange={this.accountSelected} />
                </div>
              </div>
              <div className="pure-u-1 pure-u-md-1-2">
                <div className="l-box">
                  <h3>CrowdSale<span className="small pull-right">Tokens for sale:
                 {this.state.remainingTokens.toLocaleString()} {this.tokenSymbol}</span></h3>
                  <p>Crowdsale Wallet: {this.state.crowdSaleWalletBalance} ether </p>
                  <button onClick={(e) => this.buyTokens(e)}>Buy 10 tokens</button>
                  &nbsp;
                <p><small>1 ETH gets you {this.tokenRate} ORG tokens ( 0.01 ETH = 10 ORG ).</small></p>

                  <div>{transactionFeeDisplay}</div>
                </div>
              </div>

              <div className="pure-u-1 pure-u-md-1-2">
                <div className="l-box">
                  <h3>OrgToken
  
                </h3>
                  <span className="pull-right "><small>Token Decimals: {!!this.tokenDecimals ? this.tokenDecimals.toString() : ''}
                    <br />&nbsp;Token Symbol: {this.tokenSymbol}
                  </small> </span>
                  <div>Token Wallet: <b> {this.state.remainingTokens} {this.tokenSymbol}</b></div>
                  <div >{this.state.selectedAccount == null ? "" : this.state.selectedAccount.label.split('-')[0]} : <b>{this.state.selectedAccountTokensBalance} {this.tokenSymbol}</b> </div>


                  <TokenEvents accounts={this.state.accounts}
                    events={this.state.transferEvents} />
                </div>



              </div>
              <div className="pure-u-1 pure-u-md-1-2">
                <div className="l-box">
                  <h3>OrgBallot</h3>
                  <Proposals
                    selectedAccount={this.state.selectedAccount}
                    converter={this.state.asciiconverter}
                    orgBallotInstance={this.orgBallotInstance}
                    data={this.state.ballotProposals}
                    web3={this.state.web3} />
                  <VotesCastedEvents accounts={this.state.accounts}
                    converter={this.state.asciiconverter}
                    events={this.state.votesCastedEvents} />
                </div>
              </div>


            </div>
            <div>
              <h5>To Do:</h5>
              <ul className="list-group">
                <li className="list-group-item">
                  Handle Errors and display errors in UI.
                  Figure out why promises are not receiving VM reverts.
                </li>
                <li className="list-group-item">
                  Handling token decimals in events display
               </li>
                <li className="list-group-item">
                  Use Drizzle.
               </li>

                <li className="list-group-item">
                  Switch to TimedOrgBallot to allow election timings.
               </li>
                <li className="list-group-item">
                  Finalize Crowdsale and Ballot contracts.
               </li>
                <li className="list-group-item">
                  Explore: allowing multiple elections - A good use case of Factory Pattern.
               </li>
                <li className="list-group-item">
                  Update account balance on events (of the transactions outside the dapp)
               </li>

              </ul>
            </div>
          </main>
        </div>
      );
    }
  }

  export default App
