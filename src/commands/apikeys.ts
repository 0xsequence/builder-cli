import { Command } from 'commander'
import chalk from 'chalk'
import { listAccessKeys, getDefaultAccessKey } from '../lib/api.js'
import { isLoggedIn, EXIT_CODES } from '../lib/config.js'

export const apikeysCommand = new Command('apikeys')
  .description('Manage API keys for a project')
  .argument('<project-id>', 'Project ID')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .action(async (projectIdStr, options) => {
    await listApiKeysAction(projectIdStr, options)
  })

// Subcommand: list all keys
apikeysCommand
  .command('list <project-id>')
  .description('List all API keys for a project')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .action(async (projectIdStr, options) => {
    await listApiKeysAction(projectIdStr, options)
  })

// Subcommand: get default key
apikeysCommand
  .command('default <project-id>')
  .description('Get the default API key for a project')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .action(async (projectIdStr, options) => {
    await getDefaultKeyAction(projectIdStr, options)
  })

function checkAuth(json: boolean): void {
  if (!isLoggedIn()) {
    if (json) {
      console.log(JSON.stringify({ error: 'Not logged in', code: EXIT_CODES.NOT_LOGGED_IN }))
    } else {
      console.error(chalk.red('✖ Not logged in'))
      console.error(chalk.gray('Run: sequence-builder login -k <your-private-key>'))
    }
    process.exit(EXIT_CODES.NOT_LOGGED_IN)
  }
}

async function listApiKeysAction(
  projectIdStr: string,
  options: { json?: boolean; env?: string; apiUrl?: string }
) {
  const { json, env, apiUrl } = options
  const projectId = parseInt(projectIdStr, 10)

  checkAuth(!!json)

  if (isNaN(projectId)) {
    if (json) {
      console.log(
        JSON.stringify({ error: 'Invalid project ID', code: EXIT_CODES.PROJECT_NOT_FOUND })
      )
    } else {
      console.error(chalk.red('✖ Invalid project ID'))
    }
    process.exit(EXIT_CODES.PROJECT_NOT_FOUND)
  }

  try {
    if (!json) {
      console.log(chalk.gray('Fetching API keys...'))
    }

    const response = await listAccessKeys(projectId, { env, apiUrl })

    if (!response.accessKeys || response.accessKeys.length === 0) {
      if (json) {
        console.log(JSON.stringify({ accessKeys: [] }))
      } else {
        console.log('')
        console.log(chalk.yellow('No API keys found for this project.'))
        console.log('')
      }
      return
    }

    if (json) {
      console.log(JSON.stringify({ accessKeys: response.accessKeys }, null, 2))
      return
    }

    console.log('')
    console.log(chalk.white.bold(`API Keys for Project ${projectId}:`))
    console.log('')

    for (const key of response.accessKeys) {
      const statusIcon = key.active ? chalk.green('●') : chalk.red('○')
      const defaultBadge = key.default ? chalk.cyan(' [default]') : ''
      console.log(`  ${statusIcon} ${chalk.yellow(key.accessKey)}${defaultBadge}`)
      console.log(chalk.gray(`    Name: ${key.displayName}`))
    }

    console.log('')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (json) {
      console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.API_ERROR }))
    } else {
      console.error(chalk.red('✖ Failed to list API keys:'), errorMessage)
    }
    process.exit(EXIT_CODES.API_ERROR)
  }
}

async function getDefaultKeyAction(
  projectIdStr: string,
  options: { json?: boolean; env?: string; apiUrl?: string }
) {
  const { json, env, apiUrl } = options
  const projectId = parseInt(projectIdStr, 10)

  checkAuth(!!json)

  if (isNaN(projectId)) {
    if (json) {
      console.log(
        JSON.stringify({ error: 'Invalid project ID', code: EXIT_CODES.PROJECT_NOT_FOUND })
      )
    } else {
      console.error(chalk.red('✖ Invalid project ID'))
    }
    process.exit(EXIT_CODES.PROJECT_NOT_FOUND)
  }

  try {
    if (!json) {
      console.log(chalk.gray('Fetching default API key...'))
    }

    const response = await getDefaultAccessKey(projectId, { env, apiUrl })

    if (!response.accessKey) {
      if (json) {
        console.log(
          JSON.stringify({
            error: 'No default key found',
            code: EXIT_CODES.PROJECT_NOT_FOUND,
          })
        )
      } else {
        console.log('')
        console.log(chalk.yellow('No default API key found for this project.'))
        console.log('')
      }
      return
    }

    if (json) {
      console.log(JSON.stringify({ accessKey: response.accessKey }, null, 2))
      return
    }

    console.log('')
    console.log(chalk.green.bold('✓ Default API Key:'))
    console.log('')
    console.log(chalk.white('Key:         '), chalk.yellow(response.accessKey.accessKey))
    console.log(chalk.white('Name:        '), chalk.gray(response.accessKey.displayName))
    console.log(
      chalk.white('Active:      '),
      response.accessKey.active ? chalk.green('Yes') : chalk.red('No')
    )
    console.log('')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (json) {
      console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.API_ERROR }))
    } else {
      console.error(chalk.red('✖ Failed to get default API key:'), errorMessage)
    }
    process.exit(EXIT_CODES.API_ERROR)
  }
}
