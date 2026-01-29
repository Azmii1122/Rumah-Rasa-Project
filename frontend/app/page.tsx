"use client";

import { useState, useEffect } from 'react';
import { usePOSStore, SalesChannel } from '../store/useStore';
import { 
  ShoppingCart, Plus, Minus, ChefHat, Package, Store, 
  Search, Home, Trash2, LayoutGrid, Coffee, Utensils,
  Edit, Save, X, Image as ImageIcon, Settings, Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// Helper Format Rupiah
const formatRp = (amount: number) => amount.toLocaleString('id-ID');

export default function POSPage() {
  const { selectedChannel, setChannel, addToCart, cart, updateQuantity, getTotal, removeFromCart, clearCart } = usePOSStore();
  
  // URL API dinamis: Jika di Vercel pakai '/api', jika di laptop pakai localhost
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      // MEMANGGIL ALAMAT DINAMIS
      const res = await fetch(`${API_BASE}/products`);
      
      if (!res.ok) throw new Error(`Gagal muat data: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError("Gagal terhubung ke backend. Pastikan server aktif.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!confirm("Proses pembayaran?")) return;

    try {
      const res = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, channel: selectedChannel, total: getTotal() })
      });
      const result = await res.json();
      if (result.success) {
        alert("Transaksi Berhasil!");
        clearCart();
        fetchProducts();
      }
    } catch (err) {
      alert("Gagal memproses transaksi.");
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ... (Konten UI sama seperti sebelumnya) ... */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
           <div>
             <h1 className="text-xl font-black">Rumah Rasa Kasir</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Server: {API_BASE}</p>
           </div>
        </header>

        <div className="p-6">
          {loading ? (
             <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin text-orange-500" size={40}/><p className="mt-4 text-sm font-bold">Menghubungkan ke database...</p></div>
          ) : error ? (
             <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center max-w-md mx-auto">
                <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                <h2 className="font-black text-red-800">Koneksi Terputus</h2>
                <p className="text-sm text-red-600 mb-6">{error}</p>
                <button onClick={fetchProducts} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest">Coba Lagi</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {products.map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-xs text-slate-400">Stok: {p.stock}</p>
                    {/* ... tombol tambah ke keranjang ... */}
                 </div>
               ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}