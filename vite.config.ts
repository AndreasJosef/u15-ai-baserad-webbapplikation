import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  // nitro() compiles the server routes into deployable Vercel Functions.
  // TanStack Start no longer bundles this itself (see "Why TanStack Start
  // is Ditching Adapters"), so without it the client build still succeeds
  // but every route 404s on Vercel (x-vercel-error: NOT_FOUND) since there's
  // nothing for the platform to route requests to.
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
})
