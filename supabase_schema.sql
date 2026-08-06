-- ====================================================================
-- MERAKI FEMME - ESQUEMA DE BANCO DE DADOS COMPLETO PARA SUPABASE (SQL)
-- Execute este arquivo no SQL Editor do Supabase para configurar 100%
-- das tabelas, políticas de segurança (RLS), buckets e dados em produção.
-- ====================================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA SETUP SEGURO E LIMPO
SET statement_timeout = 0;
SET client_encoding = 'UTF8';

-- 2. CRIAR EXTENSÃO UUID SE NÃO EXISTIR
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABELA: profiles (Perfis de Usuários/Clientes)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    cpf TEXT,
    address TEXT,
    cep TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    tipo_user TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir todas as colunas se a tabela já existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_user TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ====================================================================
-- TABELA: products (Produtos)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    original_price NUMERIC(10, 2) DEFAULT 0.00,
    image TEXT[] DEFAULT '{}',
    badge TEXT DEFAULT '',
    section TEXT DEFAULT 'featured',
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    stock INTEGER DEFAULT 10,
    inpromocombo BOOLEAN DEFAULT FALSE,
    iscustomizable BOOLEAN DEFAULT FALSE,
    custompricewith NUMERIC(10, 2) DEFAULT 0.00,
    custompricewithout NUMERIC(10, 2) DEFAULT 0.00,
    customfeeletter NUMERIC(10, 2) DEFAULT 0.00,
    customfeenumber NUMERIC(10, 2) DEFAULT 0.00,
    customfeeemoji NUMERIC(10, 2) DEFAULT 0.00,
    customizable_emojis TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir todas as colunas se a tabela já existir
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inpromocombo BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS iscustomizable BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custompricewith NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custompricewithout NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customfeeletter NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customfeenumber NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customfeeemoji NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customizable_emojis TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_kits BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS kit_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_stock JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_images JSONB DEFAULT '{}'::jsonb;

-- ====================================================================
-- TABELA: categories (Categorias da Loja)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    "group" TEXT DEFAULT 'Geral',
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS "group" TEXT DEFAULT 'Geral';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';

