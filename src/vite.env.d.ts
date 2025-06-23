/// <reference types="vite/client" />

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaCustomEnv {
  readonly VITE_FARO_ACTIVE: string
  readonly VITE_FARO_URL: string
  readonly VITE_FARO_APP_NAME: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ImportMetaEnv extends ImportMetaCustomEnv {
  // empty to keep custom properties easily referencable from the default ones
  // custom properties extend ImportMetaEnv to keep separation
}

interface ImportMeta {
  readonly env: ImportMetaCustomEnv
}
