import Web3 from 'web3'

let getWeb3 = new Promise(function(resolve, reject) {
  // Wait for loading completion to avoid race conditions with web3 injection timing.
  window.addEventListener('load', function() {
    var results
    var web3 = window.web3
   
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider.
      var gasPrice=null;
     

      (function(cp){

        cp.sendOriginal = cp.send;
         
        cp.send1 = function(){
            var args=[].slice.call(arguments);
            try {
             return cp.sendOriginal.apply(cp,args);
            }
            catch(e) {
    
            }
            //error, replace 
            return new Promise(function(resolve,reject){
              args.push(function(err,result) {
                if(!!err){
                   reject(err); 
                   return;     
                }    
                resolve(result);
            });
              cp.sendAsync.apply(cp,args); 
          });
         };
      })(web3.currentProvider);
      web3 = new Web3(web3.currentProvider);
         //injected at provider level
        
         (function(w3, methods){ 
           for(var methodIndex=0;methodIndex< methods.length;methodIndex++){
             (function(method){
            
            w3.eth[method + "Original"] = w3.eth[method];
            w3.eth[method] =function(){
               var fnArgs=arguments;
               return new Promise(function(resolve,reject){
                var args= [].slice.call(fnArgs);
                args.push(function(err,balance) {
                  if(!!err){
                     reject(err); 
                     return;     
                  }    
                  resolve(balance);
              });
                w3.eth[method + "Original"].apply(this,args); 
            });
          }; 
        })(methods[methodIndex]);
        }  
        })(web3,['getBalance']);

      results = {
        web3: web3
      }

      console.log('Injected web3 detected.');

      resolve(results)
    } else {
      // Fallback to localhost if no web3 injection. We've configured this to
      // use the development console's port by default.
      var provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545')

      web3 = new Web3(provider)

      results = {
        web3: web3
      }

      console.log('No web3 instance injected, using Local web3.');

      resolve(results)
    }
  })
})

export default getWeb3
