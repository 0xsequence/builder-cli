import { getApiUrl, getValidJwtToken } from './config.js'

export interface AuthState {
  jwtToken: string
  expiresAt: string
  user?: {
    address: string
    email?: string
  }
}

export interface GetAuthTokenResponse {
  ok: boolean
  auth: AuthState
}

export interface Project {
  id: number
  name: string
  ownerAddress: string
  chainIds?: number[]
}

export interface CreateProjectResponse {
  project: Project
}

export interface ListProjectsResponse {
  page: { page: number; pageSize: number; more: boolean }
  projects: Project[]
}

export interface AccessKey {
  accessKey: string
  projectID: number
  displayName: string
  active: boolean
  default: boolean
}

export interface GetDefaultAccessKeyResponse {
  accessKey: AccessKey
}

export interface ListAccessKeysResponse {
  accessKeys: AccessKey[]
}

/**
 * Make an API request to the Builder API
 */
async function apiRequest<T>(
  endpoint: string,
  body: object,
  options?: { env?: string; apiUrl?: string; jwtToken?: string }
): Promise<T> {
  const baseUrl = getApiUrl(options)
  const url = `${baseUrl}/rpc/Builder/${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const jwt = options?.jwtToken || getValidJwtToken()
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Make an API request to the QuotaControl API
 */
async function quotaApiRequest<T>(
  endpoint: string,
  body: object,
  options?: { env?: string; apiUrl?: string; jwtToken?: string }
): Promise<T> {
  const baseUrl = getApiUrl(options)
  const url = `${baseUrl}/rpc/QuotaControl/${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const jwt = options?.jwtToken || getValidJwtToken()
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Authenticate with ETHAuth proof and get JWT token
 */
export async function getAuthToken(
  ethauthProof: string,
  email?: string,
  options?: { env?: string; apiUrl?: string }
): Promise<GetAuthTokenResponse> {
  return apiRequest<GetAuthTokenResponse>('GetAuthToken', { ethauthProof, email }, options)
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  options?: { chainIds?: number[]; env?: string; apiUrl?: string }
): Promise<CreateProjectResponse> {
  return apiRequest<CreateProjectResponse>(
    'CreateProject',
    {
      name,
      options: options?.chainIds ? { chainIds: options.chainIds } : undefined,
    },
    options
  )
}

/**
 * List all projects for the authenticated user
 */
export async function listProjects(options?: {
  env?: string
  apiUrl?: string
}): Promise<ListProjectsResponse> {
  return apiRequest<ListProjectsResponse>('ListProjects', {}, options)
}

/**
 * Get a specific project by ID
 */
export async function getProject(
  projectId: number,
  options?: { env?: string; apiUrl?: string }
): Promise<{ project: Project }> {
  return apiRequest<{ project: Project }>('GetProject', { id: projectId }, options)
}

/**
 * Get the default access key for a project
 */
export async function getDefaultAccessKey(
  projectId: number,
  options?: { env?: string; apiUrl?: string }
): Promise<GetDefaultAccessKeyResponse> {
  return quotaApiRequest<GetDefaultAccessKeyResponse>(
    'GetDefaultAccessKey',
    { projectID: projectId },
    options
  )
}

/**
 * List all access keys for a project
 */
export async function listAccessKeys(
  projectId: number,
  options?: { env?: string; apiUrl?: string }
): Promise<ListAccessKeysResponse> {
  return quotaApiRequest<ListAccessKeysResponse>(
    'ListAccessKeys',
    { projectID: projectId },
    options
  )
}