-- ====================================================================
-- TABELA: orders (Pedidos realizados)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customername TEXT,
    customeremail TEXT,
    customerphone TEXT,
    customercpf TEXT,
    shippingaddress JSONB,
    paymentmethod TEXT,
    subtotal NUMERIC(10, 2),
    shipping NUMERIC(10, 2),
    discount NUMERIC(10, 2),
    total NUMERIC(10, 2),
    coupon TEXT,
    status TEXT DEFAULT 'Pendente',
    items JSONB DEFAULT '[]'::jsonb,
    tracking_code TEXT DEFAULT '',
    postage_code TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customerphone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customercpf TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shippingaddress JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paymentmethod TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping NUMERIC(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS postage_code TEXT DEFAULT '';

-- ====================================================================
-- TABELA: coupons (Cupons de Desconto)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    type TEXT DEFAULT 'percent',
    minpurchase NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- TABELA: banners (Banners do Carrossel)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image TEXT NOT NULL,
    mobile_image TEXT DEFAULT '',
    alt TEXT DEFAULT '',
    link TEXT DEFAULT '/shop',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS mobile_image TEXT DEFAULT '';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '/shop';

-- ====================================================================
-- TABELA: returns (Trocas e Devoluções)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderid TEXT,
    itemid TEXT,
    customeremail TEXT,
    type TEXT,
    postagecode TEXT,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- TABELA: store_config (Configurações Gerais da Loja)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.store_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    whatsapp TEXT,
    sac_phone TEXT,
    address TEXT,
    cnpj TEXT,
    infinitepay_handle TEXT,
    topbarmessages JSONB DEFAULT '[]'::jsonb,
    topbarstyle JSONB DEFAULT '{}'::jsonb,
    promocombo JSONB DEFAULT '{}'::jsonb,
    editorial JSONB DEFAULT '{}'::jsonb,
    available_colors JSONB DEFAULT '[]'::jsonb,
    available_emojis JSONB DEFAULT '[]'::jsonb,
    shipping_message TEXT,
    available_badges JSONB DEFAULT '[]'::jsonb,
    installment_text TEXT,
    banner_transition TEXT DEFAULT 'shatter',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir todas as colunas para store_config se a tabela já existir
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS sac_phone TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS origin_cep TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS ga_tracking_id TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS infinitepay_handle TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS topbarmessages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS topbarstyle JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS promocombo JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS editorial JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS available_colors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS available_emojis JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS shipping_message TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS available_badges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS installment_text TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS banner_transition TEXT DEFAULT 'shatter';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS reward_bar JSONB DEFAULT '{"enabled": true, "target_type": "value", "target_value": 299.99, "reward_type": "frete_gratis", "reward_title": "Frete Grátis", "success_message": "Parabéns! Você ganhou Frete Grátis!"}'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS category_styles JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS pages_content JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS custom_pages_list JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS deleted_pages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS categories_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS promo_message TEXT DEFAULT '10% OFF na primeira compra com o cupom: BEMVINDA10 (Ganhe R$ 10 OFF)';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS available_sizes JSONB DEFAULT '["U", "Único", "P", "M", "G", "GG", "EGG", "XG", "34", "36", "38", "40", "42", "44", "46", "48", "50"]'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS maintenance_title TEXT DEFAULT 'Estamos Preparando uma Nova Coleção Exclusiva ✨';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'Em breve nosso site estará online com lançamentos apaixonantes e peças de tirar o fôlego.';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS maintenance_eta TEXT DEFAULT 'Em breve';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ====================================================================
-- TABELA: reviews (Avaliações de Produtos)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    comment TEXT,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ====================================================================
-- CONFIGURAÇÃO DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. Criar função de segurança para verificar se o usuário logado é Admin no Banco
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND tipo_user = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REMOVER TODAS AS POLÍTICAS PERMISSIVAS ANTIGAS DE ESCRITA PÚBLICA
DROP POLICY IF EXISTS "Allow public write products" ON public.products;
DROP POLICY IF EXISTS "Allow public write categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public write banners" ON public.banners;
DROP POLICY IF EXISTS "Allow public write coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow public write orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public write returns" ON public.returns;
DROP POLICY IF EXISTS "Allow public write store_config" ON public.store_config;
DROP POLICY IF EXISTS "Allow public write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public write reviews" ON public.reviews;

-- Políticas de Leitura Pública para o E-commerce
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read banners" ON public.banners;
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read store_config" ON public.store_config;
CREATE POLICY "Public read store_config" ON public.store_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

-- 4. POLÍTICAS DA TABELA PROFILES (Perfis de Usuários)
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (
    (auth.uid() = id AND tipo_user = (SELECT tipo_user FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
);

-- 5. POLÍTICAS DE PRODUTOS, CATEGORIAS, BANNERS, CUPONS E CONFIGURAÇÕES
-- Leitura pública | Modificação restrita estritamente a Administradores
DROP POLICY IF EXISTS "Admin write products" ON public.products;
CREATE POLICY "Admin write products" ON public.products FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
CREATE POLICY "Admin write categories" ON public.categories FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write banners" ON public.banners;
CREATE POLICY "Admin write banners" ON public.banners FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write coupons" ON public.coupons;
CREATE POLICY "Admin write coupons" ON public.coupons FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write store_config" ON public.store_config;
CREATE POLICY "Admin write store_config" ON public.store_config FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. POLÍTICAS DE PEDIDOS E TROCAS (ORDERS & RETURNS)
-- Clientes podem criar pedidos | Apenas Admin pode atualizar ou deletar
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
CREATE POLICY "Orders insert policy" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
CREATE POLICY "Orders select policy" ON public.orders FOR SELECT
USING (
    customeremail = auth.jwt() ->> 'email' 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Orders admin update delete" ON public.orders;
CREATE POLICY "Orders admin update delete" ON public.orders FOR UPDATE USING (public.is_admin());

-- ====================================================================
-- CONFIGURAÇÃO DO BUCKET DE STORAGE (IMAGENS DOS PRODUTOS & BANNERS)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas do Storage para Leitura e Upload Público
DROP POLICY IF EXISTS "Public storage read" ON storage.objects;
CREATE POLICY "Public storage read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public storage insert" ON storage.objects;
CREATE POLICY "Public storage insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public storage update" ON storage.objects;
CREATE POLICY "Public storage update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public storage delete" ON storage.objects;
CREATE POLICY "Public storage delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- ====================================================================
-- DADOS INICIAIS (SEED) - CONFIGURAÇÃO, CATEGORIAS E CUPOM DE BOAS-VINDAS
-- ====================================================================
INSERT INTO public.store_config (
    id, whatsapp, sac_phone, address, cnpj, infinitepay_handle,
    topbarmessages, topbarstyle, promocombo, editorial, shipping_message, banner_transition
) VALUES (
    'default',
    '551123880403',
    '(11) 2388-0403',
    'Avenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75225-000',
    '57.484.768/0064-89',
    'merakimodafeminina2026',
    '["✨ Frete Grátis acima de R$ 299 • Parcele em até 12x", "Utilize o cupom BEMVIND010 em sua primeira compra!", "Ganhe 5% de desconto pagando no PIX!"]'::jsonb,
    '{"bgColor": "#C6A76A", "textColor": "#FFFFFF"}'::jsonb,
    '{"title": "Combo Sutiã", "subtitle": "Do P ao EG. Diversos modelos para você escolher.", "image": "/assets/categories/cat-conjuntos.jpg", "price2Items": 139, "price3Items": 169, "link": "/category/promo-combo", "query": "sutiã", "visible": true}'::jsonb,
    '{"label": "Artesanal & Premium", "title": "A arte de se sentir extraordinária.", "description": "Cada costura, cada detalhe em renda foi pensado para elevar sua confiança e celebrar sua beleza única em todos os momentos.", "buttonText": "Ver Manifesto", "buttonLink": "/story", "image": "/assets/banners/banner-2.jpg"}'::jsonb,
    'Frete grátis para a região Centro-Oeste nas compras acima de R$ 299,90.',
    'shatter'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (code, value, type, minpurchase)
VALUES 
    ('BEMVINDA10', 10.00, 'percent', 0.00),
    ('BEMVIND010', 10.00, 'percent', 0.00)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.categories (name, "group", description, image)
VALUES
    ('Conjuntos', 'Geral', 'Conjuntos de lingerie finas e exclusivas', '/assets/categories/cat-conjuntos.jpg'),
    ('Linha Sexy', 'Geral', 'Peças sensuais com renda e transparência', '/assets/categories/cat-sexy.jpg'),
    ('Noite', 'Geral', 'Camisolas, babydolls e robes para suas noites', '/assets/categories/cat-noite.jpg'),
    ('Plus Size', 'Geral', 'Modelagem especial com conforto e elegância', '/assets/categories/cat-plus.jpg'),
    ('Acessórios', 'Geral', 'Cintas-liga, gargantilhas e complementos', '/assets/categories/cat-acessorios.jpg')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.banners (image, mobile_image, alt, link)
VALUES
    ('/assets/banners/banner-1.jpg', '', 'Nova Coleção Meraki - Transforme-se', '/shop'),
    ('/assets/banners/banner-2.jpg', '', 'Estilo e Elegância - Meraki Store', '/shop'),
    ('/assets/banners/banner-3.jpg', '', 'Sua melhor versão com Meraki', '/shop')
ON CONFLICT DO NOTHING;

-- ====================================================================
-- IMPORTAÇÃO DE PRODUTOS DA MERAKI STORE
-- ====================================================================

-- Products import - compatible with current Supabase schema
-- Columns: name, category, price, original_price, image, badge, sizes, section, description, stock, created_at

INSERT INTO public.products (name, category, price, original_price, image, badge, sizes, section, description, stock, created_at)
VALUES
  ('CONJUNTO SANDY PRETO', 'Conjuntos', '94.00', '94.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780356302910_ndu1n9.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780356302910_4ur210.jpg'], '', ARRAY['M','G'], 'featured', 'CONJUNTO TULE PRETO, COM ARO DE SUSTENTAÇÃO ', 10, '2026-03-07 21:34:01.766688+00'),
  ('CONJUNTO KIARA VERMELHO', 'Conjuntos', '96.00', '96.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780353182812_mucbyp.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780353182813_nhqyvm.jpg'], '', ARRAY['P','M','G','GG'], 'featured', 'Delicado, marcante e cheio de personalidade. O conjunto é composto por sutiã sem aro, confeccionado em renda , trazendo conforto e um toque romântico. A calcinha acompanha a proposta sofisticada, enquanto a saia em tule transparente adiciona aquela sensualidade na medida certa. O acabamento em renda na cintura valoriza a silhueta e deixa o visual ainda mais elegante. Completa o conjunto uma gargantilha charmosa para um toque final irresistível. 

Acompanha: sutiã, calcinha, saia e gargantilha.', 10, '2026-03-07 21:34:01.766688+00'),
  ('CONJUNTO MISTÉRIO VERMELHO', 'Conjuntos', '96.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355695529_edqtz0.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355695530_og9wji.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355695530_1r9u10.jpg'], 'NEW', ARRAY['P'], 'featured', 'Conjunto de renda , com aro.
 3 peças.', 10, '2026-03-07 21:34:01.766688+00'),
  ('MODELO KIARA VERMELHHO C/ BOJO', 'Conjuntos', '110.00', '110.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355379680_lpn4nt.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355379680_u48olg.jpg'], 'NEW', ARRAY['P','G','GG'], 'featured', 'Renda trabalhada
Sutiã com bojo e aro
Fecho duplo
Alças reguláveis 

Calcinha de renda
Fio dental
Forro de algodão 

Cinta liga de renda na cintura e pernas
', 10, '2026-03-07 21:34:01.766688+00'),
  ('MODELO KIARA PRETO C/ BOJO', 'Conjuntos', '110.00', '110.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355149492_aypeoh.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355149493_s5idwv.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780355149493_0l8duq.jpg'], 'NEW', ARRAY['M'], 'featured', 'Renda trabalhada
Sutiã com bojo e aro
Fecho duplo
Alças reguláveis 

Calcinha de renda
Fio dental
Forro de algodão 

Cinta liga de renda na cintura e pernas
', 10, '2026-03-07 21:34:01.766688+00'),
  ('BODY SOL VERMELHO', 'Linha Sexy', '99.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780356387197_zaiigu.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780356387197_hv6g73.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780356387198_dnlkt6.jpg'], 'NEW', ARRAY['P','M'], 'featured', '', 10, '2026-06-01 23:26:27.675544+00'),
  ('BODY SOL BRANCO', 'Linha Sexy', '99.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780401530015_z0uhpq.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780401530016_pd35v1.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780401530016_epeqdw.jpg'], 'NEW', ARRAY['G'], 'featured', '', 10, '2026-06-02 11:58:51.755032+00'),
  ('CONJUNTO SAM PRETO', 'Conjuntos', '111.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780402513455_gjnjc0.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780402513455_67qv8b.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780402513455_6o2q7v.jpg'], 'NEW', ARRAY['G'], 'featured', '', 10, '2026-06-02 12:15:21.750595+00'),
  ('CONJUNTO MEL PRETO ', 'Conjuntos', '106.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780402692204_94uq5a.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780402692204_ubp9ps.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780402692204_o2vuaw.jpg'], 'NEW', ARRAY['M'], 'featured', '', 10, '2026-06-02 12:18:13.78594+00'),
  ('CAMISILA SOFIA PRETO ', 'Linha Sexy', '94.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780410707871_0ilxe8.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780410707871_fm2kff.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780410707871_lfsqat.jpeg'], 'NEW', ARRAY['M','G'], 'featured', 'Camisola sexy confeccionada em tule e renda, com alça de regulagem em metal prata e busto sem forro. Tanga regulável confeccionada em tule com o fundo forrado em algodão.

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% Algodão', 10, '2026-06-02 14:28:51.828787+00'),
  ('CONJUNTO SAMYRA PRETO', 'Conjuntos', '99.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780411399034_1esblz.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780411399034_13gqz9.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780411399034_yy6miz.jpeg'], 'NEW', ARRAY['M'], 'featured', 'Conjunto de aro confeccionado em renda, com alça de regulagem em metal prata e colchete duplo. Tanga regulável com cinta liga embutida, fundo forrado em algodão.

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% algodão

