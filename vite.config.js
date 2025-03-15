import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'rcl-local-warning',
        configResolved() {
          if (env.VITE_USE_LOCAL_RCL === 'true') {
            console.log('\x1b[33m%s\x1b[0m', '⚠️  Using local translation-helps-rcl from ../translation-helps-rcl/src');
          }
          if (env.VITE_USE_LOCAL_SCRIPTURE_RCL === 'true') {
            console.log('\x1b[33m%s\x1b[0m', '⚠️  Using local single-scripture-rcl from ../single-scripture-rcl/src');
          }
          if (env.VITE_USE_LOCAL_GITEA_TOOLKIT === 'true') {
            console.log('\x1b[33m%s\x1b[0m', '⚠️  Using local gitea-react-toolkit from ../gitea-react-toolkit/src');
          }
          if (env.VITE_USE_LOCAL_SCRIPTURE_RESOURCES_RCL === 'true') {
            console.log('\x1b[33m%s\x1b[0m', '⚠️  Using local scripture-resources-rcl from ../scripture-resources-rcl/src');
          }
        }
      }
    ],
    resolve: {
      alias: {
        'translation-helps-rcl': env.VITE_USE_LOCAL_RCL === 'true'
          ? path.resolve(__dirname, '../translation-helps-rcl/src')
          : 'translation-helps-rcl',
        'single-scripture-rcl': env.VITE_USE_LOCAL_SCRIPTURE_RCL === 'true'
          ? path.resolve(__dirname, '../single-scripture-rcl/src')
          : 'single-scripture-rcl',
        'gitea-react-toolkit': env.VITE_USE_LOCAL_GITEA_TOOLKIT === 'true'
          ? path.resolve(__dirname, '../gitea-react-toolkit/src')
          : 'gitea-react-toolkit',
        'scripture-resources-rcl': env.VITE_USE_LOCAL_SCRIPTURE_RESOURCES_RCL === 'true'
          ? path.resolve(__dirname, '../scripture-resources-rcl/src')
          : 'scripture-resources-rcl',
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@context': path.resolve(__dirname, './src/context'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@common': path.resolve(__dirname, './src/common'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css'],
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
        NODE_ENV: JSON.stringify(mode),
        NEXT_PUBLIC_BUILD_NUMBER: JSON.stringify(
          process.env.NEXT_PUBLIC_BUILD_NUMBER || ''
        ),
        NEXT_PUBLIC_BUILD_BRANCH: JSON.stringify(
          process.env.NEXT_PUBLIC_BUILD_BRANCH || ''
        ),
        NEXT_PUBLIC_BUILD_CONTEXT: JSON.stringify(
          process.env.NEXT_PUBLIC_BUILD_CONTEXT || ''
        ),
        VITE_USE_LOCAL_RCL: JSON.stringify(env.VITE_USE_LOCAL_RCL === 'true'),
        VITE_USE_LOCAL_SCRIPTURE_RCL: JSON.stringify(env.VITE_USE_LOCAL_SCRIPTURE_RCL === 'true'),
        VITE_USE_LOCAL_GITEA_TOOLKIT: JSON.stringify(env.VITE_USE_LOCAL_GITEA_TOOLKIT === 'true'),
        VITE_USE_LOCAL_SCRIPTURE_RESOURCES_RCL: JSON.stringify(env.VITE_USE_LOCAL_SCRIPTURE_RESOURCES_RCL === 'true'),
      },
    }
  }
})
