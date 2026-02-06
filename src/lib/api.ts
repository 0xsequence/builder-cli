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
 * Structured API error with status code, rate-limit info, and parsed details
 */
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly retryAfterSeconds: number | null
  public readonly errorBody: string
  public readonly isRateLimited: boolean
  public readonly isPermissionDenied: boolean
  public readonly isUnauthorized: boolean

  constructor(statusCode: number, errorBody: string, retryAfter: number | null) {
    const label =
      statusCode === 429
        ? 'Rate Limited'
        : statusCode === 403
          ? 'Permission Denied'
          : statusCode === 401
            ? 'Unauthorized'
            : `API Error`

    let detail = `${label} (${statusCode})`
    if (errorBody) {
      detail += `: ${errorBody}`
    }
    if (retryAfter !== null) {
      detail += ` — retry after ${retryAfter}s`
    }

    super(detail)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.retryAfterSeconds = retryAfter
    this.errorBody = errorBody
    this.isRateLimited = statusCode === 429
    this.isPermissionDenied = statusCode === 403
    this.isUnauthorized = statusCode === 401
  }
}

/**
 * Check whether an error is an ApiError (useful in catch blocks)
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * Parse Retry-After header value into seconds.
 * Supports both delta-seconds ("120") and HTTP-date formats.
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null

  // Try as integer seconds first
  const seconds = parseInt(header, 10)
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds
  }

  // Try as HTTP-date (e.g. "Fri, 06 Feb 2026 12:00:00 GMT")
  const date = new Date(header)
  if (!isNaN(date.getTime())) {
    const delta = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000))
    return delta
  }

  return null
}

/**
 * Build an ApiError from a failed fetch Response
 */
async function buildApiError(response: Response): Promise<ApiError> {
  const errorText = await response.text()
  const retryAfter = parseRetryAfter(response.headers.get('Retry-After'))
  return new ApiError(response.status, errorText, retryAfter)
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
    throw await buildApiError(response)
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
    throw await buildApiError(response)
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
