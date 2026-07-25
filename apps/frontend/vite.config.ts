import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // PWA 默认关闭：想开启就在 apps/frontend/.env 设 VITE_PWA_ENABLED=true。
  const pwaEnabled = env.VITE_PWA_ENABLED === 'true'

  return {
    base: '/',
    plugins: [
      vue(),
      UnoCSS(),
      ...(pwaEnabled
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.ico', 'icons.svg'],
              manifest: {
                name: '个人主页',
                short_name: '主页',
                description: '前端开发者，热爱技术与摄影',
                theme_color: '#d0e8ff',
                background_color: '#d0e8ff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                  {
                    src: 'favicon.ico',
                    sizes: 'any',
                    type: 'image/x-icon',
                    purpose: 'any',
                  },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                cacheId: 'homepage-v1.3.1',
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api/],
                clientsClaim: true,
                skipWaiting: true,
                disableDevLogs: true,
                runtimeCaching: [
                  {
                    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'google-fonts',
                      expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                      cacheableResponse: { statuses: [0, 200] },
                    },
                  },
                  {
                    urlPattern: /^https:\/\/api\.iconify\.design\/.*/i,
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'iconify',
                      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                      cacheableResponse: { statuses: [0, 200] },
                    },
                  },
                  {
                    urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'avatars',
                      expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
                      cacheableResponse: { statuses: [0, 200] },
                    },
                  },
                ],
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/pinia')) {
              return 'vue'
            }
            if (id.includes('node_modules/axios') || id.includes('node_modules/@vueuse')) {
              return 'vendor'
            }
          },
        },
      },
      assetsDir: 'assets',
      assetsInlineLimit: 4096,
    },
  }
})
