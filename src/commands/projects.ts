import { Command } from 'commander'
import chalk from 'chalk'
import { Session } from '@0xsequence/auth'
import { listProjects, createProject, getProject, getDefaultAccessKey } from '../lib/api.js'
import { isLoggedIn, EXIT_CODES } from '../lib/config.js'
import { isValidPrivateKey } from '../lib/wallet.js'

export const projectsCommand = new Command('projects')
  .description('Manage Sequence Builder projects')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .action(async (options) => {
    // Default action: list projects
    await listProjectsAction(options)
  })

// Subcommand: list projects
projectsCommand
  .command('list')
  .description('List all projects')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .action(async (options) => {
    await listProjectsAction(options)
  })

// Subcommand: create project
projectsCommand
  .command('create [name]')
  .description('Create a new project')
  .option('-k, --private-key <key>', 'Private key to derive Sequence wallet address')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .option('--chain-ids <ids>', 'Comma-separated list of chain IDs')
  .action(async (name, options) => {
    await createProjectAction(name, options)
  })

// Subcommand: get project details
projectsCommand
  .command('get <id>')
  .description('Get details for a specific project')
  .option('--json', 'Output in JSON format')
  .option('--env <environment>', 'Environment to use (prod, dev)', 'prod')
  .option('--api-url <url>', 'Custom API URL')
  .action(async (id, options) => {
    await getProjectAction(parseInt(id, 10), options)
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

async function listProjectsAction(options: { json?: boolean; env?: string; apiUrl?: string }) {
  const { json, env, apiUrl } = options

  checkAuth(!!json)

  try {
    if (!json) {
      console.log(chalk.gray('Fetching projects...'))
    }

    const response = await listProjects({ env, apiUrl })

    if (!response.projects || response.projects.length === 0) {
      if (json) {
        console.log(JSON.stringify({ projects: [] }))
      } else {
        console.log('')
        console.log(chalk.yellow('No projects found.'))
        console.log(chalk.gray('Create one with: sequence-builder projects create "My Project"'))
        console.log('')
      }
      return
    }

    if (json) {
      console.log(JSON.stringify({ projects: response.projects }, null, 2))
      return
    }

    console.log('')
    console.log(chalk.white.bold('Your Projects:'))
    console.log('')

    for (const project of response.projects) {
      console.log(chalk.cyan(`  ${project.id}`), chalk.white(project.name))
    }

    console.log('')
    console.log(chalk.gray('Run `sequence-builder apikeys <project-id>` to view API keys'))
    console.log('')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (json) {
      console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.API_ERROR }))
    } else {
      console.error(chalk.red('✖ Failed to list projects:'), errorMessage)
    }
    process.exit(EXIT_CODES.API_ERROR)
  }
}

async function createProjectAction(
  name: string | undefined,
  options: { json?: boolean; env?: string; apiUrl?: string; chainIds?: string; privateKey?: string }
) {
  const { json, env, apiUrl, chainIds, privateKey } = options

  checkAuth(!!json)

  try {
    // Parse chain IDs if provided
    const parsedChainIds = chainIds
      ? chainIds.split(',').map((id) => parseInt(id.trim(), 10))
      : undefined

    // Generate a default name if not provided
    const projectName = name || `Project ${Date.now()}`

    if (!json) {
      console.log(chalk.gray(`Creating project "${projectName}"...`))
    }

    const response = await createProject(projectName, {
      chainIds: parsedChainIds,
      env,
      apiUrl,
    })

    if (!response.project) {
      if (json) {
        console.log(
          JSON.stringify({ error: 'Failed to create project', code: EXIT_CODES.API_ERROR })
        )
      } else {
        console.error(chalk.red('✖ Failed to create project'))
      }
      process.exit(EXIT_CODES.API_ERROR)
    }

    // Get the default access key for the new project
    let accessKey: string | undefined
    try {
      const keyResponse = await getDefaultAccessKey(response.project.id, { env, apiUrl })
      accessKey = keyResponse.accessKey?.accessKey
    } catch {
      // Access key fetch failed, but project was created
    }

    // Derive Sequence wallet address if private key is provided
    let sequenceWalletAddress: string | undefined
    if (privateKey && accessKey && isValidPrivateKey(privateKey)) {
      try {
        const normalizedKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey
        const session = await Session.singleSigner({
          signer: normalizedKey,
          projectAccessKey: accessKey,
        })
        sequenceWalletAddress = session.account.address
      } catch {
        // Failed to derive wallet address
      }
    }

    if (json) {
      console.log(
        JSON.stringify(
          {
            project: response.project,
            accessKey,
            sequenceWalletAddress,
          },
          null,
          2
        )
      )
      return
    }

    console.log('')
    console.log(chalk.green.bold('✓ Project created successfully!'))
    console.log('')
    console.log(chalk.white('Project ID:       '), chalk.cyan(response.project.id))
    console.log(chalk.white('Name:             '), chalk.white(response.project.name))
    if (accessKey) {
      console.log(chalk.white('Access Key:       '), chalk.yellow(accessKey))
    }
    if (sequenceWalletAddress) {
      console.log(chalk.white('Sequence Wallet:  '), chalk.cyan(sequenceWalletAddress))
      console.log('')
      console.log(chalk.yellow('Send tokens to the Sequence Wallet address for transfers.'))
    }
    console.log('')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (json) {
      console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.API_ERROR }))
    } else {
      console.error(chalk.red('✖ Failed to create project:'), errorMessage)
    }
    process.exit(EXIT_CODES.API_ERROR)
  }
}

async function getProjectAction(
  projectId: number,
  options: { json?: boolean; env?: string; apiUrl?: string }
) {
  const { json, env, apiUrl } = options

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
      console.log(chalk.gray('Fetching project...'))
    }

    const response = await getProject(projectId, { env, apiUrl })

    if (!response.project) {
      if (json) {
        console.log(
          JSON.stringify({ error: 'Project not found', code: EXIT_CODES.PROJECT_NOT_FOUND })
        )
      } else {
        console.error(chalk.red('✖ Project not found'))
      }
      process.exit(EXIT_CODES.PROJECT_NOT_FOUND)
    }

    if (json) {
      console.log(JSON.stringify({ project: response.project }, null, 2))
      return
    }

    console.log('')
    console.log(chalk.white.bold('Project Details:'))
    console.log('')
    console.log(chalk.white('ID:          '), chalk.cyan(response.project.id))
    console.log(chalk.white('Name:        '), chalk.white(response.project.name))
    console.log(chalk.white('Owner:       '), chalk.gray(response.project.ownerAddress))
    if (response.project.chainIds?.length) {
      console.log(chalk.white('Chain IDs:   '), chalk.gray(response.project.chainIds.join(', ')))
    }
    console.log('')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (json) {
      console.log(JSON.stringify({ error: errorMessage, code: EXIT_CODES.API_ERROR }))
    } else {
      console.error(chalk.red('✖ Failed to get project:'), errorMessage)
    }
    process.exit(EXIT_CODES.API_ERROR)
  }
}
