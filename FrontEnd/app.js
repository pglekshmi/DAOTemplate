const signer = await provider.getSigner();
async function connectMetaMask() {
    
    alert(`Successfully Connected ${signer.address}`);
    setLoginState("Connected");
  }
function handlePropose(){

}