import {ethers} from "ethers";
import {Session} from "@0xsequence/auth";
import {networks, ChainId} from "@0xsequence/network";

export interface WalletInfo {
  privateKey: string;
  address: string;
}

/**
 * Generate a new random EOA wallet
 */
export function generateWallet(): WalletInfo {
  const wallet = ethers.Wallet.createRandom();
  return {
    privateKey: wallet.privateKey,
    address: wallet.address
  };
}

/**
 * Validate a private key format
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    if (!privateKey.startsWith("0x")) {
      privateKey = "0x" + privateKey;
    }
    if (privateKey.length !== 66) {
      return false;
    }
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get wallet address from private key
 */
export function getAddressFromPrivateKey(privateKey: string): string {
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Get ethers Wallet instance from private key
 */
export function getWallet(privateKey: string): ethers.Wallet {
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }
  return new ethers.Wallet(privateKey);
}

/**
 * Create a Sequence session from a private key
 * This derives the smart contract wallet address
 */
export async function createSession(
  privateKey: string,
  accessKey: string,
  chainId?: number
): Promise<Session> {
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  const session = await Session.singleSigner({
    signer: privateKey,
    projectAccessKey: accessKey
  });

  return session;
}

/**
 * Get the Sequence smart wallet address from a private key
 */
export async function getSequenceWalletAddress(
  privateKey: string,
  accessKey: string
): Promise<string> {
  const session = await createSession(privateKey, accessKey);
  return session.account.address;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkConfig(chainId: number) {
  return networks[chainId as ChainId];
}
