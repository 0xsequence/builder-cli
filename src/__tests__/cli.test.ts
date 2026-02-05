import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

// Helper to run CLI commands
function runCli(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`pnpm dev ${args}`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { stdout, exitCode: 0 }
  } catch (error: any) {
    return {
      stdout: error.stdout || error.stderr || error.message,
      exitCode: error.status || 1,
    }
  }
}

describe('CLI commands', () => {
  describe('--help', () => {
    it('should display main help', () => {
      const result = runCli('--help')
      expect(result.stdout).toContain('CLI for Sequence Builder')
      expect(result.stdout).toContain('create-wallet')
      expect(result.stdout).toContain('login')
      expect(result.stdout).toContain('projects')
      expect(result.stdout).toContain('apikeys')
      expect(result.stdout).toContain('transfer')
      expect(result.stdout).toContain('indexer')
      expect(result.stdout).toContain('wallet-info')
    })
  })

  describe('create-wallet', () => {
    it('should generate a new wallet', () => {
      const result = runCli('create-wallet')
      expect(result.stdout).toContain('Wallet created successfully')
      expect(result.stdout).toContain('Private Key:')
      expect(result.stdout).toContain('Address:')
    })

    it('should output JSON format with --json flag', () => {
      const result = runCli('create-wallet --json')
      const output = result.stdout.trim().split('\n').slice(-4).join('\n') // Get JSON part
      expect(() => JSON.parse(output)).not.toThrow()
      const json = JSON.parse(output)
      expect(json).toHaveProperty('privateKey')
      expect(json).toHaveProperty('address')
      expect(json.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(json.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('wallet-info', () => {
    it('should show help without private key', () => {
      const result = runCli('wallet-info --help')
      expect(result.stdout).toContain('private-key')
      expect(result.stdout).toContain('access-key')
    })

    it('should require private key', () => {
      const result = runCli('wallet-info')
      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('login', () => {
    it('should show help', () => {
      const result = runCli('login --help')
      expect(result.stdout).toContain('private-key')
      expect(result.stdout).toContain('Authenticate')
    })

    it('should fail without required private key', () => {
      const result = runCli('login')
      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('projects', () => {
    it('should show subcommands in help', () => {
      const result = runCli('projects --help')
      expect(result.stdout).toContain('list')
      expect(result.stdout).toContain('get')
      expect(result.stdout).toContain('create')
    })
  })

  describe('apikeys', () => {
    it('should show subcommands in help', () => {
      const result = runCli('apikeys --help')
      expect(result.stdout).toContain('list')
      expect(result.stdout).toContain('default')
    })
  })

  describe('transfer', () => {
    it('should show help', () => {
      const result = runCli('transfer --help')
      expect(result.stdout).toContain('private-key')
      expect(result.stdout).toContain('access-key')
      expect(result.stdout).toContain('recipient')
      expect(result.stdout).toContain('amount')
      expect(result.stdout).toContain('token')
      expect(result.stdout).toContain('chain-id')
    })
  })

  describe('indexer', () => {
    it('should show subcommands in help', () => {
      const result = runCli('indexer --help')
      expect(result.stdout).toContain('balances')
      expect(result.stdout).toContain('native-balance')
      expect(result.stdout).toContain('history')
      expect(result.stdout).toContain('token-info')
    })

    it('should show balances help', () => {
      const result = runCli('indexer balances --help')
      expect(result.stdout).toContain('access-key')
      expect(result.stdout).toContain('chain-id')
      expect(result.stdout).toContain('address')
    })

    it('should show native-balance help', () => {
      const result = runCli('indexer native-balance --help')
      expect(result.stdout).toContain('access-key')
      expect(result.stdout).toContain('chain-id')
      expect(result.stdout).toContain('address')
    })

    it('should show history help', () => {
      const result = runCli('indexer history --help')
      expect(result.stdout).toContain('access-key')
      expect(result.stdout).toContain('chain-id')
      expect(result.stdout).toContain('address')
    })

    it('should show token-info help', () => {
      const result = runCli('indexer token-info --help')
      expect(result.stdout).toContain('access-key')
      expect(result.stdout).toContain('chain-id')
    })
  })
})
