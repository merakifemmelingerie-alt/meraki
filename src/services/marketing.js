import { supabase } from './supabase.js'

// Cache de sessão local para ID anônimo do carrinho
const CART_SESSION_KEY = 'meraki_cart_session_id'

export function getOrCreateCartSessionId() {
    let id = localStorage.getItem(CART_SESSION_KEY)
    if (!id) {
        id = 'cart_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
        localStorage.setItem(CART_SESSION_KEY, id)
    }
    return id
}

// ─── Configurações de Automação ───────────────────────────────────────────────

export async function getMarketingConfig() {
    try {
        const { data, error } = await supabase
            .from('marketing_automations')
            .select('*')
            .eq('id', 'default_config')
            .single()

        if (error && error.code !== 'PGRST116') {
            console.warn('marketing_automations warning:', error.message)
        }
        return data || getDefaultConfig()
    } catch (err) {
        console.error('Erro ao buscar configurações de marketing:', err)
        return getDefaultConfig()
    }
}

export async function updateMarketingConfig(config) {
    try {
        const { data, error } = await supabase
            .from('marketing_automations')
            .upsert({
                id: 'default_config',
                ...config,
                updated_at: new Date().toISOString()
            })
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (err) {
        console.error('Erro ao salvar configurações de marketing:', err)
        return { success: false, error: err.message }
    }
}

function getDefaultConfig() {
    return {
        id: 'default_config',
        whatsapp_enabled: true,
        email_enabled: true,
        whatsapp_api_url: '',
        whatsapp_api_token: '',
        email_api_url: '',
        email_api_token: '',
        cart_abandoned_active: true,
        cart_30m_active: true,
        cart_30m_message: 'Olá, {nome}! 💕 Notamos que você deixou algumas peças lindas no seu carrinho da Meraki Femme. Não perca a oportunidade de garantir as suas! Clique aqui para finalizar: {link_carrinho}',
        cart_24h_active: true,
        cart_24h_message: 'Oii {nome}! 💕 Seu carrinho ainda está te esperando na Meraki Femme! Finalize sua compra antes que os estoques se esgotem: {link_carrinho}',
        cart_48h_active: true,
        cart_48h_coupon: 'CARRINHO5',
        cart_48h_discount_percent: 5.00,
        cart_48h_message: 'Psiu {nome}! 🎁 Preparamos um presente especial para você não deixar suas peças favoritas para trás: use o cupom {cupom} e ganhe 5% OFF! Finalize agora: {link_carrinho}',
        order_confirmed_active: true,
        order_confirmed_message: 'Recebemos seu pedido #{numero_pedido} com sucesso! 💕 Em breve atualizaremos sobre o pagamento e envio. Agradecemos por escolher a Meraki Femme!',
        payment_approved_active: true,
        payment_approved_message: 'Pagamento aprovado para o pedido #{numero_pedido}! 🎉 Seu pedido já está sendo preparado com todo carinho.',
        payment_pending_active: true,
        payment_pending_message: 'Lembrete: Seu pedido #{numero_pedido} está aguardando pagamento. Garantimos suas peças por poucas horas! Clique aqui para concluir: {link_pagamento}',
        order_shipped_active: true,
        order_shipped_message: 'Seu pedido #{numero_pedido} acabou de ser enviado! 📦 Acompanhe pelo código de rastreamento: {codigo_rastreio}',
        order_delivered_active: true,
        order_delivered_message: 'Seu pedido #{numero_pedido} foi entregue! 💖 Esperamos que ame cada detalhe. Se puder, nos conte o que achou!',
        inactive_90d_active: true,
        inactive_90d_coupon: 'VOLTEI10',
        inactive_90d_discount_percent: 10.00,
        inactive_90d_message: 'Sentimos sua falta na Meraki Femme, {nome}! 💖 Preparamos um presente exclusivo: use o cupom {cupom} e ganhe 10% OFF no seu retorno: {link_loja}',
        post_sale_active: true,
        post_sale_days: 5,
        post_sale_message: 'Oiii {nome}! 💕 Já deu tempo de experimentar suas peças da Meraki Femme? Conte-nos o que achou ou nos marque com uma foto usando a peça! Adoramos ver você radiante.',
        birthday_active: true,
        birthday_coupon: 'NIVER15',
        birthday_discount_percent: 15.00,
        birthday_message: 'Feliz Aniversário, {nome}! 🎉🎂 A Meraki Femme te deseja um dia inesquecível! Para comemorar, preparamos um presente especial: use o cupom {cupom} e ganhe 15% OFF hoje: {link_loja}',
        new_collection_message: 'Novidade fresquinha na Meraki Femme! ✨ Acabamos de lançar nossa nova coleção "{colecao}". Venha conferir antes que esgote: {link_loja}'
    }
}

// ─── Disparos de Mensagens (WhatsApp & E-mail) ───────────────────────────────

export async function dispatchMarketingMessage({ channel = 'whatsapp', eventType, recipientEmail = '', recipientPhone = '', recipientName = '', messageContent = '', extraDetails = {} }) {
    try {
        const config = await getMarketingConfig()
        let isSimulated = true
        let responsePayload = {}

        if (channel === 'whatsapp' && config.whatsapp_enabled && config.whatsapp_api_url) {
            try {
                const res = await fetch(config.whatsapp_api_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.whatsapp_api_token}`
                    },
                    body: JSON.stringify({
                        phone: recipientPhone,
                        message: messageContent,
                        event: eventType,
                        recipient_name: recipientName
                    })
                })
                responsePayload = await res.json().catch(() => ({}))
                isSimulated = !res.ok
            } catch (err) {
                console.warn('Erro ao chamar API WhatsApp, gravando como simulado:', err)
                responsePayload = { error: err.message }
            }
        }

        if (channel === 'email' && config.email_enabled && config.email_api_url) {
            try {
                const res = await fetch(config.email_api_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.email_api_token}`
                    },
                    body: JSON.stringify({
                        to: recipientEmail,
                        subject: extraDetails.subject || 'Notificação Meraki Femme',
                        body: messageContent,
                        event: eventType
                    })
                })
                responsePayload = await res.json().catch(() => ({}))
                isSimulated = !res.ok
            } catch (err) {
                console.warn('Erro ao chamar API de E-mail, gravando como simulado:', err)
                responsePayload = { error: err.message }
            }
        }

        // Gravar no log de automação
        await supabase.from('marketing_logs').insert({
            channel,
            event_type: eventType,
            recipient_email: recipientEmail,
            recipient_phone: recipientPhone,
            recipient_name: recipientName,
            message_content: messageContent,
            status: isSimulated ? 'simulated' : 'sent',
            response_details: responsePayload
        })

        return { success: true, simulated: isSimulated }
    } catch (err) {
        console.error('Erro ao disparar mensagem de marketing:', err)
        return { success: false, error: err.message }
    }
}

