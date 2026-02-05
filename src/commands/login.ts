import {Command} from "commander";
import chalk from "chalk";
import {generateEthAuthProof} from "../lib/ethauth.js";
import {getAuthToken} from "../lib/api.js";
import {updateConfig, EXIT_CODES, isLoggedIn, getValidJwtToken} from "../lib/config.js";
import {isValidPrivateKey, getAddressFromPrivateKey} from "../lib/wallet.js";

export const loginCommand = new Command("login")
  .description("Authenticate with Sequence Builder using your private key")
  .requiredOption("-k, --private-key <key>", "Your wallet private key")
  .option("-e, --email <email>", "Email address to associate with your account")
  .option("--json", "Output in JSON format")
  .option("--env <environment>", "Environment to use (prod, dev)", "prod")
  .option("--api-url <url>", "Custom API URL")
  .action(async (options) => {
    try {
      const {privateKey, email, json, env, apiUrl} = options;

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
          console.error(
            chalk.gray(
              "Private key should be a 64-character hex string (with or without 0x prefix)"
            )
          );
        }
        process.exit(EXIT_CODES.INVALID_PRIVATE_KEY);
      }

      const address = getAddressFromPrivateKey(privateKey);

      if (!json) {
        console.log("");
        console.log(chalk.gray("Authenticating wallet:"), chalk.cyan(address));
        console.log(chalk.gray("Generating ETHAuth proof..."));
      }

      // Generate ETHAuth proof
      const proofString = await generateEthAuthProof(privateKey);

      if (!json) {
        console.log(chalk.gray("Calling GetAuthToken API..."));
      }

      // Call GetAuthToken API
      const response = await getAuthToken(proofString, email, {env, apiUrl});

      if (!response.ok || !response.auth?.jwtToken) {
        if (json) {
          console.log(
            JSON.stringify({error: "Authentication failed", code: EXIT_CODES.API_ERROR})
          );
        } else {
          console.error(chalk.red("✖ Authentication failed"));
        }
        process.exit(EXIT_CODES.API_ERROR);
      }

      // Store JWT token in config
      updateConfig({
        jwtToken: response.auth.jwtToken,
        jwtExpiresAt: response.auth.expiresAt,
        environment: env as "prod" | "dev",
        apiUrl: apiUrl
      });

      if (json) {
        console.log(
          JSON.stringify(
            {
              success: true,
              address,
              expiresAt: response.auth.expiresAt
            },
            null,
            2
          )
        );
        return;
      }

      console.log("");
      console.log(chalk.green.bold("✓ Successfully authenticated!"));
      console.log("");
      console.log(chalk.white("Address:   "), chalk.cyan(address));
      console.log(chalk.white("Expires:   "), chalk.gray(response.auth.expiresAt));
      console.log("");
      console.log(chalk.gray("You can now use commands like:"));
      console.log(chalk.gray("  sequence-builder projects"));
      console.log(chalk.gray('  sequence-builder projects create "My Project"'));
      console.log("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (options.json) {
        console.log(JSON.stringify({error: errorMessage, code: EXIT_CODES.API_ERROR}));
      } else {
        console.error(chalk.red("✖ Login failed:"), errorMessage);
      }
      process.exit(EXIT_CODES.API_ERROR);
    }
  });

// Also export a status command to check current login status
export const statusCommand = new Command("status")
  .description("Check current authentication status")
  .option("--json", "Output in JSON format")
  .action(async (options) => {
    const loggedIn = isLoggedIn();

    if (options.json) {
      console.log(JSON.stringify({loggedIn}));
      return;
    }

    if (loggedIn) {
      console.log(chalk.green("✓ You are logged in"));
    } else {
      console.log(chalk.yellow("✖ You are not logged in"));
      console.log(chalk.gray("Run: sequence-builder login -k <your-private-key>"));
    }
  });
