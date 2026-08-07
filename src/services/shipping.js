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

export function getStorePickupOption() {
    try {
        const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        const rawAddr = config.address || 'Rua Lateral do Campo Qd20, Lt06 Jardim Santana.'
        const rawCep = config.origin_cep || config.originCep || '75195-385'
        const fullAddr = rawAddr.toLowerCase().includes('cep') 
            ? `Meraki Moda Feminina — ${rawAddr}` 
            : `Meraki Moda Feminina — ${rawAddr}${rawCep ? ` - CEP: ${rawCep}` : ''}`
            
        return {
            id: 'pickup',
            name: 'Retirada na Loja Física',
            label: 'Retirada na Loja (Grátis)',
            price: 0,
            days: 'Pronto em até 1 dia útil',
            formattedPrice: 'GRÁTIS',
            address: fullAddr
        }
    } catch {
        return {
            id: 'pickup',
            name: 'Retirada na Loja Física',
            label: 'Retirada na Loja (Grátis)',
            price: 0,
            days: 'Pronto em até 1 dia útil',
            formattedPrice: 'GRÁTIS',
            address: 'Meraki Moda Feminina — Rua Lateral do Campo Qd20, Lt06 Jardim Santana. - CEP: 75195-385'
        }
    }
}

export const STORE_PICKUP_OPTION = getStorePickupOption()

/**
 * Calculates shipping options based on customer location (Always Free Local Delivery in Bonfinópolis-GO)
 */
export function calculateShippingOptions(uf = 'GO', subtotal = 0) {
    return [
        {
            id: 'local_delivery',
            name: 'Entrega no Endereço (Bonfinópolis - GO)',
            label: 'Entrega no Endereço (Grátis)',
            price: 0,
            days: 'Entregue em até 24h após a confirmação',
            formattedPrice: 'GRÁTIS'
        }
    ]
}