// ─── Carrinho Abandonado ──────────────────────────────────────────────────────

export async function saveAbandonedCart({ items = [], customerEmail = '', customerPhone = '', customerName = '', subtotal = 0, userId = null }) {
    if (!items || items.length === 0) return

    try {
        const sessionId = getOrCreateCartSessionId()
        
        const payload = {
            session_id: sessionId,
            items,
            subtotal,
            status: 'active',
            last_activity: new Date().toISOString()
        }

        if (customerEmail) payload.customer_email = customerEmail
        if (customerPhone) payload.customer_phone = customerPhone
        if (customerName) payload.customer_name = customerName
        if (userId) payload.user_id = userId

        const { error } = await supabase
            .from('abandoned_carts')
            .upsert(payload, { onConflict: 'session_id' })

        if (error) {
            console.warn('Não foi possível registrar carrinho abandonado no Supabase:', error.message)
        }
    } catch (err) {
        console.error('Erro ao salvar sessão de carrinho abandonado:', err)
    }
}

export async function markCartAsRecovered(customerEmail, customerPhone) {
    try {
        const sessionId = localStorage.getItem(CART_SESSION_KEY)
        let query = supabase.from('abandoned_carts').update({ status: 'recovered' })

        if (sessionId) {
            query = query.eq('session_id', sessionId)
        } else if (customerEmail) {
            query = query.eq('customer_email', customerEmail)
        } else if (customerPhone) {
            query = query.eq('customer_phone', customerPhone)
        } else {
            return
        }

        await query
    } catch (err) {
        console.error('Erro ao marcar carrinho como recuperado:', err)
    }
}

