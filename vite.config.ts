import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git info at build time, with env var fallback for Docker/CI builds
const getGitInfo = () => {
  // First try environment variables (set by Docker build args)
  if (process.env.VITE_APP_VERSION && process.env.VITE_APP_VERSION !== 'unknown') {
    return {
      commitHash: process.env.VITE_APP_VERSION,
      commitDate: process.env.VITE_BUILD_DATE || 'unknown'
    }
  }

  // Fall back to git commands (works in local dev)
  try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
    const commitDate = execSync('git log -1 --format=%cd --date=short').toString().trim()
    return { commitHash, commitDate }
  } catch {
    return { commitHash: 'unknown', commitDate: 'unknown' }
  }
}

const gitInfo = getGitInfo()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(gitInfo.commitHash),
    __BUILD_DATE__: JSON.stringify(gitInfo.commitDate),
  },
  server: {
    port: 5173,
    host: 'localhost',
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: ['src/__tests__/**', '**/*.test.*', '**/*.spec.*', 'node_modules/**'],
    },
  },
})
