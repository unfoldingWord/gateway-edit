import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rcl-local-warning',
      configResolved() {
        if (process.env.USE_LOCAL_RCL) {
          console.log('\x1b[33m%s\x1b[0m', '⚠️  Using local translation-helps-rcl from ../translation-helps-rcl/src');
        }
      }
    }
  ],
  resolve: {
    alias: {
      'translation-helps-rcl': process.env.USE_LOCAL_RCL
        ? path.resolve(__dirname, '../translation-helps-rcl/src')
        : 'translation-helps-rcl',
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@common': path.resolve(__dirname, './src/common'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
    extensions: ['.js', '.jsx', '.json', '.css'],
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  optimizeDeps: {
    exclude: ['canvas'],
    include: [
      '@material-ui/core',
      '@material-ui/core/styles',
      '@material-ui/icons',
    ],
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      NEXT_PUBLIC_BUILD_NUMBER: JSON.stringify(
        process.env.NEXT_PUBLIC_BUILD_NUMBER || ''
      ),
      NEXT_PUBLIC_BUILD_BRANCH: JSON.stringify(
        process.env.NEXT_PUBLIC_BUILD_BRANCH || ''
      ),
      NEXT_PUBLIC_BUILD_CONTEXT: JSON.stringify(
        process.env.NEXT_PUBLIC_BUILD_CONTEXT || ''
      ),
      USE_LOCAL_RCL: JSON.stringify(process.env.USE_LOCAL_RCL || false),
    },
  },
})
