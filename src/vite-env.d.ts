/// <reference types="vite/client" />

// Build-time constants injected by Vite
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare Turnstile types
interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

interface Turnstile {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId: string) => string | undefined;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}