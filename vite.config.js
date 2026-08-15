import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { generateSitemap } from './scripts/generate-sitemap.js'

// Regenera public/sitemap.xml com as categorias/produtos reais do Supabase
// antes de cada build de producao, para o Google sempre indexar a URL certa.
function sitemapPlugin() {
    return {
        name: 'generate-sitemap',
        apply: 'build',
        async buildStart() {
            await generateSitemap()
        }
    }
}

export default defineConfig({
    base: '/',
    plugins: [
        react(),
        tailwindcss(),
        sitemapPlugin(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('framer-motion')) {
                            return 'vendor-react'
                        }
                        if (id.includes('@supabase')) {
                            return 'vendor-supabase'
                        }
                        return 'vendor'
                    }
                    if (id.includes('AdminSections') || id.includes('AdminPage')) {
                        return 'admin-bundle'
                    }
                }
            }
        }
    }
})
