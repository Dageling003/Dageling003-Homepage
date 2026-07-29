import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      globals: false,
      include: ['src/**/*.spec.ts'],
      restoreMocks: true,
      unstubEnvs: true,
      unstubGlobals: true,
    },
  }),
)
