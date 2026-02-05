# Sequence Builder CLI

CLI for Sequence Builder - designed for AI agents and automation. Create wallets, authenticate, manage projects, query blockchain data, and send transactions from the command line.

## Quick Start

Run any command directly with `npx`:

```bash
npx @0xsequence/builder-cli --help
```

Or install globally:

```bash
npm install -g @0xsequence/builder-cli
sequence-builder --help
```

## Quick Start for Agents

```bash
# 1. Generate a wallet
npx @0xsequence/builder-cli create-wallet --json

# 2. Store the private key securely (shown in output)

# 3. Login with your private key
npx @0xsequence/builder-cli login -k <your-private-key>

# 4. Create a project and get your access key
npx @0xsequence/builder-cli projects create "My Project"

# 5. Get your Sequence wallet address (where to send tokens)
npx @0xsequence/builder-cli wallet-info -k <private-key> -a <access-key>

# 6. Fund the Sequence wallet with tokens

# 7. Send an ERC20 transfer (gas paid with same token!)
npx @0xsequence/builder-cli transfer \
  -k <private-key> \
  -a <access-key> \
  -t <token-address> \
  -r <recipient> \
  -m <amount> \
  -c <chain-id>
```

## Commands

| Command | Description |
|---------|-------------|
| `create-wallet` | Generate new EOA keypair |
| `wallet-info` | Show EOA and Sequence wallet addresses |
| `login -k <key>` | Authenticate with private key |
| `projects` | List all projects |
| `projects create [name]` | Create new project |
| `projects get <id>` | Get project details |
| `apikeys <project-id>` | List API keys |
| `apikeys default <project-id>` | Get default API key |
| `transfer` | Send ERC20 transfer via Sequence wallet |
| `indexer balances <address>` | Get token balances |
| `indexer native-balance <address>` | Get native token balance |
| `indexer history <address>` | Get transaction history |
| `indexer token-info <contract>` | Get token contract info |

## Understanding Wallet Addresses

This CLI uses **Sequence Smart Wallets** for transfers. When you create a wallet, you get:

- **EOA Address**: The standard Ethereum address derived from your private key (used for login/project ownership)
- **Sequence Wallet Address**: A smart contract wallet that enables gas-free transactions (used for transfers)

Use `wallet-info` to see both addresses:

```bash
npx @0xsequence/builder-cli wallet-info -k <private-key> -a <access-key>
```

**Important**: Send tokens to the **Sequence Wallet Address** for use with the `transfer` command. The Sequence wallet can pay gas fees with ERC20 tokens (no native token needed!).

## Create Wallet

Generate a new wallet for use with Sequence Builder:

```bash
npx @0xsequence/builder-cli create-wallet
```

Output:

```
✓ Wallet created successfully!

Private Key: 0x4c0883a69102937d6231471b5dbb6204fe512961708279f9f4e7d1b3e6d1e3a1
Address:     0x89D9F8f31817BAdb5D718CD6fb483b71DbD2dfeD

IMPORTANT: Store these credentials securely. They will not be shown again.
```

## Wallet Info

Show both EOA and Sequence wallet addresses:

```bash
npx @0xsequence/builder-cli wallet-info -k <private-key> -a <access-key>
```

Output:

```
Wallet Addresses:

EOA Address:           0x742BDb3bEEB7aDCe50294665a7388ADB7519a6eA
Sequence Wallet:       0xA715064b5601Aebf197aC84A469b72Bb7Dc6A646

Important:
  Send tokens to the Sequence Wallet address for use with the transfer command.
  The Sequence Wallet can pay gas fees with ERC20 tokens (no ETH needed).
```

## Login

Authenticate with Sequence Builder using your private key:

```bash
npx @0xsequence/builder-cli login -k 0x4c0883a69102937d6231471b5dbb6204fe5129617...
```

Options:

- `-k, --private-key <key>` - Your wallet private key (required)
- `-e, --email <email>` - Email address to associate with your account
- `--env <environment>` - Environment (prod, dev)

## Projects

### List Projects

```bash
npx @0xsequence/builder-cli projects
```

### Create Project

```bash
npx @0xsequence/builder-cli projects create "My Game"
```

