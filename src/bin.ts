#!/usr/bin/env node

import {Command} from "commander";
import chalk from "chalk";

import {createWalletCommand} from "./commands/create-wallet.js";
import {loginCommand} from "./commands/login.js";
import {projectsCommand} from "./commands/projects.js";
import {apikeysCommand} from "./commands/apikeys.js";
import {transferCommand} from "./commands/transfer.js";
import {walletInfoCommand} from "./commands/wallet-info.js";

const program = new Command();

program
  .name("sequence-builder")
  .description("CLI for Sequence Builder - designed for AI agents and automation")
  .version("0.1.0");

// Register commands
program.addCommand(createWalletCommand);
program.addCommand(walletInfoCommand);
program.addCommand(loginCommand);
program.addCommand(projectsCommand);
program.addCommand(apikeysCommand);
program.addCommand(transferCommand);

// Note: --json, --env, and --api-url are defined on each subcommand
// This allows subcommands to properly receive and handle these options

// Error handling
program.exitOverride((err) => {
  if (err.code === "commander.help" || err.code === "commander.helpDisplayed") {
    process.exit(0);
  }
  if (err.code === "commander.version") {
    process.exit(0);
  }
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});

program.parse();
