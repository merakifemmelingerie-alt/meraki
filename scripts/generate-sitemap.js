import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const SITE_URL = 'https://merakifemme.com.br'

const STATIC_PAGES = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/story', changefreq: 'monthly', priority: '0.5' },
    { path: '/revenda', changefreq: 'monthly', priority: '0.5' },
    { path: '/connect', changefreq: 'monthly', priority: '0.4' },
    { path: '/security', changefreq: 'monthly', priority: '0.4' },
    { path: '/payment', changefreq: 'monthly', priority: '0.4' },
    { path: '/delivery', changefreq: 'monthly', priority: '0.4' },
    { path: '/returns', changefreq: 'monthly', priority: '0.4' },
    { path: '/withdrawal', changefreq: 'monthly', priority: '0.3' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
    { path: '/promotional-rules', changefreq: 'monthly', priority: '0.3' },
    { path: '/stores', changefreq: 'monthly', priority: '0.4' },
]

const slugifyCategory = (name) => (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')

function xmlEscape(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildXml(urls) {
    const body = urls.map(u => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export async function generateSitemap() {
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://ndcrlkehwgcqfligrxim.supabase.co').trim()
    const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kY3Jsa2Vod2djcWZsaWdyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzEzNTgsImV4cCI6MjEwMTM0NzM1OH0.ah2LUpV_WP8ZOUDe7PhgSZnScz1p00b12H4oj_MsovA').trim()

    const urls = STATIC_PAGES.map(p => ({ loc: `${SITE_URL}${p.path}`, changefreq: p.changefreq, priority: p.priority }))

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { data: categories } = await supabase.from('categories').select('name')
        const slugs = new Set()
        for (const c of categories || []) {
            const slug = slugifyCategory(c.name)
            if (slug && !slugs.has(slug)) {
                slugs.add(slug)
                urls.push({ loc: `${SITE_URL}/category/${slug}`, changefreq: 'weekly', priority: '0.8' })
            }
        }

        const { data: products } = await supabase.from('products_public').select('id')
        for (const p of products || []) {
            urls.push({ loc: `${SITE_URL}/product/${p.id}`, changefreq: 'weekly', priority: '0.7' })
        }

        console.log(`[sitemap] Gerado com ${urls.length} URLs (${slugs.size} categorias, ${(products || []).length} produtos).`)
    } catch (e) {
        console.warn('[sitemap] Nao foi possivel buscar categorias/produtos do Supabase, gerando so as paginas estaticas:', e.message)
    }

    const xml = buildXml(urls)
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const outPath = path.resolve(__dirname, '../public/sitemap.xml')
    writeFileSync(outPath, xml, 'utf-8')
    console.log(`[sitemap] Escrito em ${outPath}`)
}

// Permite rodar direto via `node scripts/generate-sitemap.js`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    generateSitemap()
}
