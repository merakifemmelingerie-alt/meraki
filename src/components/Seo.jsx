import { useEffect } from 'react'

const SITE_URL = 'https://merakifemme.com.br'
const DEFAULT_TITLE = 'Meraki Femme - Moda Feminina Premium'
const DEFAULT_DESCRIPTION = 'Meraki Femme - Lingerie e Moda Feminina Premium. Conheça nossas coleções exclusivas de conjuntos, camisolas, fantasias e acessórios.'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

// Componente de SEO por pagina. O React 19 promove title/meta/link renderizados
// em qualquer lugar da arvore para a <head> automaticamente e substitui as tags
// equivalentes de uma renderizacao anterior, entao cada pagina so precisa
// declarar o que muda em relacao ao padrao do site. Excecao: <meta name="description">
// nao e' deduplicada pelo React contra as tags estaticas do index.html (usadas pelo
// WhatsApp/Facebook, que nao executam JS), entao removemos essas manualmente assim
// que a primeira pagina real montar, pra sobrar so a versao correta pro Google.
export default function Seo({ title, description, path = '', image, noindex = false }) {
    const fullTitle = title ? `${title} | Meraki Femme` : DEFAULT_TITLE
    const desc = description || DEFAULT_DESCRIPTION
    const url = `${SITE_URL}${path}`
    const img = image || DEFAULT_IMAGE

    useEffect(() => {
        document.querySelectorAll('[data-default]').forEach(el => el.remove())
    }, [])

    return (
        <>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <link rel="canonical" href={url} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={img} />

            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:image" content={img} />
        </>
    )
}
