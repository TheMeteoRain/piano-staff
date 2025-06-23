import 'vite'
import './src/vite.env'

interface LoadEnvCustomReturn extends ImportMetaCustomEnv {
  readonly VITE_FARO_ENDPOINT: string
  readonly VITE_FARO_APP_ID: string
  readonly VITE_FARO_STACK_ID: string
  readonly VITE_FARO_API_KEY: string
}

declare module 'vite' {
  // Override the return type of loadEnv
  export function loadEnv(
    mode: string,
    envDir: string,
    prefix?: string | string[],
  ): LoadEnvCustomReturn
}