export async function getAbandonedCarts() {
    try {
        const { data, error } = await supabase
            .from('abandoned_carts')
            .select('*')
            .order('last_activity', { ascending: false })
            .limit(50)

        if (error) throw error
        return data || []
    } catch (err) {
        console.error('Erro ao listar carrinhos abandonados:', err)
        return []
    }
}

// ─── Histórico de Logs ────────────────────────────────────────────────────────

export async function getMarketingLogs() {
    try {
        const { data, error } = await supabase
            .from('marketing_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error
        return data || []
    } catch (err) {
        console.error('Erro ao buscar logs de marketing:', err)
        return []
    }
}

// ─── Alertas de Estoque ───────────────────────────────────────────────────────

export async function subscribeBackInStock({ productId, productName, email, phone, name }) {
    try {
        const { data, error } = await supabase
            .from('stock_alerts')
            .insert({
                product_id: productId,
                product_name: productName,
                customer_email: email,
                customer_phone: phone,
                customer_name: name
            })
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (err) {
        console.error('Erro ao cadastrar alerta de estoque:', err)
        return { success: false, error: err.message }
    }
}

export async function checkAndNotifyBackInStock(productId, productName) {
    try {
        const { data: alerts, error } = await supabase
            .from('stock_alerts')
            .select('*')
            .eq('product_id', productId)
            .eq('notified', false)

        if (error || !alerts || alerts.length === 0) return

        const baseUrl = window.location.origin
        const link = `${baseUrl}/produto/${productId}`

        for (const alert of alerts) {
            const message = `Boas notícias, ${alert.customer_name || 'cliente'}! 💕 O produto "${productName}" voltou ao estoque na Meraki Femme! Garanta o seu antes que acabe: ${link}`
            
            if (alert.customer_phone) {
                await dispatchMarketingMessage({
                    channel: 'whatsapp',
                    eventType: 'back_in_stock',
                    recipientPhone: alert.customer_phone,
                    recipientName: alert.customer_name,
                    messageContent: message
                })
            }

            if (alert.customer_email) {
                await dispatchMarketingMessage({
                    channel: 'email',
                    eventType: 'back_in_stock',
                    recipientEmail: alert.customer_email,
                    recipientName: alert.customer_name,
                    messageContent: message,
                    extraDetails: { subject: `💕 ${productName} está de volta ao estoque!` }
                })
            }

            await supabase
                .from('stock_alerts')
                .update({ notified: true })
                .eq('id', alert.id)
        }
    } catch (err) {
        console.error('Erro ao disparar alertas de estoque:', err)
    }
}

// ─── Transmissão de Lançamentos ───────────────────────────────────────────────

export async function broadcastNewCollection(collectionName) {
    try {
        const config = await getMarketingConfig()
        const baseUrl = window.location.origin

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('marketing_opt_in', true)

        if (error || !profiles || profiles.length === 0) {
            return { success: true, count: 0, message: 'Nenhum cliente cadastrado com opt-in ativo.' }
        }

        let sentCount = 0

        for (const profile of profiles) {
            const nome = profile.full_name ? profile.full_name.split(' ')[0] : 'Cliente'
            const msg = (config.new_collection_message || '')
                .replace('{nome}', nome)
                .replace('{colecao}', collectionName)
                .replace('{link_loja}', baseUrl)

            if (profile.phone && config.whatsapp_enabled) {
                await dispatchMarketingMessage({
                    channel: 'whatsapp',
                    eventType: 'new_collection',
                    recipientPhone: profile.phone,
                    recipientName: profile.full_name,
                    messageContent: msg
                })
                sentCount++
            }

            if (profile.email && config.email_enabled) {
                await dispatchMarketingMessage({
                    channel: 'email',
                    eventType: 'new_collection',
                    recipientEmail: profile.email,
                    recipientName: profile.full_name,
                    messageContent: msg,
                    extraDetails: { subject: `✨ Nova Coleção Meraki Femme: ${collectionName}` }
                })
                sentCount++
            }
        }

        return { success: true, count: sentCount }
    } catch (err) {
        console.error('Erro ao realizar transmissão de lançamento:', err)
        return { success: false, error: err.message }
    }
}

// ─── Motor de Verificação em Tempo Real (Cron / Trigger) ─────────────────────

export async function processMarketingAutomations() {
    try {
        const config = await getMarketingConfig()
        const now = new Date()
        const baseUrl = window.location.origin
        let executedCount = 0

        // 1. PROCESSAR CARRINHOS ABANDONADOS
        if (config.cart_abandoned_active) {
            const { data: carts } = await supabase
                .from('abandoned_carts')
                .select('*')
                .in('status', ['active', 'abandoned'])
                .lt('stage', 3)

            if (carts && carts.length > 0) {
                for (const cart of carts) {
                    const lastAct = new Date(cart.last_activity)
                    const diffMinutes = (now - lastAct) / (1000 * 60)
                    const name = cart.customer_name ? cart.customer_name.split(' ')[0] : 'Cliente'
                    const link = `${baseUrl}/carrinho`

                    // Etapa 1: 30 Minutos
                    if (diffMinutes >= 30 && diffMinutes < 1440 && cart.stage === 0 && config.cart_30m_active) {
                        const msg = (config.cart_30m_message || '')
                            .replace('{nome}', name)
                            .replace('{link_carrinho}', link)

                        if (cart.customer_phone) {
                            await dispatchMarketingMessage({
                                channel: 'whatsapp',
                                eventType: 'cart_30m',
                                recipientPhone: cart.customer_phone,
                                recipientName: cart.customer_name,
                                messageContent: msg
                            })
                        }
                        if (cart.customer_email) {
                            await dispatchMarketingMessage({
                                channel: 'email',
                                eventType: 'cart_30m',
                                recipientEmail: cart.customer_email,
                                recipientName: cart.customer_name,
                                messageContent: msg,
                                extraDetails: { subject: '💕 Esqueceu algo no seu carrinho?' }
                            })
                        }
                        await supabase.from('abandoned_carts').update({ stage: 1, status: 'abandoned' }).eq('id', cart.id)
                        executedCount++
                    }

                    // Etapa 2: 24 Horas
                    else if (diffMinutes >= 1440 && diffMinutes < 2880 && cart.stage <= 1 && config.cart_24h_active) {
                        const msg = (config.cart_24h_message || '')
                            .replace('{nome}', name)
                            .replace('{link_carrinho}', link)

                        if (cart.customer_phone) {
                            await dispatchMarketingMessage({
                                channel: 'whatsapp',
                                eventType: 'cart_24h',
                                recipientPhone: cart.customer_phone,
                                recipientName: cart.customer_name,
                                messageContent: msg
                            })
                        }
                        if (cart.customer_email) {
                            await dispatchMarketingMessage({
                                channel: 'email',
                                eventType: 'cart_24h',
                                recipientEmail: cart.customer_email,
                                recipientName: cart.customer_name,
                                messageContent: msg,
                                extraDetails: { subject: '🛍️ Seu carrinho ainda está te esperando!' }
                            })
                        }
                        await supabase.from('abandoned_carts').update({ stage: 2, status: 'abandoned' }).eq('id', cart.id)
                        executedCount++
                    }

                    // Etapa 3: 48 Horas (Com Cupom de Desconto 5%)
                    else if (diffMinutes >= 2880 && cart.stage <= 2 && config.cart_48h_active) {
                        const coupon = config.cart_48h_coupon || 'CARRINHO5'
                        const msg = (config.cart_48h_message || '')
                            .replace('{nome}', name)
                            .replace('{cupom}', coupon)
                            .replace('{link_carrinho}', `${link}?coupon=${coupon}`)

                        if (cart.customer_phone) {
                            await dispatchMarketingMessage({
                                channel: 'whatsapp',
                                eventType: 'cart_48h',
                                recipientPhone: cart.customer_phone,
                                recipientName: cart.customer_name,
                                messageContent: msg
                            })
                        }
                        if (cart.customer_email) {
                            await dispatchMarketingMessage({
                                channel: 'email',
                                eventType: 'cart_48h',
                                recipientEmail: cart.customer_email,
                                recipientName: cart.customer_name,
                                messageContent: msg,
                                extraDetails: { subject: `🎁 Ganhe 5% OFF no seu carrinho cupom: ${coupon}` }
                            })
                        }
                        await supabase.from('abandoned_carts').update({ stage: 3, status: 'abandoned', coupon_generated: coupon }).eq('id', cart.id)
                        executedCount++
                    }
                }
            }
        }

        // 2. PROCESSAR CLIENTES INATIVOS (90 DIAS SEM COMPRAR)
        if (config.inactive_90d_active) {
            const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)).toISOString()
            const { data: inactiveProfiles } = await supabase
                .from('profiles')
                .select('*')
                .lt('last_purchase_date', ninetyDaysAgo)
                .limit(20)

            if (inactiveProfiles && inactiveProfiles.length > 0) {
                for (const profile of inactiveProfiles) {
                    const name = profile.full_name ? profile.full_name.split(' ')[0] : 'Cliente'
                    const coupon = config.inactive_90d_coupon || 'VOLTEI10'
                    const msg = (config.inactive_90d_message || '')
                        .replace('{nome}', name)
                        .replace('{cupom}', coupon)
                        .replace('{link_loja}', `${baseUrl}?coupon=${coupon}`)

                    if (profile.phone) {
                        await dispatchMarketingMessage({
                            channel: 'whatsapp',
                            eventType: 'inactive_90d',
                            recipientPhone: profile.phone,
                            recipientName: profile.full_name,
                            messageContent: msg
                        })
                    }
                    if (profile.email) {
                        await dispatchMarketingMessage({
                            channel: 'email',
                            eventType: 'inactive_90d',
                            recipientEmail: profile.email,
                            recipientName: profile.full_name,
                            messageContent: msg,
                            extraDetails: { subject: '💖 Sentimos sua falta! Ganhe 10% OFF no seu retorno' }
                        })
                    }
                    executedCount++
                }
            }
        }

        // 3. PROCESSAR ANIVERSARIANTES DO DIA
        if (config.birthday_active) {
            const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')
            const currentDay = now.getDate().toString().padStart(2, '0')

            const { data: birthdayProfiles } = await supabase
                .from('profiles')
                .select('*')
                .not('birth_date', 'is', null)

            if (birthdayProfiles && birthdayProfiles.length > 0) {
                for (const profile of birthdayProfiles) {
                    if (profile.birth_date) {
                        const parts = profile.birth_date.split('-')
                        if (parts.length >= 3 && parts[1] === currentMonth && parts[2] === currentDay) {
                            const name = profile.full_name ? profile.full_name.split(' ')[0] : 'Cliente'
                            const coupon = config.birthday_coupon || 'NIVER15'
                            const msg = (config.birthday_message || '')
                                .replace('{nome}', name)
                                .replace('{cupom}', coupon)
                                .replace('{link_loja}', `${baseUrl}?coupon=${coupon}`)

                            if (profile.phone) {
                                await dispatchMarketingMessage({
                                    channel: 'whatsapp',
                                    eventType: 'birthday',
                                    recipientPhone: profile.phone,
                                    recipientName: profile.full_name,
                                    messageContent: msg
                                })
                            }
                            if (profile.email) {
                                await dispatchMarketingMessage({
                                    channel: 'email',
                                    eventType: 'birthday',
                                    recipientEmail: profile.email,
                                    recipientName: profile.full_name,
                                    messageContent: msg,
                                    extraDetails: { subject: '🎉🎁 Feliz Aniversário! Seu presente da Meraki Femme chegou' }
                                })
                            }
                            executedCount++
                        }
                    }
                }
            }
        }

        return { success: true, executedCount }
    } catch (err) {
        console.error('Erro ao processar motor de automações de marketing:', err)
        return { success: false, error: err.message }
    }
}
