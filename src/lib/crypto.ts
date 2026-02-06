import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'crypto'

export interface EncryptedData {
  encrypted: string
  salt: string
  iv: string
}

/**
 * Encrypt a private key using AES-256-GCM with a passphrase.
 * Key is derived from passphrase using scrypt.
 */
export function encryptPrivateKey(privateKey: string, passphrase: string): EncryptedData {
  const salt = randomBytes(32)
  const iv = randomBytes(16)
  const key = scryptSync(passphrase, salt, 32)

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(privateKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return {
    encrypted: encrypted + ':' + authTag,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
  }
}

/**
 * Decrypt a private key using AES-256-GCM with a passphrase.
 */
export function decryptPrivateKey(data: EncryptedData, passphrase: string): string {
  const salt = Buffer.from(data.salt, 'hex')
  const iv = Buffer.from(data.iv, 'hex')
  const key = scryptSync(passphrase, salt, 32)

  const [encryptedHex, authTagHex] = data.encrypted.split(':')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
