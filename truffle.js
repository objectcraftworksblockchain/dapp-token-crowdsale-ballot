require('dotenv').config();
require('babel-polyfill');
require('babel-register')({
  ignore: /node_modules\/(?!zeppelin)/
});




module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development:{
      host: '127.0.0.1',
      port: 8545,
      network_id : '*',
      gas: 8500000
    },
    truffle:{
      host: '127.0.0.1',
      port: 9545,
      network_id : '*',
      gas: 8500000
    },
    ganachecli:{
      host: '127.0.0.1',
      port: 8545,
      network_id : '*',
      gas: 9000000
    }
  }   
};
