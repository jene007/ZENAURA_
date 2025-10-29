import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  // Note: don't override esbuild loader mapping here — React plugin and .jsx files handle JSX parsing.
})

