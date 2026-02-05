import { Command } from 'commander'
import chalk from 'chalk'
import { SequenceIndexer } from '@0xsequence/indexer'
import { networks, ChainId } from '@0xsequence/network'
import { EXIT_CODES } from '../lib/config.js'
import { ethers } from 'ethers'

// Get indexer URL for a chain
function getIndexerUrl(chainId: number): string {
  const network = networks[chainId as ChainId]
  if (!network) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return `https://${network.name}-indexer.sequence.app`
}

export const indexerCommand = new Command('indexer').description(
  'Query blockchain data using Sequence Indexer'
)

// Subcommand: get token balances
indexerCommand
  .command('balances <address>')
  .description('Get token balances for an address')
  .requiredOption('-a, --access-key <key>', 'Project access key')
  .option('-c, --chain-id <chainId>', 'Chain ID', '1')
  .option('--json', 'Output in JSON format')
  .option('--include-metadata', 'Include token metadata')
  .action(async (address, options) => {
    const { accessKey, chainId: chainIdStr, json, includeMetadata } = options

    if (!ethers.isAddress(address)) {
      if (json) {
        console.log(JSON.stringify({ error: 'Invalid address', code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Invalid address'))
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }

    const chainId = parseInt(chainIdStr, 10)

    try {
      const indexerUrl = getIndexerUrl(chainId)
      const indexer = new SequenceIndexer(indexerUrl, accessKey)

      if (!json) {
        console.log(chalk.gray(`Fetching balances for ${address} on chain ${chainId}...`))
      }

      const response = await indexer.getTokenBalances({
        accountAddress: address,
        includeMetadata: includeMetadata || false,
      })

      if (json) {
        console.log(JSON.stringify(response, null, 2))
        return
      }

      console.log('')
      console.log(chalk.white.bold(`Token Balances for ${address}:`))
      console.log('')

      if (!response.balances || response.balances.length === 0) {
        console.log(chalk.yellow('No token balances found.'))
        return
      }

      for (const balance of response.balances) {
        const symbol = balance.contractInfo?.symbol || 'Unknown'
        const name = balance.contractInfo?.name || balance.contractAddress
        const decimals = balance.contractInfo?.decimals || 18
        const amount = ethers.formatUnits(balance.balance, decimals)

        console.log(chalk.cyan(`  ${symbol}`), chalk.white(amount), chalk.gray(`(${name})`))
      }
      console.log('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (json) {
        console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Failed to fetch balances:'), errorMessage)
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }
  })

// Subcommand: get native token balance (ETH, MATIC, etc.)
indexerCommand
  .command('native-balance <address>')
  .description('Get native token balance (ETH, MATIC, etc.) for an address')
  .requiredOption('-a, --access-key <key>', 'Project access key')
  .option('-c, --chain-id <chainId>', 'Chain ID', '1')
  .option('--json', 'Output in JSON format')
  .action(async (address, options) => {
    const { accessKey, chainId: chainIdStr, json } = options

    if (!ethers.isAddress(address)) {
      if (json) {
        console.log(JSON.stringify({ error: 'Invalid address', code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Invalid address'))
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }

    const chainId = parseInt(chainIdStr, 10)

    try {
      const indexerUrl = getIndexerUrl(chainId)
      const indexer = new SequenceIndexer(indexerUrl, accessKey)

      if (!json) {
        console.log(chalk.gray(`Fetching native balance for ${address} on chain ${chainId}...`))
      }

      const response = await indexer.getNativeTokenBalance({
        accountAddress: address,
      })

      const network = networks[chainId as ChainId]
      const symbol = network?.nativeToken?.symbol || 'ETH'
      const balance = ethers.formatEther(response.balance.balance)

      if (json) {
        console.log(
          JSON.stringify(
            {
              address,
              chainId,
              symbol,
              balance,
              balanceWei: response.balance.balance,
            },
            null,
            2
          )
        )
        return
      }

      console.log('')
      console.log(chalk.white.bold(`Native Balance for ${address}:`))
      console.log('')
      console.log(chalk.cyan(`  ${symbol}:`), chalk.white(balance))
      console.log('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (json) {
        console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Failed to fetch balance:'), errorMessage)
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }
  })

// Subcommand: get transaction history
indexerCommand
  .command('history <address>')
  .description('Get transaction history for an address')
  .requiredOption('-a, --access-key <key>', 'Project access key')
  .option('-c, --chain-id <chainId>', 'Chain ID', '1')
  .option('--json', 'Output in JSON format')
  .option('--limit <limit>', 'Number of transactions to fetch', '10')
  .action(async (address, options) => {
    const { accessKey, chainId: chainIdStr, json, limit } = options

    if (!ethers.isAddress(address)) {
      if (json) {
        console.log(JSON.stringify({ error: 'Invalid address', code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Invalid address'))
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }

    const chainId = parseInt(chainIdStr, 10)
    const limitNum = parseInt(limit, 10) || 10

    try {
      const indexerUrl = getIndexerUrl(chainId)
      const indexer = new SequenceIndexer(indexerUrl, accessKey)

      if (!json) {
        console.log(
          chalk.gray(`Fetching transaction history for ${address} on chain ${chainId}...`)
        )
      }

      const response = await indexer.getTransactionHistory({
        filter: {
          accountAddress: address,
        },
        page: {
          pageSize: limitNum,
        },
        includeMetadata: true,
      })

      if (json) {
        console.log(JSON.stringify(response, null, 2))
        return
      }

      console.log('')
      console.log(chalk.white.bold(`Transaction History for ${address}:`))
      console.log('')

      if (!response.transactions || response.transactions.length === 0) {
        console.log(chalk.yellow('No transactions found.'))
        return
      }

      for (const tx of response.transactions) {
        const date = new Date(tx.timestamp).toLocaleString()
        const hash = tx.txnHash.slice(0, 10) + '...' + tx.txnHash.slice(-8)

        console.log(chalk.gray(`  ${date}`))
        console.log(chalk.cyan(`    Hash: ${hash}`))

        if (tx.transfers && tx.transfers.length > 0) {
          for (const transfer of tx.transfers) {
            const symbol = transfer.contractInfo?.symbol || '???'
            const decimals = transfer.contractInfo?.decimals || 18
            const amount =
              transfer.amounts && transfer.amounts.length > 0
                ? ethers.formatUnits(transfer.amounts[0], decimals)
                : '?'
            const direction = transfer.from?.toLowerCase() === address.toLowerCase() ? '→' : '←'

            console.log(chalk.white(`    ${direction} ${amount} ${symbol}`))
          }
        }
        console.log('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (json) {
        console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Failed to fetch history:'), errorMessage)
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }
  })

// Subcommand: get token supplies
indexerCommand
  .command('token-info <contractAddress>')
  .description('Get token contract information and supplies')
  .requiredOption('-a, --access-key <key>', 'Project access key')
  .option('-c, --chain-id <chainId>', 'Chain ID', '1')
  .option('--json', 'Output in JSON format')
  .action(async (contractAddress, options) => {
    const { accessKey, chainId: chainIdStr, json } = options

    if (!ethers.isAddress(contractAddress)) {
      if (json) {
        console.log(
          JSON.stringify({ error: 'Invalid contract address', code: EXIT_CODES.GENERAL_ERROR })
        )
      } else {
        console.error(chalk.red('✖ Invalid contract address'))
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }

    const chainId = parseInt(chainIdStr, 10)

    try {
      const indexerUrl = getIndexerUrl(chainId)
      const indexer = new SequenceIndexer(indexerUrl, accessKey)

      if (!json) {
        console.log(chalk.gray(`Fetching token info for ${contractAddress} on chain ${chainId}...`))
      }

      const response = await indexer.getTokenSupplies({
        contractAddress,
        includeMetadata: true,
      })

      if (json) {
        console.log(JSON.stringify(response, null, 2))
        return
      }

      console.log('')
      console.log(chalk.white.bold(`Token Info for ${contractAddress}:`))
      console.log('')

      // Get contract info from first tokenID or response
      const contractInfo = response.tokenIDs?.[0]?.contractInfo

      if (contractInfo) {
        console.log(chalk.white('Name:       '), chalk.cyan(contractInfo.name || 'Unknown'))
        console.log(chalk.white('Symbol:     '), chalk.cyan(contractInfo.symbol || 'Unknown'))
        console.log(
          chalk.white('Type:       '),
          chalk.gray(response.contractType || contractInfo.type || 'Unknown')
        )
        console.log(
          chalk.white('Decimals:   '),
          chalk.gray(contractInfo.decimals?.toString() || 'N/A')
        )
        if (contractInfo.logoURI) {
          console.log(chalk.white('Logo:       '), chalk.gray(contractInfo.logoURI))
        }
        if (contractInfo.extensions?.description) {
          console.log(
            chalk.white('Description:'),
            chalk.gray(contractInfo.extensions.description.slice(0, 100) + '...')
          )
        }
      }

      if (response.tokenIDs && response.tokenIDs.length > 0) {
        console.log('')
        const totalSupply = response.tokenIDs[0]?.supply
        if (totalSupply && contractInfo?.decimals) {
          const formatted = ethers.formatUnits(totalSupply, contractInfo.decimals)
          console.log(chalk.white('Total Supply:'), chalk.cyan(formatted))
        }
      }
      console.log('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (json) {
        console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Failed to fetch token info:'), errorMessage)
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }
  })
