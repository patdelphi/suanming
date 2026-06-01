import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-info'
import viteCompression from 'vite-plugin-compression'

const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
    // 生产环境启用Gzip压缩
    viteCompression({
      verbose: true,
      disable: !isProd,
      threshold: 10240, // 10KB以上的文件才压缩
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 启用代码压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        // 生产环境移除console和debugger
        drop_console: isProd,
        drop_debugger: isProd,
      },
    },
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动分割chunk
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // 将第三方库分离到vendor chunk
            return 'vendor';
          }
        },
      },
    },
    // chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 生成sourcemap（生产环境可关闭）
    sourcemap: !isProd,
  },
})

