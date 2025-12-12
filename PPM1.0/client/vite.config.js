import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 网络环境不稳定时的配置 - 禁用HMR避免WebSocket问题
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    force: true // 强制重新优化依赖
  },
  server: {
    port: 3001,
    strictPort: false,
    host: '0.0.0.0', // 使用0.0.0.0以便外部访问
    cors: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    // 完全禁用HMR以避免WebSocket问题
    hmr: false,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1'),
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios']
        }
      }
    }
  },
  preview: {
    port: 8080,
    host: '0.0.0.0',
    cors: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },
  root: './'
})