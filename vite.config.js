import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Dageling003的个人主页',
        short_name: 'Dageling003',
        description: '这里是Dageling003的个人主页！',
        theme_color: '#ffb3b3',
        background_color: '#d0e8ff',
        icons: [
          {
            src: '/logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: '/logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          iconify: ['@iconify/vue'],
        },
      },
    },
  },
})
