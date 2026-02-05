import {Command} from "commander";
import chalk from "chalk";
import {Session} from "@0xsequence/auth";
import {EXIT_CODES} from "../lib/config.js";
import {isValidPrivateKey, getAddressFromPrivateKey} from "../lib/wallet.js";

export const walletInfoCommand = new Command("wallet-info")
  .description("Show wallet addresses (EOA and Sequence smart wallet)")
  .requiredOption("-k, --private-key <key>", "Your wallet private key")
  .requiredOption("-a, --access-key <key>", "Project access key")
  .option("--json", "Output in JSON format")
  .action(async (options) => {
    const {privateKey, accessKey, json} = options;

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

      const normalizedPrivateKey = privateKey.startsWith("0x")
        ? privateKey
        : "0x" + privateKey;

      // Get EOA address
      const eoaAddress = getAddressFromPrivateKey(normalizedPrivateKey);

      if (!json) {
        console.log("");
        console.log(chalk.gray("Deriving Sequence wallet address..."));
      }

      // Create Sequence session to get smart wallet address
      const session = await Session.singleSigner({
        signer: normalizedPrivateKey,
        projectAccessKey: accessKey
      });

      const sequenceWalletAddress = session.account.address;

      if (json) {
        console.log(
          JSON.stringify(
            {
              eoaAddress,
              sequenceWalletAddress
            },
            null,
            2
          )
        );
        return;
      }

      console.log("");
      console.log(chalk.white.bold("Wallet Addresses:"));
      console.log("");
      console.log(chalk.white("EOA Address:          "), chalk.gray(eoaAddress));
      console.log(
        chalk.white("Sequence Wallet:      "),
        chalk.cyan(sequenceWalletAddress)
      );
      console.log("");
      console.log(chalk.yellow.bold("Important:"));
      console.log(
        chalk.yellow(
          "  Send tokens to the Sequence Wallet address for use with the transfer command."
        )
      );
      console.log(
        chalk.yellow("  The Sequence Wallet can pay gas fees with ERC20 tokens (no ETH needed).")
      );
      console.log("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (json) {
        console.log(
          JSON.stringify({error: errorMessage, code: EXIT_CODES.GENERAL_ERROR})
        );
      } else {
        console.error(chalk.red("✖ Failed to get wallet info:"), errorMessage);
      }
      process.exit(EXIT_CODES.GENERAL_ERROR);
    }
  });
