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

## Base mainnet deployment

Deployed on June 13, 2026 from
[`0x2c0A...d42d`](https://basescan.org/address/0x2c0A9DA1A97555107D7e5dd46870F9A53ae2d42d).

| Contract | Address |
| --- | --- |
| ProfileRegistry | [`0x3Ef1...C1cf`](https://basescan.org/address/0x3Ef1A00fa8983d4180022a5A1F9F4E54d9C4C1cf) |
| MessageBoard | [`0xABFD...3FB0`](https://basescan.org/address/0xABFD647FB223d166c9cBffA38763ef30e1ce3FB0) |
| Guestbook | [`0xFc39...d0CD`](https://basescan.org/address/0xFc39596f348380A67e7aC58cF61900379972d0CD) |
| ProofRegistry | [`0xB6d1...5593`](https://basescan.org/address/0xB6d123C4789A712Dbe29B41D7C90157CDbB15593) |
| LinkRegistry | [`0xd8D0...b5d6`](https://basescan.org/address/0xd8D00B01640D51F18aE35EA5dAd7ceb8a738b5d6) |
| TipJar | [`0xcB39...6316`](https://basescan.org/address/0xcB3940484f7faE8904bdc5cD08429C4879d06316) |
| SimplePoll | [`0x7204...FC55`](https://basescan.org/address/0x7204bBA72F6BF7F929eA6FcDcC221ee7925DFC55) |
| AchievementBadges | [`0x1239...1E13`](https://basescan.org/address/0x12394FDaE4877D86e71e0087909221528b2f1E13) |
| AllowlistRegistry | [`0x0025...e82e`](https://basescan.org/address/0x0025F81C569a717BFa63C13db6dcc81005c9e82e) |
| DeploymentDirectory | [`0x350a...dD07`](https://basescan.org/address/0x350afA9C345Bb39458F61C075518C1a2f87DdD07) |

The full transaction record and constructor arguments are in
[`deployments/base.json`](deployments/base.json).

## Base networks

- Base mainnet chain ID: `8453`
- Base Sepolia chain ID: `84532`
- Gas token: ETH

Deployments should be tested locally and on Base Sepolia before mainnet use.
