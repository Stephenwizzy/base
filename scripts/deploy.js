import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";
import { SUITE, resolveArgs } from "./suite.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RETRY_DELAY_MS = 15_000;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function retryDelegatedAccountLimit(action, retryDelay) {
  for (;;) {
    try {
      return await action();
    } catch (error) {
      if (!String(error?.message).includes("in-flight transaction limit reached")) {
        throw error;
      }
      console.log(`Delegated account transaction still in flight; retrying in ${retryDelay / 1000} seconds...`);
      await sleep(retryDelay);
    }
  }
}

async function main() {
  const { ethers } = await network.getOrCreate();
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured");

  const chain = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  const owner = deployer.address;
  const transactionDelay = chain.chainId === 8453n ? RETRY_DELAY_MS : 0;
  console.log(`Deploying from ${deployer.address}`);
  console.log(`Contract owner ${owner}`);
  console.log(`Network ${chain.name} (${chain.chainId}), balance ${ethers.formatEther(balance)} ETH`);

  const outputDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outputDir, { recursive: true });
  const networkName = chain.chainId === 8453n ? "base" : `chain-${chain.chainId}`;
  const outputPath = path.join(outputDir, `${networkName}.json`);
  const progressPath = path.join(outputDir, `.${networkName}-progress.json`);
  const result = fs.existsSync(progressPath)
    ? JSON.parse(fs.readFileSync(progressPath, "utf8"))
    : {
        chainId: Number(chain.chainId),
        deployer: deployer.address,
        owner,
        deployedAt: new Date().toISOString(),
        contracts: {},
        directoryRegistrations: [],
      };

  if (result.chainId !== Number(chain.chainId) || result.deployer !== deployer.address) {
    throw new Error("Deployment progress belongs to a different network or deployer");
  }

  const saveProgress = () => {
    fs.writeFileSync(progressPath, `${JSON.stringify(result, null, 2)}\n`);
  };

  for (const [name, rawArgs] of SUITE) {
    if (result.contracts[name]) {
      console.log(`${name}: ${result.contracts[name].address} (existing)`);
      continue;
    }

    const args = resolveArgs(rawArgs, owner);
    const factory = await ethers.getContractFactory(name);
    const contract = await retryDelegatedAccountLimit(
      () => factory.deploy(...args),
      RETRY_DELAY_MS
    );
    const receipt = await contract.deploymentTransaction().wait();
    const address = await contract.getAddress();
    result.contracts[name] = {
      address,
      transactionHash: receipt.hash,
      constructorArguments: args,
    };
    saveProgress();
    console.log(`${name}: ${address}`);
    await sleep(transactionDelay);
  }

  const directory = await ethers.getContractAt(
    "DeploymentDirectory",
    result.contracts.DeploymentDirectory.address
  );
  for (const [name] of SUITE.slice(0, -1)) {
    if (result.directoryRegistrations.includes(name)) {
      console.log(`Directory registration: ${name} (existing)`);
      continue;
    }

    const key = ethers.encodeBytes32String(name);
    const transaction = await retryDelegatedAccountLimit(
      () => directory.register(key, result.contracts[name].address),
      RETRY_DELAY_MS
    );
    await transaction.wait();
    result.directoryRegistrations.push(name);
    saveProgress();
    console.log(`Directory registration: ${name}`);
    await sleep(transactionDelay);
  }

  result.completedAt = new Date().toISOString();
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  fs.rmSync(progressPath);
  console.log(`Deployment manifest: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
