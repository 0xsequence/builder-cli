import { Command } from 'commander'
import chalk from 'chalk'
import { generateWallet } from '../lib/wallet.js'
import { storeEncryptedKey } from '../lib/config.js'

export const createWalletCommand = new Command('create-wallet')
  .description('Generate a new EOA keypair for use with Sequence Builder')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      const wallet = generateWallet()

      // Auto-encrypt and store if SEQUENCE_PASSPHRASE is set
      const stored = storeEncryptedKey(wallet.privateKey)

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              privateKey: wallet.privateKey,
              address: wallet.address,
              keyStored: stored,
            },
            null,
            2
          )
        )
        return
      }

      console.log('')
      console.log(chalk.green.bold('✓ Wallet created successfully!'))
      console.log('')
      console.log(chalk.white('Private Key:'), chalk.yellow(wallet.privateKey))
      console.log(chalk.white('Address:    '), chalk.cyan(wallet.address))
      console.log('')
      if (stored) {
        console.log(
          chalk.green('✓ Private key encrypted and stored.'),
          chalk.gray("You won't need to pass -k for future commands.")
        )
      } else {
        console.log(
          chalk.red.bold('IMPORTANT:'),
          chalk.white('Store these credentials securely. They will not be shown again.')
        )
        console.log(
          chalk.gray('Tip: Set SEQUENCE_PASSPHRASE env var to auto-encrypt and store the key.')
        )
      }
      console.log('')
      console.log(chalk.gray('To use this wallet:'))
      console.log(chalk.gray('  1. Fund it with native token for gas fees'))
      console.log(
        chalk.gray(`  2. Run: sequence-builder login${stored ? '' : ' -k <your-private-key>'}`)
      )
      console.log('')
    } catch (error) {
      console.error(
        chalk.red('Error creating wallet:'),
        error instanceof Error ? error.message : error
      )
      process.exit(1)
    }
  })
