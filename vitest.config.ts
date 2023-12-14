// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from "path";

export default defineConfig({
  test: {
    globals: false,
  },
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
