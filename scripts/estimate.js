import { network } from "hardhat";
import { SUITE, resolveArgs } from "./suite.js";

async function main() {
  const { ethers } = await network.getOrCreate();
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured");

  const chain = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  const owner = deployer.address;
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
  if (!gasPrice) throw new Error("RPC did not return a gas price");

  let totalGas = 0n;
  console.log(`Network: ${chain.name} (${chain.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  for (const [name, rawArgs] of SUITE) {
    const factory = await ethers.getContractFactory(name);
    const transaction = await factory.getDeployTransaction(
      ...resolveArgs(rawArgs, owner)
    );
    const gas = await ethers.provider.estimateGas({
      ...transaction,
      from: deployer.address,
    });
    totalGas += gas;
    console.log(`${name}: ${gas.toString()} gas`);
  }

  // Directory registration transactions are estimated conservatively.
  totalGas += 9n * 80000n;
  const estimatedCost = totalGas * gasPrice;
  console.log(`Estimated total gas (including directory setup): ${totalGas}`);
  console.log(`Estimated cost: ${ethers.formatEther(estimatedCost)} ETH`);
  console.log(`Suggested minimum with 50% buffer: ${ethers.formatEther((estimatedCost * 3n) / 2n)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
