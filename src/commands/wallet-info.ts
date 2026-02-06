import { Command } from 'commander'
import chalk from 'chalk'
import { Session } from '@0xsequence/auth'
import { EXIT_CODES, getPrivateKey } from '../lib/config.js'
import { isValidPrivateKey, getAddressFromPrivateKey } from '../lib/wallet.js'

export const walletInfoCommand = new Command('wallet-info')
  .description('Show wallet addresses (EOA and Sequence smart wallet)')
  .option('-k, --private-key <key>', 'Your wallet private key (or use stored encrypted key)')
  .requiredOption('-a, --access-key <key>', 'Project access key')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    const { accessKey, json } = options

    try {
      const privateKey = getPrivateKey(options)

      // Validate private key format
      if (!isValidPrivateKey(privateKey)) {
        if (json) {
          console.log(
            JSON.stringify({
              error: 'Invalid private key format',
              code: EXIT_CODES.INVALID_PRIVATE_KEY,
            })
          )
        } else {
          console.error(chalk.red('✖ Invalid private key format'))
        }
        process.exit(EXIT_CODES.INVALID_PRIVATE_KEY)
      }

      const normalizedPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey

      // Get EOA address
      const eoaAddress = getAddressFromPrivateKey(normalizedPrivateKey)

      if (!json) {
        console.log('')
        console.log(chalk.gray('Deriving Sequence wallet address...'))
      }

      // Create Sequence session to get smart wallet address
      const session = await Session.singleSigner({
        signer: normalizedPrivateKey,
        projectAccessKey: accessKey,
      })

      const sequenceWalletAddress = session.account.address

      const fundingUrl = `https://demo.trails.build/?mode=swap&toAddress=${sequenceWalletAddress}&toChainId=137&toToken=0x3c499c542cef5e3811e1192ce70d8cc03d5c3359&apiKey=AQAAAAAAAKhGHJc3N5V2AWqfJ1v9xZ2u0nA&theme=light`

      if (json) {
        console.log(
          JSON.stringify(
            {
              eoaAddress,
              sequenceWalletAddress,
              fundingUrl,
            },
            null,
            2
          )
        )
        return
      }

      console.log('')
      console.log(chalk.white.bold('Wallet Addresses:'))
      console.log('')
      console.log(chalk.white('EOA Address:          '), chalk.gray(eoaAddress))
      console.log(chalk.white('Sequence Wallet:      '), chalk.cyan(sequenceWalletAddress))
      console.log('')
      console.log(chalk.yellow.bold('Important:'))
      console.log(
        chalk.yellow(
          '  Send tokens to the Sequence Wallet address for use with the transfer command.'
        )
      )
      console.log(
        chalk.yellow('  The Sequence Wallet can pay gas fees with ERC20 tokens (no ETH needed).')
      )
      console.log('')
      console.log(chalk.green.bold('Fund your wallet:'))
      console.log(chalk.green('  Click the link below to fund your Sequence Wallet via Trails:'))
      console.log('')
      console.log(chalk.cyan.underline(fundingUrl))
      console.log('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (json) {
        console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.GENERAL_ERROR }))
      } else {
        console.error(chalk.red('✖ Failed to get wallet info:'), errorMessage)
      }
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }
  })
