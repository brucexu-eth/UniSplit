// Environment validation utilities

interface RequiredEnvVars {
  VITE_WALLETCONNECT_PROJECT_ID: string
  VITE_BASE_RPC_URL: string
  VITE_CHAIN_ID: string
  VITE_USDT_CONTRACT_ADDRESS: string
}

interface OptionalEnvVars {
  VITE_APP_NAME?: string
  VITE_APP_DESCRIPTION?: string
}

type EnvVars = RequiredEnvVars & OptionalEnvVars

export function validateEnvironment(): boolean {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'VITE_WALLETCONNECT_PROJECT_ID',
    'VITE_BASE_RPC_URL',
    'VITE_CHAIN_ID',
    'VITE_USDT_CONTRACT_ADDRESS',
  ]

  const missingVars = requiredVars.filter(
    (varName) =>
      !import.meta.env[varName] ||
      import.meta.env[varName] === 'your_project_id_here'
  )

  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars)
    console.warn(
      'Please check your .env file and ensure all required variables are set'
    )
    return false
  }

  return true
}

export function getEnvVar(name: keyof EnvVars): string | undefined {
  return import.meta.env[name]
}

export function getEnvVarOrThrow(name: keyof RequiredEnvVars): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}
