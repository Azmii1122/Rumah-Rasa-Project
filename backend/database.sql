-- ============================================
-- RUMAH RASA - DATABASE SCHEMA (PRODUCTION)
-- Jalankan script ini di SQL Editor (Supabase/Neon/PostgreSQL Lokal)
-- ============================================

-- 1. BERSIHKAN TABEL LAMA (Jika Ada)
DROP TABLE IF EXISTS transaction_details CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS recipe_details CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS product_channel_pricing CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- 2. BUAT TIPE DATA KHUSUS (ENUM)
DROP TYPE IF EXISTS item_type;
DROP TYPE IF EXISTS sales_channel;
DROP TYPE IF EXISTS transaction_type;

CREATE TYPE item_type AS ENUM ('ingredient', 'intermediate', 'product');
CREATE TYPE sales_channel AS ENUM ('offline', 'gofood', 'grabfood', 'shopee');
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'production', 'adjustment');

-- 3. TABEL SATUAN (UNITS)
CREATE TABLE units (
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(50) UNIQUE NOT NULL, -- Contoh: kg, gram, pcs, butir, ml, sdm
    conversion_to_base DECIMAL(15,6) DEFAULT 1 -- 1 kg = 1000 (jika base gram)
);

-- 4. TABEL BARANG (ITEMS) - Pusat Segalanya
CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE, -- Kode Barang (Opsional)
    item_name VARCHAR(200) NOT NULL,
    item_type item_type NOT NULL, -- Bahan Baku, Setengah Jadi, atau Produk Jual
    
    -- Tampilan Frontend
    category VARCHAR(50), -- Snack, Minuman, Bahan Baku
    image_url TEXT,       -- Link Foto
    
    -- Satuan
    unit_stock_id INTEGER REFERENCES units(unit_id), -- Satuan stok disimpan (misal: gram)
    
    -- Stok & Keuangan
    current_stock DECIMAL(15,4) DEFAULT 0,
    minimum_stock DECIMAL(15,4) DEFAULT 10, -- Alert jika di bawah ini
    average_cost DECIMAL(15,2) DEFAULT 0,   -- Harga Modal (HPP) per unit
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL VARIAN PRODUK (Jual Satuan vs Pack)
CREATE TABLE product_variants (
    variant_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES items(item_id), -- Menginduk ke Items
    variant_name VARCHAR(100) NOT NULL, -- Contoh: 'Satuan', 'Pack Isi 4'
    quantity_per_unit DECIMAL(15,4) NOT NULL DEFAULT 1, -- Pengali stok (Pack 4 = 4)
    price_offline DECIMAL(15,2) DEFAULT 0
);

-- 6. TABEL HARGA KHUSUS (Ojol)
CREATE TABLE product_channel_pricing (
    pricing_id SERIAL PRIMARY KEY,
    variant_id INTEGER REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    channel sales_channel NOT NULL, -- gofood, grabfood, shopee
    price DECIMAL(15,2) NOT NULL
);

-- 7. TABEL RESEP (Untuk Dapur & Potong Stok Otomatis)
CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES items(item_id), -- Produk yang dihasilkan
    ingredient_id INTEGER REFERENCES items(item_id), -- Bahan yang dipakai
    quantity_needed DECIMAL(15,4) NOT NULL, -- Butuh berapa?
    unit_id INTEGER REFERENCES units(unit_id) -- Satuan apa?
);

-- 8. TABEL TRANSAKSI (Header)
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    transaction_type transaction_type NOT NULL,
    sales_channel sales_channel,
    total_amount DECIMAL(15,2),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 9. TABEL DETAIL TRANSAKSI (Isi Keranjang)
CREATE TABLE transaction_details (
    detail_id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(transaction_id),
    item_id INTEGER REFERENCES items(item_id),
    variant_id INTEGER REFERENCES product_variants(variant_id),
    quantity DECIMAL(15,4),
    price_at_transaction DECIMAL(15,2),
    subtotal DECIMAL(15,2)
);

-- ============================================
-- DATA AWAL (SEEDING) - Agar tidak kosong
-- ============================================

-- Masukkan Satuan
INSERT INTO units (unit_name, conversion_to_base) VALUES 
('gram', 1), ('kg', 1000), ('ml', 1), ('liter', 1000), ('pcs', 1), ('butir', 1), ('sdm', 15);

-- Masukkan Bahan Baku
INSERT INTO items (item_name, item_type, category, unit_stock_id, current_stock, average_cost) VALUES
('Tepung Terigu', 'ingredient', 'Bahan Baku', 1, 5000, 15), -- 5kg, Rp15/gram
('Telur Ayam', 'ingredient', 'Bahan Baku', 6, 100, 2000),   -- 100 butir, Rp2000/butir
('Minyak Goreng', 'ingredient', 'Bahan Baku', 3, 2000, 18); -- 2 Liter

-- Masukkan Produk Jual
INSERT INTO items (item_name, item_type, category, image_url, unit_stock_id, current_stock) VALUES
('Risol Mayo Lumer', 'product', 'Snack', 'https://images.unsplash.com/photo-1626685823126-7248f07dc6d4', 5, 50),
('Martabak Mini', 'product', 'Manis', 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f', 5, 20);

-- Masukkan Varian & Harga (Risol)
INSERT INTO product_variants (product_id, variant_name, quantity_per_unit, price_offline) VALUES
(4, 'Satuan', 1, 3000),
(4, 'Pack Isi 4', 4, 12000);

-- Harga Ojol (Risol Satuan)
INSERT INTO product_channel_pricing (variant_id, channel, price) VALUES
(1, 'gofood', 4000), (1, 'grabfood', 4000), (1, 'shopee', 3500);

-- Resep Risol (Contoh: 1 Risol butuh 50gr Tepung & 1 Butir Telur - Aneh sih tapi buat contoh aja)
INSERT INTO recipes (product_id, ingredient_id, quantity_needed, unit_id) VALUES
(4, 1, 50, 1), -- Butuh Tepung
(4, 2, 1, 6);  -- Butuh Telur