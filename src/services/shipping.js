/**
 * Shipping calculation service (ViaCEP + Dynamic Regional Freight Table)
 */

export async function fetchAddressByCep(cep) {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos.')
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const data = await response.json()

    if (data.erro) {
        throw new Error('CEP não encontrado.')
    }

    return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        cep: cleanCep
    }
}

export const STORE_PICKUP_OPTION = {
    id: 'pickup',
    name: 'Retirada na Loja Física',
    label: 'Retirada na Loja (Grátis)',
    price: 0,
    days: 'Pronto em até 1 dia útil',
    formattedPrice: 'GRÁTIS',
    address: 'Avenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75195-000'
}

/**
 * Calculates shipping options based on customer state & subtotal
 */
export function calculateShippingOptions(uf, subtotal = 0) {
    const cleanUf = (uf || '').toUpperCase().trim()

    // Free shipping threshold rule (R$ 299)
    const isFreeShippingEligible = subtotal >= 299

    // Base rates matrix by Brazilian Region
    let pacPrice = 24.90
    let pacDays = 5
    let sedexPrice = 45.90
    let sedexDays = 2

    // SP / Sudeste
    if (['SP', 'RJ', 'MG', 'ES'].includes(cleanUf)) {
        pacPrice = 14.90
        pacDays = 3
        sedexPrice = 28.90
        sedexDays = 1
    } 
    // Sul
    else if (['PR', 'SC', 'RS'].includes(cleanUf)) {
        pacPrice = 19.90
        pacDays = 4
        sedexPrice = 36.90
        sedexDays = 2
    } 
    // Centro-Oeste
    else if (['DF', 'GO', 'MT', 'MS'].includes(cleanUf)) {
        pacPrice = 22.90
        pacDays = 5
        sedexPrice = 42.90
        sedexDays = 3
    } 
    // Nordeste
    else if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'].includes(cleanUf)) {
        pacPrice = 29.90
        pacDays = 7
        sedexPrice = 54.90
        sedexDays = 4
    } 
    // Norte
    else if (['AM', 'PA', 'AP', 'RO', 'RR', 'AC', 'TO'].includes(cleanUf)) {
        pacPrice = 34.90
        pacDays = 9
        sedexPrice = 68.90
        sedexDays = 5
    }

    if (isFreeShippingEligible) {
        pacPrice = 0
    }

    return [
        {
            id: 'pac',
            name: isFreeShippingEligible ? 'Frete Grátis (PAC)' : 'Entrega Normal (PAC)',
            label: isFreeShippingEligible ? 'Frete Grátis (PAC)' : 'PAC (Correios)',
            price: pacPrice,
            days: isFreeShippingEligible ? '3 a 5 dias úteis' : `${pacDays} a ${pacDays + 3} dias úteis`,
            formattedPrice: pacPrice === 0 ? 'GRÁTIS' : `R$ ${pacPrice.toFixed(2).replace('.', ',')}`
        },
        {
            id: 'sedex',
            name: 'Entrega Expressa (SEDEX)',
            label: 'SEDEX (Expresso)',
            price: sedexPrice,
            days: `${sedexDays} a ${sedexDays + 2} dias úteis`,
            formattedPrice: `R$ ${sedexPrice.toFixed(2).replace('.', ',')}`
        }
    ]
}
