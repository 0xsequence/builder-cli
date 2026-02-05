import {Command} from "commander";
import chalk from "chalk";
import {ethers} from "ethers";
import {Session} from "@0xsequence/auth";
import {isLoggedIn, EXIT_CODES} from "../lib/config.js";
import {isValidPrivateKey} from "../lib/wallet.js";

// ERC20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export const transferCommand = new Command("transfer")
  .description("Send an ERC20 token transfer")
  .requiredOption("-k, --private-key <key>", "Your wallet private key")
  .requiredOption("-a, --access-key <key>", "Project access key")
  .requiredOption("-t, --token <address>", "ERC20 token contract address")
  .requiredOption("-r, --recipient <address>", "Recipient address")
  .requiredOption("-m, --amount <amount>", 'Amount to send (in token units, e.g., "1.5")')
  .requiredOption("-c, --chain-id <chainId>", "Chain ID (e.g., 137 for Polygon)")
  .option("--json", "Output in JSON format")
  .action(async (options) => {
    const {
      privateKey,
      accessKey,
      token,
      recipient,
      amount,
      chainId: chainIdStr,
      json
    } = options;

    // Track wallet address for error reporting
    let walletAddress: string | undefined;

    try {
      // Validate private key format
      if (!isValidPrivateKey(privateKey)) {
        if (json) {
          console.log(
            JSON.stringify({
              error: "Invalid private key format",
              code: EXIT_CODES.INVALID_PRIVATE_KEY
            })
          );
        } else {
          console.error(chalk.red("✖ Invalid private key format"));
        }
        process.exit(EXIT_CODES.INVALID_PRIVATE_KEY);
      }

      // Validate addresses
      if (!ethers.isAddress(token)) {
        if (json) {
          console.log(
            JSON.stringify({
              error: "Invalid token address",
              code: EXIT_CODES.GENERAL_ERROR
            })
          );
        } else {
          console.error(chalk.red("✖ Invalid token address"));
        }
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }

      if (!ethers.isAddress(recipient)) {
        if (json) {
          console.log(
            JSON.stringify({
              error: "Invalid recipient address",
              code: EXIT_CODES.GENERAL_ERROR
            })
          );
        } else {
          console.error(chalk.red("✖ Invalid recipient address"));
        }
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }

      const chainId = parseInt(chainIdStr, 10);
      if (isNaN(chainId)) {
        if (json) {
          console.log(
            JSON.stringify({error: "Invalid chain ID", code: EXIT_CODES.GENERAL_ERROR})
          );
        } else {
          console.error(chalk.red("✖ Invalid chain ID"));
        }
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }

      const normalizedPrivateKey = privateKey.startsWith("0x")
        ? privateKey
        : "0x" + privateKey;

      if (!json) {
        console.log("");
        console.log(chalk.gray("Creating Sequence session..."));
      }

      // Create Sequence session
      const session = await Session.singleSigner({
        signer: normalizedPrivateKey,
        projectAccessKey: accessKey
      });

      const signer = session.account.getSigner(chainId);
      walletAddress = session.account.address;

      if (!json) {
        console.log(chalk.gray("Wallet address:"), chalk.cyan(walletAddress));
        console.log(chalk.gray("Preparing transaction..."));
      }

      // Create contract instance
      const contract = new ethers.Contract(token, ERC20_ABI, signer as any);

      // Get token decimals and symbol
      let decimals = 18;
      let symbol = "TOKEN";
      try {
        decimals = await contract.decimals();
        symbol = await contract.symbol();
      } catch {
        // Use defaults if we can't fetch
      }

      // Parse amount to token units
      const amountParsed = ethers.parseUnits(amount, decimals);

      if (!json) {
        console.log(chalk.gray("Token:"), chalk.white(`${symbol} (${token})`));
        console.log(chalk.gray("Sending:"), chalk.white(`${amount} ${symbol}`));
        console.log(chalk.gray("To:"), chalk.cyan(recipient));
        console.log(chalk.gray("Chain ID:"), chalk.white(chainId));
        console.log("");
        console.log(chalk.gray("Sending transaction..."));
      }

      // Prepare the transaction
      const txData = contract.interface.encodeFunctionData("transfer", [
        recipient,
        amountParsed
      ]);

      const transaction = {
        to: token,
        data: txData
      };

      // Send the transaction
      const txResponse = await signer.sendTransaction(transaction);

      if (!json) {
        console.log(chalk.gray("Waiting for confirmation..."));
      }

      // Wait for the transaction to be mined
      const receipt = await txResponse.wait();

      if (!receipt) {
        if (json) {
          console.log(
            JSON.stringify({error: "Transaction failed", code: EXIT_CODES.GENERAL_ERROR})
          );
        } else {
          console.error(chalk.red("✖ Transaction failed"));
        }
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }

      if (json) {
        console.log(
          JSON.stringify(
            {
              success: true,
              transactionHash: txResponse.hash,
              from: walletAddress,
              to: recipient,
              token,
              amount,
              symbol,
              chainId
            },
            null,
            2
          )
        );
        return;
      }

      console.log("");
      console.log(chalk.green.bold("✓ Transfer successful!"));
      console.log("");
      console.log(chalk.white("Transaction Hash:"), chalk.cyan(txResponse.hash));
      console.log(chalk.white("From:            "), chalk.gray(walletAddress));
      console.log(chalk.white("To:              "), chalk.gray(recipient));
      console.log(chalk.white("Amount:          "), chalk.white(`${amount} ${symbol}`));
      console.log("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for common errors
      if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
        if (json) {
          console.log(
            JSON.stringify({
              error: "Insufficient balance",
              walletAddress,
              code: EXIT_CODES.INSUFFICIENT_FUNDS
            })
          );
        } else {
          console.error(chalk.red("✖ Insufficient balance for transfer or gas fees"));
          if (walletAddress) {
            console.error(chalk.gray("Wallet address:"), chalk.cyan(walletAddress));
          }
          console.error(
            chalk.gray(
              "Make sure your wallet has enough tokens and native currency for gas"
            )
          );
        }
        process.exit(EXIT_CODES.INSUFFICIENT_FUNDS);
      }

      if (json) {
        console.log(
          JSON.stringify({error: errorMessage, code: EXIT_CODES.GENERAL_ERROR})
        );
      } else {
        console.error(chalk.red("✖ Transfer failed:"), errorMessage);
      }
      process.exit(EXIT_CODES.GENERAL_ERROR);
    }
  });
