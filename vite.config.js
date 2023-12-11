import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// const env = loadEnv(mode, process.cwd(), '');

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.platform': JSON.stringify(process.platform),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, 'src/components'),
      "@context": path.resolve(__dirname, 'src/context'),
      "@hooks": path.resolve(__dirname, 'src/hooks'),
      "@styles": path.resolve(__dirname, 'src/styles'),
      "@common": path.resolve(__dirname, 'src/common'),
      "@utils": path.resolve(__dirname, 'src/utils')
    }
  }
})
