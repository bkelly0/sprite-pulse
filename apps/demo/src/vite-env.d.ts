/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
