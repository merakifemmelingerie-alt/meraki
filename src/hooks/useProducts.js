import { useState, useEffect } from 'react'
import { getProducts, getProductsBySection, getPublicProducts, getPublicProductsBySection } from '../services/database.js'

// Usada pelas paginas publicas da loja. Consulta a view products_public,
// que nao inclui o preco de custo (cost_price) dos produtos.
export function useProducts(section = null) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const { data, error: err } = section
                ? await getPublicProductsBySection(section)
                : await getPublicProducts()

            if (err) {
                setError(err.message)
            } else {
                setProducts((data || []).filter(p => p && p.name))
            }
            setLoading(false)
        }

        load()
    }, [section])

    return { products, loading, error, setProducts }
}

// Usada apenas no painel administrativo. Consulta a tabela products
// completa, incluindo cost_price, necessario para calculo de margem/lucro.
export function useAdminProducts(section = null) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const { data, error: err } = section
                ? await getProductsBySection(section)
                : await getProducts()

            if (err) {
                setError(err.message)
            } else {
                setProducts((data || []).filter(p => p && p.name))
            }
            setLoading(false)
        }

        load()
    }, [section])

    return { products, loading, error, setProducts }
}
