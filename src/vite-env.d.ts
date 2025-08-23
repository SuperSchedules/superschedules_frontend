/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}