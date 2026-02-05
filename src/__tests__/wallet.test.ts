import { describe, it, expect } from 'vitest'
import {
  generateWallet,
  isValidPrivateKey,
  getAddressFromPrivateKey,
  getWallet,
} from '../lib/wallet.js'

describe('wallet utilities', () => {
  describe('generateWallet', () => {
    it('should generate a wallet with privateKey and address', () => {
      const wallet = generateWallet()

      expect(wallet).toHaveProperty('privateKey')
      expect(wallet).toHaveProperty('address')
    })

    it('should generate a valid private key format', () => {
      const wallet = generateWallet()

      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should generate a valid address format', () => {
      const wallet = generateWallet()

      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should generate unique wallets each time', () => {
      const wallet1 = generateWallet()
      const wallet2 = generateWallet()

      expect(wallet1.privateKey).not.toBe(wallet2.privateKey)
      expect(wallet1.address).not.toBe(wallet2.address)
    })
  })

  describe('isValidPrivateKey', () => {
    it('should return true for valid private key with 0x prefix', () => {
      const validKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      expect(isValidPrivateKey(validKey)).toBe(true)
    })

    it('should return true for valid private key without 0x prefix', () => {
      const validKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      expect(isValidPrivateKey(validKey)).toBe(true)
    })

    it('should return false for key that is too short', () => {
      expect(isValidPrivateKey('0x1234')).toBe(false)
    })

    it('should return false for key that is too long', () => {
      const longKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'
      expect(isValidPrivateKey(longKey)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidPrivateKey('')).toBe(false)
    })

    it('should return false for invalid hex characters', () => {
      const invalidKey = '0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      expect(isValidPrivateKey(invalidKey)).toBe(false)
    })

    it('should validate a generated wallet private key', () => {
      const wallet = generateWallet()
      expect(isValidPrivateKey(wallet.privateKey)).toBe(true)
    })
  })

  describe('getAddressFromPrivateKey', () => {
    it('should derive address from private key with 0x prefix', () => {
      // Known test vector
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      const expectedAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

      expect(getAddressFromPrivateKey(privateKey)).toBe(expectedAddress)
    })

    it('should derive address from private key without 0x prefix', () => {
      const privateKey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      const expectedAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

      expect(getAddressFromPrivateKey(privateKey)).toBe(expectedAddress)
    })

    it('should return consistent address for same private key', () => {
      const wallet = generateWallet()
      const address1 = getAddressFromPrivateKey(wallet.privateKey)
      const address2 = getAddressFromPrivateKey(wallet.privateKey)

      expect(address1).toBe(address2)
      expect(address1).toBe(wallet.address)
    })
  })

  describe('getWallet', () => {
    it('should return an ethers Wallet instance', () => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      const wallet = getWallet(privateKey)

      expect(wallet).toBeDefined()
      expect(wallet.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    })

    it('should work with private key without 0x prefix', () => {
      const privateKey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      const wallet = getWallet(privateKey)

      expect(wallet.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    })
  })
})
