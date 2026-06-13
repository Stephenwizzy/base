import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";
import { SUITE, resolveArgs } from "./suite.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { ethers } = await network.getOrCreate();
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured");

  const chain = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  const owner = deployer.address;
  console.log(`Deploying from ${deployer.address}`);
  console.log(`Contract owner ${owner}`);
  console.log(`Network ${chain.name} (${chain.chainId}), balance ${ethers.formatEther(balance)} ETH`);

  const result = {
    chainId: Number(chain.chainId),
    deployer: deployer.address,
    owner,
    deployedAt: new Date().toISOString(),
    contracts: {},
  };

  for (const [name, rawArgs] of SUITE) {
    const args = resolveArgs(rawArgs, owner);
    const factory = await ethers.getContractFactory(name);
    const contract = await factory.deploy(...args);
    const receipt = await contract.deploymentTransaction().wait();
    const address = await contract.getAddress();
    result.contracts[name] = {
      address,
      transactionHash: receipt.hash,
      constructorArguments: args,
    };
    console.log(`${name}: ${address}`);
  }

  const directory = await ethers.getContractAt(
    "DeploymentDirectory",
    result.contracts.DeploymentDirectory.address
  );
  for (const [name] of SUITE.slice(0, -1)) {
    const key = ethers.encodeBytes32String(name);
    const transaction = await directory.register(key, result.contracts[name].address);
    await transaction.wait();
  }

  const outputDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outputDir, { recursive: true });
  const networkName = chain.chainId === 8453n ? "base" : `chain-${chain.chainId}`;
  const outputPath = path.join(outputDir, `${networkName}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Deployment manifest: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
