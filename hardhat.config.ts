import { configVariable, defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";

export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatEthersChaiMatchers,
    hardhatKeystore,
    hardhatMocha,
  ],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    base: {
      type: "http",
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    baseSepolia: {
      type: "http",
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
});
