import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: '/',
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
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