Options:

- `--chain-ids <ids>` - Comma-separated list of chain IDs
- `-k, --private-key <key>` - Show Sequence wallet address in output

### Get Project Details

```bash
npx @0xsequence/builder-cli projects get 12345
```

## API Keys

### List API Keys

```bash
npx @0xsequence/builder-cli apikeys 12345
```

### Get Default API Key

```bash
npx @0xsequence/builder-cli apikeys default 12345
```

## Transfer (ERC20)

Send an ERC20 token transfer using Sequence smart wallet:

```bash
npx @0xsequence/builder-cli transfer \
  -k 0x4c0883a... \
  -a AQAAAAAAAABnD... \
  -t 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  -r 0x1234567890123456789012345678901234567890 \
  -m 10.5 \
  -c 8453
```

Options:

- `-k, --private-key <key>` - Your wallet private key (required)
- `-a, --access-key <key>` - Project access key (required)
- `-t, --token <address>` - ERC20 token contract address (required)
- `-r, --recipient <address>` - Recipient address (required)
- `-m, --amount <amount>` - Amount to send in token units (required)
- `-c, --chain-id <chainId>` - Chain ID (required)

**Note**: Gas fees are automatically paid using the same token you're transferring (e.g., transfer USDC, pay gas in USDC). No native token (ETH/MATIC) needed!

## Indexer Commands

Query blockchain data using Sequence Indexer.

### Get Token Balances

```bash
npx @0xsequence/builder-cli indexer balances <address> \
  -a <access-key> \
  -c <chain-id> \
  --include-metadata
```

### Get Native Token Balance

```bash
npx @0xsequence/builder-cli indexer native-balance <address> \
  -a <access-key> \
  -c <chain-id>
```

### Get Transaction History

```bash
npx @0xsequence/builder-cli indexer history <address> \
  -a <access-key> \
  -c <chain-id> \
  --limit 20
```

### Get Token Info

```bash
npx @0xsequence/builder-cli indexer token-info <contract-address> \
  -a <access-key> \
  -c <chain-id>
```

## Supported Networks

| Network | Chain ID |
|---------|----------|
| Ethereum | 1 |
| Polygon | 137 |
| Base | 8453 |
| Arbitrum | 42161 |
| Optimism | 10 |
| BSC | 56 |
| Avalanche | 43114 |

See all supported networks at [Sequence Status](https://status.sequence.info/).

## JSON Output Mode

All commands support `--json` flag for machine-readable output:

```bash
npx @0xsequence/builder-cli projects --json
npx @0xsequence/builder-cli apikeys 12345 --json
npx @0xsequence/builder-cli create-wallet --json
npx @0xsequence/builder-cli indexer balances <address> -a <key> -c 8453 --json
```

Example JSON output:

```json
{
  "privateKey": "0x4c0883a...",
  "address": "0x89D9F8f..."
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 10 | Not logged in |
| 11 | Invalid private key |
| 20 | Insufficient funds |
| 30 | No projects found |
| 31 | Project not found |
| 40 | API error |

## Configuration

Configuration is stored in `~/.sequence-builder/config.json`:

- JWT token for authentication
- Environment settings

**Note**: Private keys are NOT stored. You must provide them with each command that requires signing.

## Environment Support

```bash
# Use production (default)
npx @0xsequence/builder-cli login -k <key> --env prod

# Use development
npx @0xsequence/builder-cli login -k <key> --env dev

# Use custom API URL
npx @0xsequence/builder-cli login -k <key> --api-url https://custom-api.example.com
```

## Requirements

- Node.js 18+

## Local Development

```bash
# Clone and install
git clone https://github.com/0xsequence/builder-cli.git
cd builder-cli
pnpm install

# Run in development mode
pnpm dev create-wallet
pnpm dev login -k <key>
pnpm dev projects

# Build
pnpm build
```

## Publishing

```bash
# Bump version
npm version patch  # or: minor | major

# Build and publish (single command)
pnpm upload

# Or manually:
pnpm build
npm publish --access public

# Push tags
git push origin main --tags
```

## License

MIT — see the [LICENSE](LICENSE) file for details.
