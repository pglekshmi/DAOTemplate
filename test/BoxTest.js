const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BoxDAO", function () {
  it("DAO Testing", async function () {
    const [owner,deleg,voter1,deleg1,voter2] = await ethers.getSigners();
    console.log(owner);

    const govToken = await ethers.deployContract("GovToken", [owner]);
    await govToken.waitForDeployment();

    let balance = await govToken.balanceOf(owner.address);
    console.log(balance);

    let mintAmount = await ethers.parseUnits('1000',18);
    
    await govToken.connect(owner).mint(deleg.address,mintAmount);

    
     balance = await govToken.balanceOf(deleg.address);
    console.log(balance);

     mintAmount = await ethers.parseUnits('1000',18);
    
    await govToken.connect(owner).mint(deleg1.address,mintAmount);

    const timeLock = await ethers.deployContract("TimeLock", [0, [owner.address], [owner.address], owner.address]);
    timeLock.waitForDeployment();

    const box = await ethers.deployContract("Box", [timeLock.target]);
    box.waitForDeployment();

    const govern = await ethers.deployContract("GovernContract", [govToken.target, timeLock.target, 100, 100, 4]);
    govern.waitForDeployment();


    let delegateT = await govToken.delegate(owner.address);
    await delegateT.wait(1);

    let vote = await govToken.getVotes(owner.address);
    console.log(`Voting units for ${owner.address} is ${vote}`);

    delegateT=await govToken.connect(deleg).delegate(voter1.address);
    await delegateT.wait(1);

    

    vote = await govToken.getVotes(voter1.address);
    console.log(`Voting units for ${voter1.address} is ${vote}`);

    delegateT=await govToken.connect(deleg1).delegate(voter2.address);
    await delegateT.wait(1);

    vote = await govToken.getVotes(voter2.address);
    console.log(`Voting units for ${voter2.address} is ${vote}`);

    const supply= await govToken.totalSupply();
    console.log(`Total Supply:${supply}`);
    


    const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE();

    await timeLock.connect(owner).grantRole(PROPOSER_ROLE, govern.target);
    await timeLock.connect(owner).grantRole(EXECUTOR_ROLE, govern.target);

    const BoxObj = await ethers.getContractAt("Box", box.target);
    const transCallData = BoxObj.interface.encodeFunctionData("store", [123]);
    console.log(`The calldata TRansaction ${transCallData}`);

    proposeTx = await govern.propose([box.target], [0], [transCallData], "Proposal:To store a value");
    await proposeTx.wait(1);
    console.log(`Our Proposal: ${proposeTx}`);

    const efilter = await govern.filters.ProposalCreated();

    const blockNumber = proposeTx.blockNumber;
    console.log(`Proposal Blocknumber: ${blockNumber}`);

    const events = await govern.queryFilter(efilter, proposeTx.blockNumber, proposeTx.blockNumber);
    console.log(events[0].args.proposalId);
    
    const proposalID = await events[0].args.proposalId
    console.log(`The Proposal Id: ${proposalID}`);

    let pState = await govern.state(proposalID);
    console.log(`State of contract: ${pState}`);
    for (i = 0; i < 110; i++) {
      await network.provider.send("evm_mine");
    }

    const voteTx = await govern.castVoteWithReason(proposalID, 1, "Isupport");
    await voteTx.wait(1);

    const voteStatus = await govern.proposalVotes(proposalID);
    console.log(`Vote Status: ${voteStatus}`);

    pState = await govern.state(proposalID);
    console.log(`State of contract: ${pState}`);

    for (i = 0; i < 110; i++) {
      await network.provider.send("evm_mine");
    }

    pState = await govern.state(proposalID);
    console.log(`State of contract: ${pState}`);

    if (pState == 4) {

      const DescriptionHash = ethers.id("Proposal:To store a value");

      const queueTx = await govern.connect(owner).queue([box.target], [0], [transCallData], DescriptionHash);
      await queueTx.wait(1);

      for (i = 0; i < 10; i++) {
        await network.provider.send("evm_mine");
      }
  
      pState = await govern.state(proposalID);
      console.log(`State of contract: ${pState}`);

      const qfilter= govern.filters.ProposalQueued();
      const eventq= await govern.queryFilter(qfilter,queueTx.blockNumber,queueTx.blockNumber);
      console.log(eventq[0].args.proposalId);

      const efilter1 = await govern.filters.ProposalCreated();

       const pevent = await govern.queryFilter(efilter1, 0, queueTx.blockNumber);
      console.log(pevent[0].args.proposalId);

      // const ID = await pevent[0].args.proposalId;
      // const target = await pevent[0].args.targets;
      // const values = await pevent[0].args.values;
      // const des = await pevent[0].args.description;
      // const dhash = await ethers.id("des");

      // console.log(des);

      const execTx = await govern.connect(owner).execute([box.target],[0],[transCallData],DescriptionHash);
      await execTx.wait(1);
      
      pState = await govern.state(proposalID);
      console.log(`State of contract: ${pState}`);

      console.log(await box.retrieve());
      
      
    }


  });
});