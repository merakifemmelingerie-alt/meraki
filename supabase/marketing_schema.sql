-- ====================================================================
-- MERAKI FEMME - ESQUEMA DE AUTOMAÇÃO DE MARKETING (SQL SUPABASE)
-- Execute este script no SQL Editor do Supabase para criar 100% das
-- tabelas, índices e configurações padrão de Automação de Marketing.
-- ====================================================================

-- 1. ATUALIZAR TABELA DE PERFIS COM DADOS DE MARKETING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ;

-- 2. TABELA: marketing_automations (Configurações Gerais e Mensagens)
CREATE TABLE IF NOT EXISTS public.marketing_automations (
    id TEXT PRIMARY KEY DEFAULT 'default_config',
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_api_url TEXT DEFAULT '',
    whatsapp_api_token TEXT DEFAULT '',
    email_api_url TEXT DEFAULT '',
    email_api_token TEXT DEFAULT '',
    
    -- Configurações Carrinho Abandonado
    cart_abandoned_active BOOLEAN DEFAULT TRUE,
    cart_30m_active BOOLEAN DEFAULT TRUE,
    cart_30m_message TEXT DEFAULT 'Olá, {nome}! 💕 Notamos que você deixou algumas peças lindas no seu carrinho da Meraki Femme. Não perca a oportunidade de garantir as suas! Clique aqui para finalizar: {link_carrinho}',
    
    cart_24h_active BOOLEAN DEFAULT TRUE,
    cart_24h_message TEXT DEFAULT 'Oii {nome}! 💕 Seu carrinho ainda está te esperando na Meraki Femme! Finalize sua compra antes que os estoques se esgotem: {link_carrinho}',
    
    cart_48h_active BOOLEAN DEFAULT TRUE,
    cart_48h_coupon TEXT DEFAULT 'CARRINHO5',
    cart_48h_discount_percent NUMERIC(5, 2) DEFAULT 5.00,
    cart_48h_message TEXT DEFAULT 'Psiu {nome}! 🎁 Preparamos um presente especial para você não deixar suas peças favoritas para trás: use o cupom {cupom} e ganhe 5% OFF! Finalize agora: {link_carrinho}',
    
    -- Configurações Status de Pedidos (WhatsApp & E-mail)
    order_confirmed_active BOOLEAN DEFAULT TRUE,
    order_confirmed_message TEXT DEFAULT 'Recebemos seu pedido #{numero_pedido} com sucesso! 💕 Em breve atualizaremos sobre o pagamento e envio. Agradecemos por escolher a Meraki Femme!',
    
    payment_approved_active BOOLEAN DEFAULT TRUE,
    payment_approved_message TEXT DEFAULT 'Pagamento aprovado para o pedido #{numero_pedido}! 🎉 Seu pedido já está sendo preparado com todo carinho.',
    
    payment_pending_active BOOLEAN DEFAULT TRUE,
    payment_pending_message TEXT DEFAULT 'Lembrete: Seu pedido #{numero_pedido} está aguardando pagamento. Garantimos suas peças por poucas horas! Clique aqui para concluir: {link_pagamento}',
    
    order_shipped_active BOOLEAN DEFAULT TRUE,
    order_shipped_message TEXT DEFAULT 'Seu pedido #{numero_pedido} acabou de ser enviado! 📦 Acompanhe pelo código de rastreamento: {codigo_rastreio}',
    
    order_delivered_active BOOLEAN DEFAULT TRUE,
    order_delivered_message TEXT DEFAULT 'Seu pedido #{numero_pedido} foi entregue! 💖 Esperamos que ame cada detalhe. Se puder, nos conte o que achou!',
    
    -- Configurações Clientes Inativos (90 dias)
    inactive_90d_active BOOLEAN DEFAULT TRUE,
    inactive_90d_coupon TEXT DEFAULT 'VOLTEI10',
    inactive_90d_discount_percent NUMERIC(5, 2) DEFAULT 10.00,
    inactive_90d_message TEXT DEFAULT 'Sentimos sua falta na Meraki Femme, {nome}! 💖 Preparamos um presente exclusivo: use o cupom {cupom} e ganhe 10% OFF no seu retorno: {link_loja}',
    
    -- Configurações Pós-Venda (Avaliação & Foto)
    post_sale_active BOOLEAN DEFAULT TRUE,
    post_sale_days INTEGER DEFAULT 5,
    post_sale_message TEXT DEFAULT 'Oiii {nome}! 💕 Já deu tempo de experimentar suas peças da Meraki Femme? Conte-nos o que achou ou nos marque com uma foto usando a peça! Adoramos ver você radiante.',
    
    -- Configurações Aniversário
    birthday_active BOOLEAN DEFAULT TRUE,
    birthday_coupon TEXT DEFAULT 'NIVER15',
    birthday_discount_percent NUMERIC(5, 2) DEFAULT 15.00,
    birthday_message TEXT DEFAULT 'Feliz Aniversário, {nome}! 🎉🎂 A Meraki Femme te deseja um dia inesquecível! Para comemorar, preparamos um presente especial: use o cupom {cupom} e ganhe 15% OFF hoje: {link_loja}',
    
    -- Configurações Lançamento de Coleção
    new_collection_message TEXT DEFAULT 'Novidade fresquinha na Meraki Femme! ✨ Acabamos de lançar nossa nova coleção "{colecao}". Venha conferir antes que esgote: {link_loja}',
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão se não existir
INSERT INTO public.marketing_automations (id) 
VALUES ('default_config') 
ON CONFLICT (id) DO NOTHING;

-- 3. TABELA: abandoned_carts (Carrinhos Abandonados)
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active', -- active, abandoned, recovered, expired
    stage INTEGER DEFAULT 0, -- 0: recém criado, 1: 30m enviado, 2: 24h enviado, 3: 48h enviado
    coupon_generated TEXT DEFAULT '',
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON public.abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_last_activity ON public.abandoned_carts(last_activity);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON public.abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON public.abandoned_carts(customer_phone);

-- 4. TABELA: marketing_logs (Histórico de Envio de Disparos)
CREATE TABLE IF NOT EXISTS public.marketing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel TEXT NOT NULL, -- whatsapp, email
    event_type TEXT NOT NULL, -- cart_30m, cart_24h, cart_48h, order_confirmed, payment_approved, payment_pending, order_shipped, order_delivered, inactive_90d, post_sale, birthday, new_collection
    recipient_email TEXT DEFAULT '',
    recipient_phone TEXT DEFAULT '',
    recipient_name TEXT DEFAULT '',
    message_content TEXT DEFAULT '',
    status TEXT DEFAULT 'sent', -- sent, failed, simulated
    response_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_logs_created_at ON public.marketing_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_logs_event ON public.marketing_logs(event_type);

-- 5. TABELA: stock_alerts (Alertas de Voltou ao Estoque)
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_notified ON public.stock_alerts(notified);

-- 6. POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.marketing_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Remover políticas legadas para recriar com segurança
DROP POLICY IF EXISTS "Permitir leitura pública de automações" ON public.marketing_automations;
DROP POLICY IF EXISTS "Permitir escrita total para admins em automações" ON public.marketing_automations;
DROP POLICY IF EXISTS "Permitir gerenciamento de carrinhos" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Permitir acesso aos logs de marketing" ON public.marketing_logs;
DROP POLICY IF EXISTS "Permitir cadastro em alertas de estoque" ON public.stock_alerts;

-- Leitura e Escrita Permissiva para funcionamento com chave anon/service
CREATE POLICY "Permitir leitura pública de automações" ON public.marketing_automations FOR SELECT USING (true);
CREATE POLICY "Permitir escrita total para admins em automações" ON public.marketing_automations FOR ALL USING (true);

CREATE POLICY "Permitir gerenciamento de carrinhos" ON public.abandoned_carts FOR ALL USING (true);
CREATE POLICY "Permitir acesso aos logs de marketing" ON public.marketing_logs FOR ALL USING (true);
CREATE POLICY "Permitir cadastro em alertas de estoque" ON public.stock_alerts FOR ALL USING (true);

-- Garantir cupons padrão das automações na tabela coupons se existir
INSERT INTO public.coupons (code, value, type, minpurchase)
VALUES 
    ('CARRINHO5', 5, 'percent', 0),
    ('VOLTEI10', 10, 'percent', 0),
    ('NIVER15', 15, 'percent', 0)
ON CONFLICT (code) DO NOTHING;
