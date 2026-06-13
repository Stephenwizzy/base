# Base Creator Toolkit

Ten small, independent smart contracts for a public creator identity and community
toolkit on Base.

## Contracts

1. `ProfileRegistry` - self-managed profile URIs.
2. `MessageBoard` - permanent short public messages.
3. `Guestbook` - one signed guestbook entry per wallet.
4. `ProofRegistry` - timestamps unique document hashes.
5. `LinkRegistry` - self-managed named project and social links.
6. `TipJar` - receives ETH and lets the owner withdraw it.
7. `SimplePoll` - one vote per wallet in a fixed poll.
8. `AchievementBadges` - owner-issued, non-transferable badges.
9. `AllowlistRegistry` - owner-managed wallet allowlist.
10. `DeploymentDirectory` - indexes every contract in the suite.

## Local development

```powershell
npm install
npm test
```

Store the deployment key in Hardhat's encrypted keystore. Never paste it into
chat, commit it, or put it directly in the configuration:

```powershell
npx hardhat keystore set DEPLOYER_PRIVATE_KEY
```

```powershell
npm run estimate:base
npm run deploy:base
```

The deployment script writes public addresses and transaction hashes to
`deployments/base.json`.

## Base networks

- Base mainnet chain ID: `8453`
- Base Sepolia chain ID: `84532`
- Gas token: ETH

Deployments should be tested locally and on Base Sepolia before mainnet use.
