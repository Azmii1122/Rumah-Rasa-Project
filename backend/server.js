require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- KONFIGURASI DATABASE ---
// Menggunakan DATABASE_URL dari Supabase yang ada di file .env
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(dbConfig);

// Cek Koneksi
pool.connect((err) => {
  if (err) console.error('❌ KONEKSI DATABASE GAGAL:', err.message);
  else console.log('✅ BERHASIL TERHUBUNG KE DATABASE SUPABASE!');
});

// ===================================================
// 1. API GUDANG & STOK (INVENTORY)
// ===================================================

// Ambil semua item di gudang
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, u.unit_name as unit 
      FROM items i 
      LEFT JOIN units u ON i.unit_stock_id = u.unit_id 
      WHERE i.is_active = true 
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tambah item baru
app.post('/api/inventory', async (req, res) => {
  const { name, type, stock, unit, min_stock, avg_cost, category, image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO items (item_name, item_type, current_stock, minimum_stock, average_cost, category, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, stock, min_stock, avg_cost, category, image_url]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===================================================
// 2. API DAPUR & RESEP (KITCHEN)
// ===================================================

// Ambil daftar resep untuk tampilan dapur
app.get('/api/recipes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.item_id as id, 
        i.item_name as name, 
        1 as output_qty, 
        'pcs' as output_unit,
        json_agg(json_build_object(
          'name', ing.item_name,
          'qty', r.quantity_needed,
          'unit', u.unit_name
        )) as ingredients
      FROM recipes r
      JOIN items i ON r.product_id = i.item_id
      JOIN items ing ON r.ingredient_id = ing.item_id
      JOIN units u ON r.unit_id = u.unit_id
      GROUP BY i.item_id, i.item_name
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Proses Produksi (Masak) - Mengurangi stok bahan & menambah stok produk
app.post('/api/production', async (req, res) => {
  const client = await pool.connect();
  const { product_id, multiplier } = req.body;
  try {
    await client.query('BEGIN');
    
    // 1. Ambil resep
    const recipeRes = await client.query('SELECT * FROM recipes WHERE product_id = $1', [product_id]);
    
    // 2. Potong stok setiap bahan baku
    for (const row of recipeRes.rows) {
      await client.query(
        'UPDATE items SET current_stock = current_stock - ($1 * $2) WHERE item_id = $3',
        [row.quantity_needed, multiplier, row.ingredient_id]
      );
    }
    
    // 3. Tambah stok produk jadi
    await client.query(
      'UPDATE items SET current_stock = current_stock + $1 WHERE item_id = $2',
      [multiplier, product_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: "Produksi berhasil dicatat" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ===================================================
// 3. API PEMASOK & BELANJA (SUPPLIERS)
// ===================================================

// Ambil semua pemasok
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE is_active = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tambah pemasok baru
app.post('/api/suppliers', async (req, res) => {
  const { name, category, contact, address } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO suppliers (name, category, contact, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, category, contact, address]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ambil riwayat belanja
app.get('/api/purchases', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.name as supplier_name 
      FROM procurements p 
      JOIN suppliers s ON p.supplier_id = s.supplier_id 
      ORDER BY p.purchase_date DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Catat belanja baru & Update Stok Otomatis
app.post('/api/purchases', async (req, res) => {
  const client = await pool.connect();
  const { supplier_id, total_amount, status, notes, items } = req.body; 

  try {
    await client.query('BEGIN');
    
    const procRes = await client.query(
      'INSERT INTO procurements (supplier_id, total_amount, status, notes) VALUES ($1, $2, $3, $4) RETURNING procurement_id',
      [supplier_id, total_amount, status, notes]
    );
    const procId = procRes.rows[0].procurement_id;

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          'INSERT INTO procurement_details (procurement_id, item_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [procId, item.item_id, item.quantity, item.unit_price, item.subtotal]
        );
        
        // Update Stok
        await client.query(
          'UPDATE items SET current_stock = current_stock + $1 WHERE item_id = $2',
          [item.quantity, item.item_id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Belanja berhasil dicatat!" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ===================================================
// 4. API KASIR & TRANSAKSI (POS)
// ===================================================

// Ambil produk untuk kasir
app.get('/api/products', async (req, res) => {
  try {
    const itemsRes = await pool.query(`SELECT item_id as id, item_name as name, category, image_url as image, current_stock as stock FROM items WHERE item_type = 'product' AND is_active = true`);
    const variantsRes = await pool.query(`SELECT v.variant_id as id, v.product_id, v.variant_name as name, v.price_offline, p.channel, p.price FROM product_variants v LEFT JOIN product_channel_pricing p ON v.variant_id = p.variant_id`);
    
    const products = itemsRes.rows.map(prod => {
      const myVariants = variantsRes.rows.filter(v => v.product_id === prod.id);
      const mapVar = new Map();
      myVariants.forEach(v => {
        if(!mapVar.has(v.id)) mapVar.set(v.id, { id: v.id, name: v.name, prices: { offline: Number(v.price_offline) } });
        if (v.channel) mapVar.get(v.id).prices[v.channel] = Number(v.price);
      });
      return { ...prod, variants: Array.from(mapVar.values()) };
    });
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Catat transaksi penjualan
app.post('/api/transaction', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { items, channel, total } = req.body; 
    const trxNo = `TRX-${Date.now()}`; 
    
    const trxRes = await client.query(
      `INSERT INTO transactions (transaction_no, transaction_type, sales_channel, total_amount) 
       VALUES ($1, 'sale', $2, $3) RETURNING transaction_id`, 
      [trxNo, channel, total]
    );
    const trxId = trxRes.rows[0].transaction_id;

    for (const item of items) {
      const variantInfo = await client.query(`SELECT product_id, quantity_per_unit FROM product_variants WHERE variant_id = $1`, [item.variant_id]);
      const productId = variantInfo.rows[0].product_id;
      const qtySold = item.quantity * variantInfo.rows[0].quantity_per_unit;

      await client.query(
        `INSERT INTO transaction_details (transaction_id, item_id, variant_id, quantity, price_at_transaction, subtotal) 
         VALUES ($1, $2, $3, $4, $5, $6)`, 
        [trxId, productId, item.variant_id, item.quantity, item.price, item.price * item.quantity]
      );

      // Kurangi stok produk
      await client.query(`UPDATE items SET current_stock = current_stock - $1 WHERE item_id = $2`, [qtySold, productId]);
    }
    
    await client.query('COMMIT'); 
    res.json({ success: true, transaction_no: trxNo });
  } catch (err) { 
    await client.query('ROLLBACK'); 
    res.status(500).json({ error: err.message }); 
  } finally { client.release(); }
});

// ===================================================
// 5. API LAPORAN (REPORTS)
// ===================================================

app.get('/api/reports', async (req, res) => {
  try {
    const omzetRes = await pool.query(`SELECT SUM(total_amount) as total FROM transactions WHERE transaction_type = 'sale'`);
    const trxRes = await pool.query(`SELECT COUNT(*) as count FROM transactions WHERE transaction_type = 'sale'`);
    const recentRes = await pool.query(`SELECT transaction_no, sales_channel, total_amount, transaction_date FROM transactions ORDER BY transaction_date DESC LIMIT 10`);
    
    const bestSellerRes = await pool.query(`
      SELECT i.item_name as name, SUM(td.quantity) as sold
      FROM transaction_details td
      JOIN items i ON td.item_id = i.item_id
      GROUP BY i.item_name
      ORDER BY sold DESC LIMIT 5
    `);

    const channelRes = await pool.query(`
      SELECT sales_channel as channel, COUNT(*) as count
      FROM transactions GROUP BY sales_channel
    `);

    const channels = { offline: 0, gofood: 0, grabfood: 0, shopee: 0 };
    let totalTrxCount = 0;
    channelRes.rows.forEach(r => {
      if (r.channel) {
        channels[r.channel] = Number(r.count);
        totalTrxCount += Number(r.count);
      }
    });

    res.json({ 
      omzet: Number(omzetRes.rows[0].total || 0), 
      transaksi: Number(trxRes.rows[0].count || 0), 
      profitKotor: Number(omzetRes.rows[0].total || 0) * 0.4, 
      pengeluaran: 0, 
      recent: recentRes.rows,
      bestSellers: bestSellerRes.rows,
      channelStats: { data: channels, total: totalTrxCount }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- JALANKAN SERVER ---
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Jalan di port ${PORT}`));
}

module.exports = app; 