import { Command } from 'commander'
import chalk from 'chalk'
import { generateEthAuthProof } from '../lib/ethauth.js'
import { getAuthToken, isApiError } from '../lib/api.js'
import { extractErrorMessage } from '../lib/errors.js'
import {
  updateConfig,
  EXIT_CODES,
  isLoggedIn,
  getValidJwtToken,
  getPrivateKey,
  storeEncryptedKey,
} from '../lib/config.js'
import { isValidPrivateKey, getAddressFromPrivateKey } from '../lib/wallet.js'

export const loginCommand = new Command('login')
  .description('Authenticate with Sequence Builder using your private key')
  .option('-k, --private-key <key>', 'Your wallet private key (or use stored encrypted key)')
  .option('-e, --email <email>', 'Email address to associate with your account')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .action(async (options) => {
    try {
      const { email, json, env, apiUrl } = options
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
          console.error(
            chalk.gray(
              'Private key should be a 64-character hex string (with or without 0x prefix)'
            )
          )
        }
        process.exit(EXIT_CODES.INVALID_PRIVATE_KEY)
      }

      const address = getAddressFromPrivateKey(privateKey)

      if (!json) {
        console.log('')
        console.log(chalk.gray('Authenticating wallet:'), chalk.cyan(address))
        console.log(chalk.gray('Generating ETHAuth proof...'))
      }

      // Generate ETHAuth proof
      const proofString = await generateEthAuthProof(privateKey)

      if (!json) {
        console.log(chalk.gray('Calling GetAuthToken API...'))
      }

      // Call GetAuthToken API
      const response = await getAuthToken(proofString, email, { env, apiUrl })

      if (!response.ok || !response.auth?.jwtToken) {
        if (json) {
          console.log(
            JSON.stringify({ error: 'Authentication failed', code: EXIT_CODES.API_ERROR })
          )
        } else {
          console.error(chalk.red('✖ Authentication failed'))
        }
        process.exit(EXIT_CODES.API_ERROR)
      }

      // Store JWT token in config
      updateConfig({
        jwtToken: response.auth.jwtToken,
        jwtExpiresAt: response.auth.expiresAt,
        environment: env as 'prod' | 'dev',
        apiUrl: apiUrl,
      })

      // Auto-encrypt and store private key if SEQUENCE_PASSPHRASE is set
      const stored = storeEncryptedKey(privateKey)

      if (json) {
        console.log(
          JSON.stringify(
            {
              success: true,
              address,
              expiresAt: response.auth.expiresAt,
            },
            null,
            2
          )
        )
        return
      }

      console.log('')
      console.log(chalk.green.bold('✓ Successfully authenticated!'))
      console.log('')
      console.log(chalk.white('Address:   '), chalk.cyan(address))
      console.log(chalk.white('Expires:   '), chalk.gray(response.auth.expiresAt))
      if (stored) {
        console.log(
          chalk.green('Key:       '),
          chalk.green('Encrypted and stored (no need to pass -k again)')
        )
      }
      console.log('')
      console.log(chalk.gray('You can now use commands like:'))
      console.log(chalk.gray('  sequence-builder projects'))
      console.log(chalk.gray('  sequence-builder projects create "My Project"'))
      console.log('')
    } catch (error) {
      const errorMessage = extractErrorMessage(error)

      // Structured API error with rate-limit / permission info
      if (isApiError(error) && (error.isRateLimited || error.isPermissionDenied)) {
        if (options.json) {
          console.log(
            JSON.stringify({
              error: error.isRateLimited ? 'Rate limited' : 'Permission denied',
              statusCode: error.statusCode,
              retryAfterSeconds: error.retryAfterSeconds,
              detail: error.errorBody,
              code: EXIT_CODES.API_ERROR,
            })
          )
        } else {
          if (error.isRateLimited) {
            console.error(chalk.red('✖ Rate limited by the API'))
            if (error.retryAfterSeconds !== null) {
              console.error(chalk.yellow(`  Retry after: ${error.retryAfterSeconds}s`))
            }
            console.error(
              chalk.gray(
                '  You have made too many login attempts. Please wait before trying again.'
              )
            )
          } else {
            console.error(chalk.red('✖ Permission denied (403)'))
            console.error(chalk.gray('  This can happen when:'))
            console.error(chalk.gray('    - Too many signing/login attempts in a short period'))
            console.error(chalk.gray('    - The ETHAuth proof is malformed or expired'))
            console.error(chalk.gray('    - Your wallet address is not authorized'))
          }
          if (error.retryAfterSeconds !== null && !error.isRateLimited) {
            console.error(chalk.yellow(`  Retry after: ${error.retryAfterSeconds}s`))
          }
          if (error.errorBody) {
            console.error(chalk.gray(`  Server response: ${error.errorBody}`))
          }
        }
        process.exit(EXIT_CODES.API_ERROR)
      }

      // Catch 403/rate-limit in generic error strings (e.g. from SDK internals)
      if (
        errorMessage.includes('403') ||
        errorMessage.toLowerCase().includes('permissiondenied') ||
        errorMessage.toLowerCase().includes('rate limit')
      ) {
        if (options.json) {
          console.log(
            JSON.stringify({
              error: 'Permission denied or rate limited',
              detail: errorMessage,
              code: EXIT_CODES.API_ERROR,
            })
          )
        } else {
          console.error(chalk.red('✖ Permission denied or rate limited'))
          console.error(chalk.gray('  This can happen when:'))
          console.error(chalk.gray('    - Too many signing/login attempts in a short period'))
          console.error(chalk.gray('    - The ETHAuth proof is malformed or expired'))
          console.error(chalk.gray(`  Detail: ${errorMessage}`))
        }
        process.exit(EXIT_CODES.API_ERROR)
      }

      if (options.json) {
        console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.API_ERROR }))
      } else {
        console.error(chalk.red('✖ Login failed:'), errorMessage)
      }
      process.exit(EXIT_CODES.API_ERROR)
    }
  })

// Also export a status command to check current login status
export const statusCommand = new Command('status')
  .description('Check current authentication status')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    const loggedIn = isLoggedIn()

    if (options.json) {
      console.log(JSON.stringify({ loggedIn }))
      return
    }

    if (loggedIn) {
      console.log(chalk.green('✓ You are logged in'))
    } else {
      console.log(chalk.yellow('✖ You are not logged in'))
      console.log(chalk.gray('Run: sequence-builder login -k <your-private-key>'))
    }
  })
