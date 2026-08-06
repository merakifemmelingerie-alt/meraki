-- ====================================================================
-- SCRIPT DE SEGURANÇA E BLINDAGEM RLS (ROW LEVEL SECURITY) - SUPABASE
-- Copie e cole este script no SQL Editor do seu painel Supabase
-- ====================================================================

-- 1. Habilitar RLS em todas as tabelas
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

-- 3. DROPAR TODAS AS POLÍTICAS EXISTENTES (EVITA O ERRO 42710 DE DUPLICIDADE)
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public write products" ON public.products;
DROP POLICY IF EXISTS "Admin write products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public write categories" ON public.categories;
DROP POLICY IF EXISTS "Admin write categories" ON public.categories;

DROP POLICY IF EXISTS "Public read banners" ON public.banners;
DROP POLICY IF EXISTS "Allow public write banners" ON public.banners;
DROP POLICY IF EXISTS "Admin write banners" ON public.banners;

DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow public write coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin write coupons" ON public.coupons;

DROP POLICY IF EXISTS "Public read store_config" ON public.store_config;
DROP POLICY IF EXISTS "Allow public write store_config" ON public.store_config;
DROP POLICY IF EXISTS "Admin write store_config" ON public.store_config;

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public write reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin write reviews" ON public.reviews;

DROP POLICY IF EXISTS "Allow public write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

DROP POLICY IF EXISTS "Allow public write orders" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
DROP POLICY IF EXISTS "Orders admin update delete" ON public.orders;

DROP POLICY IF EXISTS "Allow public write returns" ON public.returns;

-- 4. RECRIAR AS POLÍTICAS DE LEITURA PÚBLICA (LIVRE PARA O E-COMMERCE)
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Public read store_config" ON public.store_config FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

-- 5. RECRIAR AS POLÍTICAS DE PERFIS (PROFILES)
CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (
    (auth.uid() = id AND tipo_user = (SELECT tipo_user FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
);

-- 6. RECRIAR AS POLÍTICAS DE MODIFICAÇÃO (APENAS ADMINISTRADORES)
CREATE POLICY "Admin write products" ON public.products FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin write categories" ON public.categories FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin write banners" ON public.banners FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin write coupons" ON public.coupons FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Allow public write store_config" ON public.store_config FOR ALL
USING (true) WITH CHECK (true);

-- 7. RECRIAR AS POLÍTICAS DE PEDIDOS E TROCAS (ORDERS & RETURNS)
CREATE POLICY "Orders insert policy" ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders select policy" ON public.orders FOR SELECT
USING (
    customeremail = auth.jwt() ->> 'email' 
    OR public.is_admin()
);

CREATE POLICY "Orders admin update delete" ON public.orders FOR UPDATE USING (public.is_admin());

-- 8. RECRIAR AS POLÍTICAS DO STORAGE DE IMAGENS
DROP POLICY IF EXISTS "Public storage insert" ON storage.objects;
DROP POLICY IF EXISTS "Public storage update" ON storage.objects;
DROP POLICY IF EXISTS "Public storage delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin storage write" ON storage.objects;
DROP POLICY IF EXISTS "Admin storage update" ON storage.objects;
DROP POLICY IF EXISTS "Admin storage delete" ON storage.objects;

CREATE POLICY "Admin storage write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND (auth.role() = 'authenticated' OR public.is_admin()));
CREATE POLICY "Admin storage update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admin storage delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());
