// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs= require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:",deployer.address);

  const govToken = await hre.ethers.deployContract("GovToken", [deployer.address]);
  await govToken.waitForDeployment();
  console.log(`Governance Token COntract deployed to ${govToken.target}`);

  const balance= await govToken.balanceOf(deployer.address);
  console.log(`Token Balance of owner:${balance.toString()}`);

  let votes = await govToken.getVotes(deployer.address);
  console.log(`Votes allocated to ${deployer.address} : ${votes}`);

  const response= await govToken.delegate(deployer.address);
  await response.wait(1);
  votes = await govToken.getVotes(deployer.address);
  console.log(`Votes allocated to ${deployer.address} after delegation : ${votes}`);

  const timeLock = await hre.ethers.deployContract('TimeLock',[0,[deployer.address],[deployer.address],deployer.address]);
  await timeLock.waitForDeployment();
  console.log(`TimeLock contract deployed to:${timeLock.target}`);
  
  const box= await hre.ethers.deployContract('Box',[timeLock.target]);
  await box.waitForDeployment();
  console.log(`Box contract deployed on: ${box.target}`);
  
  const govern= await hre.ethers.deployContract('GovernContract',[govToken.target,timeLock.target,100,100,0]);
  await govern.waitForDeployment();
  console.log(`Governance contract deployed on: ${govern.target}`);
  
  const PROPOSER_ROLE= await timeLock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE();
  console.log(`Proposer Role is ${PROPOSER_ROLE}`);

  await timeLock.connect(deployer).grantRole(PROPOSER_ROLE,govern.target);
  await timeLock.connect(deployer).grantRole(EXECUTOR_ROLE,govern.target)
  
  saveAddresses({
    GovTokenAddr: govToken.target,
    TimeLockAddr: timeLock.target,
    BoxAddr: box.target,
    GovernorContractAddr: govern.target
});
  
}
function saveAddresses(addresses) {
  const filePath = './deployedAddresses.json';
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
  console.log(`Contract addresses saved to ${filePath}`);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