', 10, '2026-06-02 14:43:20.95488+00'),
  ('CONJUNTO SAMYRA VERMELHO', 'Conjuntos', '99.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780411818460_r6xszc.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780411818461_18dtxe.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780411818461_ivy7uo.jpeg'], 'NEW', ARRAY['P','G'], 'featured', 'Conjunto de aro confeccionado em renda, com alça de regulagem em metal prata e colchete duplo. Tanga regulável com cinta liga embutida, fundo forrado em algodão.

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% algodão

', 10, '2026-06-02 14:50:20.155454+00'),
  ('CONJ. CORRENTE DO AMOR  VERMELHO', 'Conjuntos', '91.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412201185_g8o112.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412201186_jw1yjw.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412201186_aqg74h.jpeg'], 'NEW', ARRAY['M','G','GG'], 'featured', 'Conjunto confeccionado em renda, com alça de regulagem em metal dourado, alça strappy de corrente em metal dourado, colchete duplo e busto forrado em algodão. Cinta liga regulável com fecho em acrílico. Tanga com 6 alças de regulagem, fundo forrado em algodão.

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliéster, 10% Elastano
Forro 100% algodão.', 10, '2026-06-02 14:56:42.890302+00'),
  ('CONJ. CORRENTE DO AMOR PRETO ', 'Conjuntos', '91.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412475238_5cbrmh.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412475238_2wax3z.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412475238_0236si.jpeg'], 'NEW', ARRAY['M'], 'featured', 'Conjunto confeccionado em renda, com alça de regulagem em metal dourado, alça strappy de corrente em metal dourado, colchete duplo e busto forrado em algodão. Cinta liga regulável com fecho em acrílico. Tanga com 6 alças de regulagem, fundo forrado em algodão.

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliéster, 10% Elastano
Forro 100% algodão.', 10, '2026-06-02 15:01:17.27894+00'),
  ('CONJUNTO PARIS PRETO', 'Conjuntos', '95.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412992836_6yykzf.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412992837_izkc0s.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780412992837_h7kbyp.jfif'], 'NEW', ARRAY['M'], 'featured', 'INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% Algodão', 10, '2026-06-02 15:10:00.692672+00'),
  ('CONJUNTO PARIS VERMELHO', 'Conjuntos', '95.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780413036565_93g9s9.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780413036565_ubbxm7.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780413036565_8m8kt3.jfif'], 'NEW', ARRAY['P','M','G','GG'], 'featured', 'INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% Algodão', 10, '2026-06-02 15:10:38.011164+00'),
  ('CONJUNTO MUSE BRANCO', 'Conjuntos', '95.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780413468825_md8mhi.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780413468825_3dihd1.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780413468825_bthkii.jpeg'], 'NEW', ARRAY['M'], 'featured', 'Conjunto de aro confeccionado em tule e renda, com alça de regulagem em metal prata, amarração de fita de cetim na parte da frente, colchete duplo e busto forrado. Tanga regulável com o fundo forrado em algodão.

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro 100% algodão.', 10, '2026-06-02 15:17:56.542424+00'),
  ('CAMISOLA SEXY EUDORA VERMELHO', 'Linha Sexy', '90.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414198266_gz2qz6.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414198266_alqynf.jfif'], 'NEW', ARRAY['G'], 'featured', 'Camisola confeccionada em tule, com alça de regulagem em metal prata, fecho em acrílico na parte de trás, amarração em fita de cetim nas laterais e busto sem forro. Tanga regulável confeccionada em tule e renda com o fundo forrado em algodão.

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% Algodão.', 10, '2026-06-02 15:20:06.26485+00'),
  ('CAMISOLA BERLIM BRANCO', 'Linha Sexy', '95.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414425401_hs40qw.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414425401_7pck0c.jfif'], 'NEW', ARRAY['M'], 'featured', 'Camisola de aro confeccionada em tule e renda, com alça de regulagem em metal dourado e busto sem forro. Tanga regulável confeccionada em tule com o fundo forrado em algodão.

Pingente coração dourado

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% algodão.', 10, '2026-06-02 15:33:47.307797+00'),
  ('CAMISOLA BERLIM VERMELHO ', 'Linha Sexy', '95.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414493161_wte643.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414493161_arvsui.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414493161_ds6l3b.jfif'], 'NEW', ARRAY['M'], 'featured', 'Camisola de aro confeccionada em tule e renda, com alça de regulagem em metal dourado e busto sem forro. Tanga regulável confeccionada em tule com o fundo forrado em algodão.

Pingente coração dourado

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% algodão', 10, '2026-06-02 15:34:54.72105+00'),
  ('CAMISOLA BERLIM PRETO', 'Linha Sexy', '95.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414621278_wd848a.jfif','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780414621278_65iuq5.jfif'], 'NEW', ARRAY['G'], 'featured', 'Camisola de aro confeccionada em tule e renda, com alça de regulagem em metal dourado e busto forrado em algodão. Tanga regulável confeccionada em tule com o fundo forrado em algodão.

Pingente coração dourado

INSTRUÇÕES DE LAVAGEM:

- Lavar à mão
- Não usar alvejante
- Não passar
- Não usar secadora
- Não lavar à seco
- Secar à sombra

