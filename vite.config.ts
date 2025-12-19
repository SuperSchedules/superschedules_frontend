import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git info at build time
const getGitInfo = () => {
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
