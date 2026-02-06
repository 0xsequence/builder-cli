import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import chalk from 'chalk'
import { encryptPrivateKey, decryptPrivateKey, type EncryptedData } from './crypto.js'

export interface Config {
  jwtToken?: string
  jwtExpiresAt?: string
  environment: 'prod' | 'dev'
  apiUrl?: string
  encryptedPrivateKey?: string
  encryptionSalt?: string
  encryptionIv?: string
}

const CONFIG_DIR = join(homedir(), '.sequence-builder')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

/**
 * Ensure the config directory exists
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

/**
 * Load configuration from disk
 */
export function loadConfig(): Config {
  ensureConfigDir()

  if (!existsSync(CONFIG_FILE)) {
    return { environment: 'prod' }
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(content) as Config
  } catch {
    return { environment: 'prod' }
  }
}

/**
 * Save configuration to disk
 */
export function saveConfig(config: Config): void {
  ensureConfigDir()
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Update specific config values
 */
export function updateConfig(updates: Partial<Config>): Config {
  const current = loadConfig()
  const updated = { ...current, ...updates }
  saveConfig(updated)
  return updated
}

/**
 * Get the JWT token if it's still valid
 */
export function getValidJwtToken(): string | null {
  const config = loadConfig()

  if (!config.jwtToken || !config.jwtExpiresAt) {
    return null
  }

  const expiresAt = new Date(config.jwtExpiresAt)
  if (new Date() >= expiresAt) {
    return null
  }

  return config.jwtToken
}

/**
 * Check if user is logged in with a valid JWT
 */
export function isLoggedIn(): boolean {
  return getValidJwtToken() !== null
}

/**
 * Clear the JWT token (logout)
 */
export function clearAuth(): void {
  const config = loadConfig()
  delete config.jwtToken
  delete config.jwtExpiresAt
  saveConfig(config)
}

/**
 * Get the API URL based on environment
 */
export function getApiUrl(options?: { env?: string; apiUrl?: string }): string {
  if (options?.apiUrl) {
    return options.apiUrl
  }

  const config = loadConfig()
  const env = options?.env || config.environment || 'prod'

  switch (env) {
    case 'dev':
      return 'https://dev-api.sequence.build'
    case 'prod':
    default:
      return 'https://api.sequence.build'
  }
}

/**
 * Encrypt and store a private key in config using SEQUENCE_PASSPHRASE env var.
 * Returns true if stored, false if SEQUENCE_PASSPHRASE is not set.
 */
export function storeEncryptedKey(privateKey: string): boolean {
  const passphrase = process.env.SEQUENCE_PASSPHRASE
  if (!passphrase) {
    return false
  }

  const data = encryptPrivateKey(privateKey, passphrase)
  updateConfig({
    encryptedPrivateKey: data.encrypted,
    encryptionSalt: data.salt,
    encryptionIv: data.iv,
  })
  return true
}

/**
 * Resolve the private key from CLI options or stored encrypted config.
 * Priority: 1) explicit --private-key flag, 2) stored encrypted key via SEQUENCE_PASSPHRASE.
 * Exits with error if neither is available.
 */
export function getPrivateKey(options: { privateKey?: string; json?: boolean }): string {
  const { privateKey, json } = options

  // 1. Explicit CLI flag takes precedence
  if (privateKey) {
    return privateKey
  }

  // 2. Try to decrypt stored key
  const passphrase = process.env.SEQUENCE_PASSPHRASE
  const config = loadConfig()

  if (config.encryptedPrivateKey && config.encryptionSalt && config.encryptionIv && passphrase) {
    try {
      const data: EncryptedData = {
        encrypted: config.encryptedPrivateKey,
        salt: config.encryptionSalt,
        iv: config.encryptionIv,
      }
      return decryptPrivateKey(data, passphrase)
    } catch {
      if (json) {
        console.log(
          JSON.stringify({
            error: 'Failed to decrypt stored key -- check SEQUENCE_PASSPHRASE',
            code: EXIT_CODES.INVALID_PRIVATE_KEY,
          })
        )
      } else {
        console.error(chalk.red('✖ Failed to decrypt stored private key'))
        console.error(chalk.gray('Check that SEQUENCE_PASSPHRASE is correct'))
      }
      process.exit(EXIT_CODES.INVALID_PRIVATE_KEY)
    }
  }

  // 3. Neither available
  if (json) {
    console.log(
      JSON.stringify({
        error: 'No private key provided. Use --private-key or set SEQUENCE_PASSPHRASE env var',
        code: EXIT_CODES.INVALID_PRIVATE_KEY,
      })
    )
  } else {
    console.error(chalk.red('✖ No private key available'))
    console.error(
      chalk.gray('Provide --private-key or set SEQUENCE_PASSPHRASE env var with a stored key')
    )
  }
  process.exit(EXIT_CODES.INVALID_PRIVATE_KEY)
}

// Exit codes
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NOT_LOGGED_IN: 10,
  INVALID_PRIVATE_KEY: 11,
  INSUFFICIENT_FUNDS: 20,
  NO_PROJECTS_FOUND: 30,
  PROJECT_NOT_FOUND: 31,
  API_ERROR: 40,
} as const