COMPOSIÇÃO:
90% Poliamida, 10% Elastano
Forro: 100% algodão', 10, '2026-06-02 15:37:05.568058+00'),
  ('Fantasia Sensual Empregada Ousada Pimenta Sexy', 'Linha Sexy', '100.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424680409_6wabo5.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424680409_mjvhim.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fantasia Sensual Empregada Ousada Da Pimenta Sexy
A Fantasia Sensual Empregada Ousada Da Pimenta Sexy é perfeita para quem deseja unir elegância, ousadia e erotismo em uma única peça. Com design marcante, esta fantasia valoriza suas curvas e exala atitude, sendo ideal tanto para festas temáticas quanto para momentos íntimos que pedem um toque especial de sedução.

Características principais
Design irresistível: Combina estilo e ousadia para destacar sua silhueta e refletir autoconfiança.
Tamanho único: Veste do P ao G, garantindo caimento confortável e liberdade de movimento.
Versatilidade: Ideal para ocasiões íntimas, eventos especiais ou festas temáticas em que você deseja surpreender.
Cuidados com a peça
Lavar à mão: Mantém a qualidade e prolonga a durabilidade do tecido.
Evite: Produtos químicos agressivos e o uso de secadoras.
Secagem natural: Seque à sombra em temperatura ambiente para preservar cores e textura.
Com a Fantasia Sensual Empregada Ousada Da Pimenta Sexy, você desperta fantasias e cria experiências únicas de sedução e prazer. Uma peça feita para destacar seu poder de encantar e envolver.

Garanta já a sua Fantasia Empregada Ousada e viva noites inesquecíveis com muito charme, estilo e ousadia!', 10, '2026-06-02 16:32:35.864624+00'),
  ('Fantasia Sensual Empregada Da Noite Pimenta Sexy', 'Linha Sexy', '100.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424602914_lm7k3d.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424602914_gbilsp.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424602914_f7m2ru.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fantasia Sensual Empregada da Noite Pimenta Sexy
A Fantasia Sensual Empregada da Noite da Pimenta Sexy é a escolha ideal para quem deseja unir charme, diversão e sedução em um visual marcante. Perfeita para festas temáticas, Carnaval ou Halloween, garante um look irresistível e cheio de personalidade.

Ajuste Perfeito
Com tamanho único que veste do P ao G, a Fantasia Empregada da Noite oferece caimento confortável, realçando suas curvas e permitindo total liberdade para dançar, brincar e seduzir.

Diferenciais da Fantasia
Visual ousado e divertido que garante destaque em qualquer festa.
Tecido confortável e ajustável ao corpo.
Ideal para momentos de descontração e jogos de sedução.
Peça versátil para diferentes ocasiões e fantasias temáticas.
Cuidados com a Peça
Lave manualmente para manter a durabilidade do tecido.
Evite produtos químicos agressivos e o uso de secadoras.
Deixe secar à sombra em temperatura ambiente para preservar a cor e o brilho.
Sedução e Diversão em Uma Só Fantasia
A Fantasia Empregada da Noite Pimenta Sexy vai transformar sua noite em um espetáculo de ousadia e estilo. Garanta já a sua e prepare-se para conquistar todos os olhares!', 10, '2026-06-02 16:45:08.43408+00'),
  ('Fantasia Sensual Médica Do Amor Pimenta Sexy', 'Linha Sexy', '100.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424400107_l7agw9.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424400108_9klzsr.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fantasia Sensual Médica do Amor da Pimenta Sexy – Ousadia, Diversão e Sensualidade em Uma Peça Exclusiva
A Fantasia Sensual Médica do Amor da Pimenta Sexy é a escolha ideal para quem deseja brilhar em festas temáticas, Carnaval, Halloween ou momentos de pura sedução. Com design encantador e toque provocante, esta fantasia desperta a imaginação e transforma qualquer ocasião em uma experiência inesquecível. O tamanho único veste do P ao G, proporcionando ajuste confortável e destacando suas curvas com elegância. Sinta-se confiante, livre para dançar e esbanjar charme com o visual sedutor e divertido da Fantasia Médica do Amor.

Benefícios
Visual provocante e estiloso: design pensado para destacar o corpo e valorizar as curvas.
Conforto e ajuste perfeito: tamanho único que veste do P ao G, adaptando-se a diferentes biotipos com liberdade e segurança.
Versatilidade para diferentes ocasiões: ideal para festas temáticas, eventos, fantasias de Carnaval ou momentos íntimos.
Modo de Uso
Vista a Fantasia Médica do Amor ajustando-a de acordo com o caimento desejado. Use com confiança e divirta-se criando momentos únicos e inesquecíveis.

Composição
Material: Informações não especificadas.

Cuidados e Manutenção
Lave à mão com cuidado para preservar a qualidade do tecido.
Evite produtos químicos agressivos e o uso de secadoras.
Seque à sombra, em temperatura ambiente, para manter as cores vibrantes e evitar o desbotamento.', 10, '2026-06-02 16:48:38.140442+00'),
  ('Fantasia Sensual Garçonete Safadinha Pimenta Sexy', 'Linha Sexy', '100.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780419681347_j2f88s.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780419681347_zys9g0.jpg'], 'NEW', ARRAY['UNICO'], 'featured', 'Fantasia Sensual Garçonete Safadinha Pimenta Sexy
Charme e Ousadia para Servir Sedução
A Fantasia Sensual Garçonete Safadinha Pimenta Sexy é perfeita para quem deseja ser o centro das atenções com muito estilo e sensualidade. Com um design provocante e divertido, ela transforma qualquer ocasião em um momento de pura tentação. Seja para uma festa temática ou uma noite especial, esta fantasia é sinônimo de atitude e desejo.

Tamanho Único
Veste do P ao G com caimento ajustado, valorizando as curvas femininas com conforto e liberdade de movimento. Ideal para quem quer brilhar com confiança em qualquer ambiente.

Benefícios da Fantasia
Design sensual e temático que desperta olhares e desejos.
Tecido leve e confortável que se adapta ao corpo com perfeição.
Perfeita para festas, encontros íntimos e brincadeiras ousadas.
Cuidados com a Peça
Lave à mão com sabão neutro para preservar a qualidade do tecido.
Evite o uso de produtos agressivos e não utilize secadoras.
Seque à sombra em temperatura ambiente para manter as cores vibrantes.
Seduza com Elegância e Irreverência
Com a Fantasia Garçonete Safadinha, você vai servir charme, diversão e sensualidade em doses generosas. Liberte seu lado mais ousado e viva momentos de pura fantasia com estilo e personalidade.', 10, '2026-06-02 17:01:23.272882+00'),
  ('Fantasia Sensual Fazendeira Pimenta Sexy', 'Linha Sexy', '100.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424564786_xzj33y.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424564786_6c47y1.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fantasia Sensual Fazendeira Da Pimenta Sexy – Charme, Sedução e Diversão para Sua Festa à Fantasia
Entre no clima do campo com a Fantasia Fazendeira Da Pimenta Sexy, uma peça irresistível que combina charme rústico e sensualidade para mulheres que desejam se destacar com estilo e atitude. Ideal para festas temáticas, carnaval ou eventos especiais, essa fantasia é o toque perfeito para transformar seu visual e incendiar qualquer ambiente com sua presença marcante.

Tamanho Único que Valoriza suas Curvas
Desenvolvida para vestir do P ao G, a fantasia se ajusta perfeitamente ao corpo, realçando suas formas de maneira confortável e elegante. Seu design pensado para proporcionar liberdade total de movimento faz com que você se sinta confiante e poderosa durante toda a festa.

Design e Materiais que Encantam
Detalhes Autênticos: Elementos que remetem ao universo da fazenda com estilo sexy e divertido, como tecidos texturizados e acessórios delicados que complementam o look.
Tecido Confortável: Material de qualidade que não irrita a pele, garantindo conforto durante o uso prolongado.
Acabamento Refinado: Costuras resistentes e acabamento que mantém a fantasia perfeita mesmo após várias festas.
Cuidados para Preservar sua Fantasia
Lave à mão delicadamente para evitar danos e preservar a textura e cores.
Evite produtos químicos agressivos e secadoras, que podem desgastar o tecido.
Deixe secar naturalmente à sombra para manter a vivacidade das cores e o brilho da peça.
Benefícios que Fazem a Diferença
Visual Único e Impactante: Surpreenda e conquiste com um look que combina diversão e sensualidade.
Versatilidade: Perfeita para diversos eventos, desde festas à fantasia até encontros especiais.
Conforto e Qualidade: Curta a festa com liberdade de movimentos e sensação agradável na pele.
Transforme Sua Presença e Viva Momentos Inesquecíveis
Com a Fantasia Fazendeira Da Pimenta Sexy, cada olhar será para você. Sinta a emoção de se destacar, despertar olhares e esbanjar confiança com uma peça que traduz sua personalidade única. Não espere mais para criar memórias inesquecíveis em festas e ocasiões especiais.', 10, '2026-06-02 17:03:25.188934+00'),
  ('Fantasia Sensual Estudante Ousada Pimenta Sexy', 'Conjuntos', '115.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780420098644_qlodo4.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780420098644_0i1hum.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780420098644_4rydde.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fantasia Sensual Estudante Ousada Pimenta Sexy
A Fantasia Sensual Estudante Ousada da Pimenta Sexy é perfeita para quem deseja unir estilo, ousadia e sedução em um visual irresistível. Com design provocante e detalhes encantadores, essa fantasia vai destacar sua autenticidade e transformar qualquer ocasião em um momento marcante.

Diferenciais da Fantasia Estudante Ousada
Tamanho único que veste do P ao G com ajuste perfeito.
Design sensual que valoriza suas curvas com ousadia.
Ideal para festas temáticas, comemorações especiais e noites de sedução.
Peça confortável e envolvente, pensada para mulheres confiantes.
Cuidados com a Peça
Lave manualmente para preservar a qualidade do tecido.
Evite produtos químicos agressivos e não utilize secadoras.
Deixe secar naturalmente à sombra para manter as cores vibrantes.
Ousadia e Estilo em Cada Detalhe
A Fantasia Estudante Ousada Pimenta Sexy é a escolha certa para mulheres que querem ser o centro das atenções e exalar poder e sensualidade. Garanta já a sua e brilhe em qualquer ocasião!', 10, '2026-06-02 17:08:19.957146+00'),
  ('Fantasia Sensual Vaqueira Mary Pimenta Sexy', 'Linha Sexy', '115.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780420249193_tu9u1t.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780420249193_n8853m.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780420249193_s47bka.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fantasia Sensual Vaqueira Mary Da Pimenta Sexy
A Fantasia Sensual Vaqueira Mary Da Pimenta Sexy é a escolha ideal para quem deseja unir charme rústico, ousadia e sensualidade. Inspirada no estilo vaqueira, esta fantasia valoriza suas curvas e transmite confiança, tornando-se perfeita para festas temáticas, eventos sociais e encontros especiais cheios de autenticidade.

Características principais
Design charmoso: Inspirado no estilo vaqueira, com detalhes que destacam atitude e feminilidade.

Tamanho único: Veste confortavelmente do P ao G, 

garantindo ajuste perfeito e liberdade de movimento.
Versatilidade: Ideal para festas à fantasia, ocasiões especiais ou momentos em que você deseja surpreender.

Cuidados com a peça
Lavar à mão: Preserva a qualidade do tecido e aumenta a durabilidade da peça.
Evite: Produtos químicos agressivos e o uso de secadoras.
Secagem natural: Deixe secar à sombra em temperatura ambiente para manter as cores intensas e vibrantes.

Com a Fantasia Sensual Vaqueira Mary Da Pimenta Sexy, você esbanja confiança e transforma qualquer ocasião em um momento de sedução, autenticidade e estilo. Uma peça feita para mulheres que adoram ser o centro das atenções.

Garanta já a sua Fantasia Vaqueira Mary e viva experiências únicas com muito charme rústico, ousadia e personalidade!', 10, '2026-06-02 17:10:50.485998+00'),
  ('Fantasia Sensual Estudante Anime Pimenta Sexy', 'Linha Sexy', '115.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780423927763_gsrycs.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780423927763_40alzs.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fantasia Sensual Estudante Anime Pimenta Sexy
A Fantasia Sensual Estudante Anime da Pimenta Sexy é a escolha perfeita para quem deseja unir magia, diversão e sensualidade em um único look. Inspirada no universo encantador dos animes, essa peça transforma qualquer momento em uma experiência marcante, seja em festas temáticas, cosplay ou encontros especiais.

Tamanho Único e Ajuste Confortável
Com tamanho único que veste do P ao G, a Fantasia Estudante Anime valoriza sua silhueta de forma elegante, oferecendo caimento seguro e liberdade de movimento. Você vai se sentir confiante, estilosa e pronta para arrasar.

Destaques da Fantasia
Estilo anime que traz charme, ousadia e um toque divertido.
Modelagem versátil, perfeita para festas à fantasia, eventos de cosplay ou momentos íntimos.
Conforto e estilo em uma peça que realça sua personalidade.
Cuidados com sua Fantasia
Lave à mão para preservar o tecido e os detalhes.
Evite produtos químicos agressivos e o uso de secadoras.
Seque à sombra, em temperatura ambiente, para manter as cores vivas e vibrantes.', 10, '2026-06-02 17:14:10.234319+00'),
  ('Fio Dental Transp Hello Kitty Halloween Pimenta Sexy', 'Linha Sexy', '20.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780421841869_gd09o1.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780421841870_brxd3t.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fio Dental Hello Kitty Halloween Pimenta Sexy
Encante-se com a Tanga Hello Kitty Halloween da Pimenta Sexy, uma lingerie criada para unir sensualidade, diversão e ousadia. Com seu design exclusivo e temático, ela traz o charme da Hello Kitty em uma versão provocante, perfeita para celebrar o Halloween com estilo irresistível e criativo.

Confeccionada em tecido leve e macio, oferece ajuste confortável e valoriza suas curvas de forma natural. Seja em momentos íntimos ou em festas temáticas, essa peça é a escolha certa para surpreender e despertar desejos.

Benefícios
Design exclusivo: Hello Kitty em clima de Halloween para um visual divertido e sedutor.
Conforto incomparável: Tecido macio que garante liberdade de movimentos.
Tamanho único: Veste do P ao G com elasticidade perfeita ao corpo.
Versatilidade: Ideal para fantasias, datas especiais ou para apimentar o dia a dia.

Cuidados com a Peça

Lave à mão: Utilize sabão neutro para preservar o tecido.
Não utilize: Cloro ou secadora, que podem danificar a peça.
Secagem correta: Deixe secar à sombra para manter as cores vivas.
Informações TécnicasModelo: Fio dental temático Halloween
Tamanho: Único (veste do P ao G)
Categoria: Lingerie sensual e divertida
Marca: Pimenta Sexy', 10, '2026-06-02 17:37:23.135108+00'),
  ('Fio Dental Transp Sapinho Love Pimenta Sexy', 'Linha Sexy', '20.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780422163688_9ktdel.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780422163688_d8xogp.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fio Dental Sapinho Love Pimenta Sexy
A Tanga Sapinho Love da Pimenta Sexy foi desenvolvida para mulheres que buscam o equilíbrio perfeito entre conforto, estilo e delicadeza. Com um design moderno e detalhes encantadores, essa lingerie valoriza suas curvas de forma sutil, criando um visual leve e sedutor que se adapta com suavidade ao seu corpo.

Versátil e charmosa, é ideal para o dia a dia, momentos de relaxamento ou para adicionar um toque divertido e sensual ao seu visual. Uma peça que desperta feminilidade e confiança em qualquer ocasião.

Benefícios
Design encantador: Estilo divertido com toque moderno e feminino.
Conforto garantido: Tecido leve que se ajusta perfeitamente ao corpo.
Tamanho único: Veste do P ao G com elasticidade que se adapta às curvas.
Versátil: Perfeita para o dia a dia ou para surpreender em momentos especiais.
Cuidados com a Peça
Lave à mão: Utilize sabão neutro para preservar a delicadeza do tecido.
Evite: Não use cloro e não coloque em secadora.
Secagem ideal: Seque à sombra para manter as cores vivas e a elasticidade.
Informações Técnicas
Modelo: Fio dental Sapinho Love
Tamanho: Único (veste do P ao G)
Categoria: Lingerie divertida e feminina
Marca: Pimenta Sexy
Realce Sua Autoestima
Mais que uma lingerie, a Tanga Sapinho Love é uma forma leve e divertida de expressar sua personalidade. Sinta-se confiante, charmosa e radiante em todos os momentos. Garanta já a sua e viva a combinação perfeita de conforto, estilo e sensualidade!', 10, '2026-06-02 17:42:45.508381+00'),
  ('Fio Dental Transp Cute Blossom Pimenta Sexy', 'Linha Sexy', '20.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780494354492_6hzacg.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780494354493_qzwko5.webp'], 'NEW', ARRAY['U'], 'featured', 'Fio Dental Transp Cute Blossom – Pimenta Sexy
A Fio Dental Transp Cute Blossom da Pimenta Sexy é a lingerie ideal para quem busca delicadeza, feminilidade e conforto em uma única peça. Com design floral encantador e toque romântico, essa tanga fio dental valoriza as curvas com sutileza e estilo, tornando-se perfeita para o uso diário ou para momentos em que você deseja se sentir ainda mais especial.

Características do Produto
Design Feminino: Estampa delicada e romântica que transmite suavidade e charme.
Modelagem Fio Dental: Caimento perfeito que valoriza o corpo com sensualidade discreta.
Tecido Confortável: Macio, leve e com elasticidade ideal para o dia a dia.
Tamanho Único: Veste P, M e G, adaptando-se facilmente às curvas com conforto.
Indicações de Uso
Para o dia a dia com elegância e praticidade
Momentos de autocuidado e bem-estar
Looks íntimos com estilo romântico e delicado
Presente encantador para surpreender com carinho
Cuidados com a Peça
Lavagem: Lavar à mão com sabão neutro para preservar o tecido
Não usar: Cloro ou alvejantes
Secagem: Secar à sombra em temperatura ambiente
Evite: Exposição direta ao sol e uso de secadora para manter as cores vivas
Contém na Embalagem
01 Tanga fio dental modelo Cute Blossom
A Fio Dental Transp Cute Blossom da Pimenta Sexy é perfeita para quem deseja unir conforto, estilo e romantismo em uma só peça. Leve e versátil, ela acompanha você em todos os momentos, realçando sua beleza natural com delicadeza e charme.', 10, '2026-06-02 17:46:06.323537+00'),
  ('Fio Dental Perereca Carente Pimenta Sexy', 'Linha Sexy', '20.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424983642_wwmux2.jpg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780424983642_jwgnms.jpg'], 'NEW', ARRAY['U'], 'featured', 'Fio Dental Perereca Carente Pimenta Sexy
A Tanga Perereca Carente da Pimenta Sexy é a escolha perfeita para quem deseja unir conforto, sensualidade e estilo no dia a dia. Com design envolvente e delicado, valoriza suas curvas de forma natural, despertando feminilidade e autoconfiança.

Confeccionada em tecido leve e macio, oferece ajuste impecável e liberdade de movimentos. Seja para momentos de relaxamento ou para compor um visual marcante, essa lingerie garante charme e praticidade em qualquer ocasião.

Benefícios
Toque sensual: Design que valoriza o corpo com ousadia e delicadeza.
Conforto diário: Tecido suave que proporciona bem-estar prolongado.
Tamanho único: Veste do P ao G com elasticidade perfeita.
Versatilidade: Ideal para uso diário ou em momentos íntimos especiais.
Cuidados com a Peça
Lave à mão: Utilize sabão neutro para preservar a qualidade do tecido.
Evite: Não use cloro e não coloque em secadora.
Secagem correta: Seque à sombra em temperatura ambiente para manter as cores e a elasticidade.
Informações Técnicas
Modelo: Fio dental Perereca Carente
Tamanho: Único (veste do P ao G)
Categoria: Lingerie sensual feminina
Marca: Pimenta Sexy', 10, '2026-06-02 17:48:57.75394+00'),
  ('CONJ PLUMA DE AMOR', 'Conjuntos', '164.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780492094082_qkv66h.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780492094082_gukyt9.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780492094083_93u8py.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780492094083_3ryy37.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1780492094083_09omz4.webp'], 'NEW', ARRAY['G'], 'best-sellers', 'O Conjunto está disponível no tamanho G. O Sutiã com aro e sem bojo feito no tule bordado; alças com regulagem em metal em modelo de coração. A calcinha modelo extra fio, tule na frete e lação atrás com alça para personalizar com os nossos passantes em metal cor ouro, possui forro 100% Algodão na parte baixa.
Acompanha PERSEX. 

TAMANHO: G (44).', 10, '2026-06-03 13:08:16.293722+00'),
  ('Conjunto Sem Bojo C/ Aro Personalizavel ', 'Conjuntos', '169.99', '169.99', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782247491757_qagzz6.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782247491758_qbemzu.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782247491758_ea8xwn.webp'], 'NEW', ARRAY['G'], 'best-sellers', 'O Sutiã com aro e sem bojo feito no tule bordado na frente e na renda parte de trás; alças com regulagem em metal em modelo de coração. A calcinha modelo fio parte de trás na renda e toda no tule na frente com duas alças na regulagem lateral e com alça atrás para personalizar com os nossos passantes em metal cor ouro, possui forro 100% Algodão na parte baixa.

 OBS: valor incluso com personalização.

TAMANHO: G (44).', 10, '2026-06-23 20:44:13.913806+00'),
  ('CINTA LIGA PERSONALIZÁVEL', 'Fitness', '25.00', '25.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782248005362_14wbgd.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'CINTA LIGA PERSONALIZÁVEL 

A peça ideal para quem gosta de sensualidade, versatilidade e exclusividade. Chegou para transformar seu look com um toque de ousadia e personalidade.                                                                                                                          Personalização fácil e divertida! Você pode optar por colocar as letras na frente ou atrás, criando combinações exclusivas que refletem sua personalidade. Lembre-se: as letras não acompanham a peça, é necessário adquiri-las separadamente para personalizar sua Cinta Liga.', 10, '2026-06-23 20:53:26.725627+00'),
  ('CINTA LIGA PERSONALIZÁVEL VERMELHO', 'Fitness', '25.00', '25.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782248205577_q096qt.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782248205577_kfiuuz.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'CINTA LIGA PERSONALIZÁVEL 

A peça ideal para quem gosta de sensualidade, versatilidade e exclusividade. Chegou para transformar seu look com um toque de ousadia e personalidade.                                                                                                                          Personalização fácil e divertida! Você pode optar por colocar as letras na frente ou atrás, criando combinações exclusivas que refletem sua personalidade. Lembre-se: as letras não acompanham a peça, é necessário adquiri-las separadamente para personalizar sua Cinta Liga.', 10, '2026-06-23 20:56:46.448168+00'),
  ('CHOKER PERSONALIZÁVEL VERMELHO', 'Fitness', '20.00', '20.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782249162987_wn4u1f.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'CHOKER OU PERSEXY               
                                                                                                                                         Como usar:                                                                                              
No pescoço para um visual marcante e sofisticado
Na perna para um toque extra de sensualidade e exclusividadeImportante: A gargantilha não acompanha as letras para personalização. Para criar seu estilo único, adquira as letras separadamente em nossa categoria de acessórios.', 10, '2026-06-23 21:12:43.712698+00'),
  ('CHOKER PERSONALIZÁVEL PRETO', 'Fitness', '20.00', '20.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782249373893_fnt0hz.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'CHOKER OU PERSEXY            
                                                                                                                                            Como usar:                                                                                              
No pescoço para um visual marcante e sofisticado
Na perna para um toque extra de sensualidade e exclusividadeImportante: A gargantilha não acompanha as letras para personalização. Para criar seu estilo único, adquira as letras separadamente em nossa categoria de acessórios.', 10, '2026-06-23 21:16:14.793014+00'),
  ('FIO PERSONALIZAVEL TULE PÉTALA DUPLO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782250401471_qxay7r.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL
Fio Personalizado duplo na microfibra em poliamida e tule bordado na frente; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

OBS: Valor incluso com personalização.

U veste do P ao GG', 10, '2026-06-23 21:33:21.846206+00'),
  ('FIO PERSONALIZAVEL TULE CORAÇÃO DUPLO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782250612766_10s9iy.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado duplo na microfibra em poliamida e tule bordado na frente; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso com personalização.

U veste do P ao GG', 10, '2026-06-23 21:36:53.397224+00'),
  ('FIO PERS. LANTEJOULA TULE LISO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782251934241_dg8pzz.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782251934241_6549zz.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra fino com detalhe bordado e aplicação de lantejoulas; parte da frente em Tule Liso. Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização. 

U veste do P ao GG', 10, '2026-06-23 21:58:55.269179+00'),
  ('Fio PERS. LANTEJOULA TULE LISO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782252683100_t8esji.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782252683100_zzk8qk.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra fino com detalhe bordado e aplicação de lantejoulas; parte da frente em Tule Liso. Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 22:11:24.40173+00'),
  ('FIO PERS. LULU - TULE PETALA ROSE', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782253199543_a4geps.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 22:20:07.037714+00'),
  ('FIO PERS. LULU - TULE CORAÇÃO MARRON', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782254942596_frm6s5.jpeg'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 22:49:03.426899+00'),
  ('FIO PERSONALIZAVEL TULE PÉTALA DUPLO ', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782254992326_ukogcr.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 22:49:53.182105+00'),
  ('FIO PERS. LULU - TULE CORAÇÃO BRANCO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782255535821_bmr69x.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL
Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 22:58:56.454279+00'),
  ('FIO PERS. LULU - TULE CORAÇÃO PINK NEON ', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782255769795_yn478r.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:02:50.524903+00'),
  ('FIO PERS. LULU - TULE CORAÇÃO PRETO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782256065545_iyjxb8.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782256065545_cuhyb2.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782256065545_t8q608.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:07:46.248882+00'),
  ('FIO PERS. LULU - TULE CORAÇÃO VERMELHO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782256734487_43416j.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782256734487_biu4zi.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:18:54.913399+00'),
  ('FIO PERSONALIZAVEL TULE CORAÇÃO DUPLO VERMELHO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782257093151_ztrtyv.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:25:00.072634+00'),
  ('FIO PERSONALIZAVEL TULE PÉTALA DUPLO ', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782257380517_njflx7.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782257380518_kht9v0.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782257380518_txce7u.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:29:40.894032+00'),
  ('FIO PERSONALIZAVEL TULE PÉTALA DUPLO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782257497422_11nqsm.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782257497423_4lrs4k.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL

Fio Personalizado extra Fino todo no tule bordado; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:31:44.75833+00'),
  (' FIO PERSONALIZAVEL SECRETÁRIA - BEIJO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782258027507_d263b1.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL - SECRETÁRIA

Fio Personalizavel todo no tule; detalhe em pingente na parte da frete (pingente pode variar) abertura na parte baixa. Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:40:28.43316+00'),
  ('FIO PERSONALIZAVEL SECRETÁRIA - ROSAS VERMELHO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782259015583_dhb5ip.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL - SECRETÁRIA

Fio Personalizavel todo no tule; detalhe em pingente na parte da frete (pingente pode variar) abertura na parte baixa. Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:56:56.006912+00'),
  ('FIO PERSONALIZAVEL SECRETÁRIA - ROSAS BRANCO', 'Linha Sexy', '60.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782259131266_4seqca.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL - SECRETÁRIA

Fio Personalizavel todo no tule; detalhe em pingente na parte da frete (pingente pode variar) abertura na parte baixa. Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-23 23:58:51.962975+00'),
  ('FIO PERSONALIZAVEL SECRETÁRIA -BEIJO VERMELHO', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782332538245_1fk0qh.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL - TULE
Fio Personalizado todo no tule fino; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs:Valor incluso personalização.

TAMAHO: U,veste,do,P,ao,GG', 10, '2026-06-24 19:08:01.667708+00'),
  ('FIO PERSONALIZAVEL - LAÇO VERMELHO ', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782328723696_o2k9lg.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782328723696_mg9l54.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL - LAÇO 

Fio Personalizado todo no tule fino com detalhe atrás em laço de cetim; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-24 19:18:44.596264+00'),
  ('FIO PERSONALIZAVEL - LAÇO PERTO ', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782328859148_ikdqvq.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782328859149_cjcxa2.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782328859149_pwpw0k.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL - LAÇO 

Fio Personalizado todo no tule fino com detalhe atrás em laço de cetim; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: Valor incluso personalização.

U veste do P ao GG', 10, '2026-06-24 19:21:00.450846+00'),
  ('FIO PERSONALIZAVEL RENDA LILÁS ', 'Linha Sexy', '60.00', '60.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782329356198_wac2q6.webp'], 'NEW', ARRAY['U'], 'best-sellers', 'FIO PERSONALIZAVEL - RENDA

Fio Personalizado todo na renda; Compre e personalize com a palavra que quiser usando os nossos passador de letras ouro 10mm. Ou use sem personalizar como desejar. 

Contém:

1 Fio Regulável com tira atrás para personalização.

Obs: VALOR INCLUSO PERSONALIZAÇÃO.

U veste do P ao GG', 10, '2026-06-24 19:29:17.84129+00'),
  ('CONJUNTO LINDA VERMELHO PLUZ', 'Conjuntos', '95.00', '95.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782402413775_eqkadn.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782402413776_3o50lh.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782402413776_27h61o.webp'], 'NEW', ARRAY['46/48'], 'new-collection', 'Apresentamos a Lingerie Linda, uma peça que une conforto e sensualidade para transformar suas noites em momentos inesquecíveis. Ideal para quem busca uma lingerie que realça a beleza com um toque especial.

SOBRE O PRODUTO:
Design Elegante: O conjunto é composto por um sutiã de rendinha forrado com algodão, que valoriza o busto com um toque suave e delicado. As manguinhas de renda adicionam um charme extra à peça.

Calcinha Tanguinha: A calcinha de estilo fio dental traz um design de amarração nas laterais, permitindo um ajuste personalizado e confortável, enquanto exala uma sensualidade irresistível.

Materiais de Qualidade: Confeccionada em microfibra e renda premium, a Lingerie Linda oferece uma maciez excepcional, garantindo que você se sinta bem a noite toda.

Detalhes Sofisticados: O lindo laço de cetim e os detalhes em renda tornam essa lingerie uma verdadeira obra de arte para suas noites.

Dicas de Estilo:
Combine a Lingerie Linda com um robê leve ou uma peça de sobreposição para um visual que mistura elegância e sensualidade.

TAMANHO:

BUSTO: 90CM à 110CM
CINTURA: 85CM à 100CM
QUADRIL: 110CM à 120CM

Transforme suas noites com a Lingerie Linda e sinta-se deslumbrante em cada momento. Adicione ao seu carrinho e permita-se viver essa experiência luxuosa!', 10, '2026-06-25 15:17:01.097186+00'),
  ('CONJUNTO LINDA PETO PLUZ', 'Conjuntos', '95.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782402296443_2frl1f.webp','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782402296444_w1a1ey.webp'], 'NEW', ARRAY['46/48'], 'new-collection', 'Apresentamos a Lingerie Linda, uma peça que une conforto e sensualidade para transformar suas noites em momentos inesquecíveis. Ideal para quem busca uma lingerie que realça a beleza com um toque especial.

SOBRE O PRODUTO:
Design Elegante: O conjunto é composto por um sutiã de rendinha forrado com algodão, que valoriza o busto com um toque suave e delicado. As manguinhas de renda adicionam um charme extra à peça.

Calcinha Tanguinha: A calcinha de estilo fio dental traz um design de amarração nas laterais, permitindo um ajuste personalizado e confortável, enquanto exala uma sensualidade irresistível.

Materiais de Qualidade: Confeccionada em microfibra e renda premium, a Lingerie Linda oferece uma maciez excepcional, garantindo que você se sinta bem a noite toda.

Detalhes Sofisticados: O lindo laço de cetim e os detalhes em renda tornam essa lingerie uma verdadeira obra de arte para suas noites.

Dicas de Estilo:
Combine a Lingerie Linda com um robê leve ou uma peça de sobreposição para um visual que mistura elegância e sensualidade.

TAMANHO:

BUSTO: 90CM à 110CM
CINTURA: 85CM à 100CM
QUADRIL: 110CM à 120CM

Transforme suas noites com a Lingerie Linda e sinta-se deslumbrante em cada momento. Adicione ao seu carrinho e permita-se viver essa experiência luxuosa!', 10, '2026-06-25 15:19:17.883306+00'),
  ('CONJUNTO FLOWER PETO PLUZ', 'Conjuntos', '100.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782401827608_mm6ez4.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782401827608_t3ngtg.jpeg'], 'NEW', ARRAY['46/48'], 'new-collection', 'Conjunto o mais sensual e perfeito de todos.Confeccionado em tule transparente na parte do busto com detalhe de flor em 3D bordado, conjunto impecável, agora com uma calcinha mais larguinha não te deixando desconfortável na parte de baixo pra quem quer ser sexy,confiante e confortável!

SOBRE O PRODUTO:

Tule com transparência no busto
Bordado em 3D, detalhe de flor
Aro de sustenatação , deixando o busto super enpinado
Fecho nas costas, com duas opções de regulagens 
Alças reguláveis, para se adaptar da melhor forma
Calcinha fio dental com laterais larguinhas.
Leve esse conjunto e descubra o sucessooo de vendas!!!!

TAMANHO:

BUSTO: 90CM à 110CM
CINTURA: 85CM à 100CM
QUADRIL: 110CM à 120CM', 10, '2026-06-25 15:37:15.015248+00'),
  ('CONJUNTO MARIE PETO E FERRUGEM PLUS', 'Conjuntos', '100.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782404810922_66odme.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782404810923_yc7aq8.jpeg'], 'NEW', ARRAY['46/48'], 'new-collection', 'Uma lingerie impecável que une a delicadeza da renda bicolor com a sofisticação e o toque sedutor do tule.
Sutiã com aro de sustentação e alças reguláveis para um ajuste perfeito e conforto o dia todo. Calcinha de renda floral confortável.

TAMANHO:

BUSTO: 90CM à 110CM
CINTURA: 85CM à 100CM
QUADRIL: 110CM à 120CM', 10, '2026-06-25 16:26:51.938216+00'),
  ('BABY DOLL ALYSSA ROSE PLUS', 'Linha Noite', '80.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782408222917_0ww17y.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782408222918_wh6yep.jpeg'], 'NEW', ARRAY['48/54'], 'new-collection', 'Baby Doll Plus Size Alyssa

Confeccionado em microfibra e renda de poliamida, o Baby Doll Plus Size Alyssa oferece conforto, delicadeza e excelente elasticidade.

Produzido em tamanho único, veste do manequim 48 ao 54, adaptando-se ao corpo com conforto.

Características: • Busto com forro, sem bojo
• Short com forro no fundo
• Alças reguláveis
• O desenho da renda pode variar conforme o lote

Informações adicionais: • Embalagem 100% discreta, garantindo sua privacidade

Cuidados com a peça: • Lavar à mão com sabão neutro
• Por ser uma peça delicada, requer cuidados especiais na lavagem
• Secar naturalmente, de preferência à sombra
• Não utilizar secadora.', 10, '2026-06-25 17:23:43.924529+00'),
  ('BABY DOLL ALYSSA BANCO PLUS', 'Linha Noite', '80.00', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782408264158_zok3nd.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1782408264159_iuq0mc.jpeg'], 'NEW', ARRAY['48/54'], 'new-collection', 'Baby Doll Plus Size Alyssa

Confeccionado em microfibra e renda de poliamida, o Baby Doll Plus Size Alyssa oferece conforto, delicadeza e excelente elasticidade.

Produzido em tamanho único, veste do manequim 48 ao 54, adaptando-se ao corpo com conforto.

Características: • Busto com forro, sem bojo
• Short com forro no fundo
• Alças reguláveis
• O desenho da renda pode variar conforme o lote

Informações adicionais: • Embalagem 100% discreta, garantindo sua privacidade

Cuidados com a peça: • Lavar à mão com sabão neutro
• Por ser uma peça delicada, requer cuidados especiais na lavagem
• Secar naturalmente, de preferência à sombra
• Não utilizar secadora.', 10, '2026-06-25 17:24:24.741634+00'),
  ('TANGA RAYANE - SECRETÁRIA ', 'Linha Sexy', '19.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783445675429_5kzwpa.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783445675429_3u5sc1.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783445675429_fwrcw0.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783445675429_fwdz7a.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783445675429_iw7cd1.jpeg'], 'NEW', ARRAY['U'], 'featured', ' TANGA RAYANE – ABERTURA FRONTAL 

CORES DISPONÍVEIS: PRETO, ROSA, VERMELHO, BRANCO.

Para quem ama ousar com elegância e atitude!

A Tanga Rayane é aquele modelo impactante que chama atenção nos detalhes. Com abertura frontal estratégica, ela traz um toque provocante na medida certa, perfeita para momentos especiais.

 Modelagem super sexy;
 Abertura frontal que valoriza o design da peça;
 Laterais com regulagem para ajuste perfeito;
 Tamanho único – veste com conforto e se adapta ao corpo.

Uma peça marcante, poderosa e indispensável para quem gosta de lingerie com personalidade.', 10, '2026-06-25 19:20:52.523309+00'),
  ('TANGA PLAYBOY', 'Linha Sexy', '17.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783438842139_8pnzcj.jpeg'], 'NEW', ARRAY['U'], 'featured', 'TANGA PLAYBOY – FIO DENTAL 

CORES DISPONÍVEIS: VERMELHO, BRANCO, PRETO

Sensualidade na medida certa, com acabamento delicado e cheio de charme!

A Tanga Playboy é confeccionada em renda macia e trabalhada, trazendo leve transparência e um visual irresistível.

 >Modelagem fio dental que valoriza as curvas
 >Laterais com regulagem para ajuste perfeito ao corpo
 >Detalhe em biju de coelhinho Playboy que dá um toque sofisticado e exclusivo
> Confortável e elegante ao mesmo tempo

Perfeita para quem busca uma peça marcante, delicada e extremamente feminina. ', 10, '2026-06-25 19:28:17.083202+00'),
  ('TANGA CORAÇÃO STRASS- ', 'Linha Sexy', '19.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783441771694_29j6n4.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783441771694_jtwo3r.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783441771694_af123h.jpeg'], 'NEW', ARRAY['U'], 'featured', 'TANGA CORAÇÃO STRASS- 

CORES DISPONÍVEIS: VERMELHO, BRANCO, PRETO, LILÁS.

 Tamanho Unico. Veste até o 44.
 Possui regulagem de coração dourado.', 10, '2026-06-25 19:33:52.610556+00'),
  ('TANGA TIME - FLAMENGO', 'Linha Sexy', '19.90', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783442759425_i6fbnt.jpeg'], 'NEW', ARRAY['U'], 'featured', '', 10, '2026-06-25 19:35:07.585111+00'),
  ('TANGA LAÇO ', 'Linha Sexy', '17.99', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783443897854_qntany.jpeg','https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783443897855_e76izj.jpeg'], 'NEW', ARRAY['U'], 'featured', 'TANGA LAÇO

CORES DISPONÍVEIS : PRETO E BRANCO

MARETIAL: FRENDE DE RENDA E TULE ATRÁS, LAÇO DE CETIM', 10, '2026-07-07 17:05:00.314266+00'),
  ('TANGA PINGO CORAÇÃO- CHICLETE ', 'Linha Sexy', '17.90', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783446732261_pp1hz2.jpeg'], 'NEW', ARRAY['U'], 'featured', 'TANGA TODA ME RENDA COM REGULAGEM E PINGENTE DE CORAÇÃO.', 10, '2026-07-07 17:52:14.426373+00'),
  ('TANGA PIMENTINHA - BRANCA', 'Linha Sexy', '17.90', '0.00', ARRAY['https://rivbistxxyzgniartzbt.supabase.co/storage/v1/object/public/product-images/products/1783448770218_8unm2e.jpeg'], 'NEW', ARRAY['U'], 'featured', 'TANGA PIMENTINHA – BRANCO

TAMANHO ÚNICO 36 AO 44


A Tanga Pimentinha é puro charme e sensualidade! Possui regulagem lateral para ajuste perfeito ao corpo, renda delicada na parte frontal e tule leve que traz transparência na medida certa. O detalhe especial fica por conta do pingente de pimenta, que dá um toque ousado e divertido à peça.

> Tamanho único com regulagem, vestindo com conforto e ajuste ideal ao corpo.', 10, '2026-07-07 18:26:12.394982+00');
