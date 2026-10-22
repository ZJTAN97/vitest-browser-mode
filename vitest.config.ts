import { defineConfig, mergeConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      browser: {
        enabled: true,
        provider: playwright({ launchOptions: { channel: 'chrome' } }),
        instances: [{ browser: 'chromium' }],
        viewport: { width: 1280, height: 800 },
      },
    },
  }),
)
