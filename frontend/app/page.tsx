"use client";

import { useState, useEffect } from 'react';
import { usePOSStore, SalesChannel } from '../store/useStore';
import { 
  ShoppingCart, Plus, Minus, ChefHat, Package, Store, 
  Search, Home, Trash2, LayoutGrid, Coffee, Utensils,
  Edit, Save, X, Image as ImageIcon, Settings, Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// Helper Format Rupiah (Biar tidak error hydration)
const formatRp = (amount: number) => amount.toLocaleString('id-ID');

// Komponen Sidebar Navigasi
const SidebarItem = ({ href, icon: Icon, label, active, onClick }: { href?: string; icon: any; label: string; active?: boolean, onClick?: () => void }) => {
  const content = (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
      active ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}>
      <Icon size={20} className={active ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'} />
      <span className="text-sm">{label}</span>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : <div onClick={onClick}>{content}</div>;
};

export default function POSPage() {
  const { selectedChannel, setChannel, addToCart, cart, updateQuantity, getTotal, removeFromCart, clearCart } = usePOSStore();
  
  // --- STATE DATA (DARI BACKEND) ---
  const [products, setProducts] = useState<any[]>([]); // Data produk dari database
  const [loading, setLoading] = useState(true);        // Loading indicator
  const [error, setError] = useState("");              // Error message

  // --- STATE UI ---
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);     // Penanda client-side render
  const [isProcessing, setIsProcessing] = useState(false); // Loading saat bayar

  // 1. FETCH DATA SAAT HALAMAN DIBUKA
  useEffect(() => {
    setIsClient(true);
    fetchProducts();
  }, []);

  // Fungsi ambil data dari Backend (Server.js Port 5000)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Pastikan backend menyala di port 5000
      const res = await fetch('http://localhost:5000/api/products');
      
      if (!res.ok) {
        throw new Error(`Server Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      // Tampilkan pesan error spesifik agar mudah debugging
      setError(err.message === "Failed to fetch" 
        ? "Tidak bisa menghubungi server. Pastikan terminal backend menyala di port 5000!" 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNGSI BAYAR (Kirim Transaksi ke Backend)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!confirm("Proses pembayaran dan cetak struk?")) return;

    setIsProcessing(true);
    try {
      // Kirim data belanjaan
      const res = await fetch('http://localhost:5000/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          channel: selectedChannel,
          total: getTotal()
        })
      });

      const result = await res.json();

      if (result.success) {
        alert(`✅ Transaksi Berhasil!\nNo Bon: ${result.transaction_no}`);
        clearCart();      // Kosongkan keranjang
        fetchProducts();  // Refresh stok terbaru dari database
        setIsMobileCartOpen(false);
      } else {
        alert("❌ Gagal: " + (result.error || "Terjadi kesalahan server"));
      }
    } catch (err) {
      alert("❌ Error koneksi: Pastikan backend menyala!");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper Warna Tombol Ojol
  const getChannelColor = (channel: string) => {
    switch(channel) {
      case 'gofood': return 'bg-red-500 text-white border-red-500 shadow-red-100';
      case 'grabfood': return 'bg-green-600 text-white border-green-600 shadow-green-100';
      case 'shopee': return 'bg-orange-500 text-white border-orange-500 shadow-orange-100';
      default: return 'bg-slate-800 text-white border-slate-800 shadow-slate-200';
    }
  };

  // Filter Menu di Frontend
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === "Semua" ? true : p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!isClient) return null; // Mencegah error hydration

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- SIDEBAR (KIRI) --- */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 z-30 p-4">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Store size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight">Rumah Rasa</h1>
            <p className="text-xs text-slate-400 font-medium">POS System v1.0</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu Utama</p>
          <SidebarItem href="/" icon={LayoutGrid} label="Kasir" active />
          <SidebarItem href="/kitchen" icon={ChefHat} label="Dapur Produksi" />
          <SidebarItem href="/inventory" icon={Package} label="Gudang Stok" />
          <SidebarItem href="/store" icon={Store} label="Laporan Toko" />
        </nav>
      </aside>

      {/* --- KONTEN UTAMA (TENGAH) --- */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari menu..." 
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tombol Ojol */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['offline', 'gofood', 'grabfood', 'shopee'] as SalesChannel[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap border ${
                    selectedChannel === c 
                      ? `${getChannelColor(c)} shadow-md scale-105` 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
            {["Semua", "Snack", "Manis", "Minuman", "Bahan Baku"].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          
          {/* Loading State */}
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={40} className="animate-spin mb-4 text-orange-500" />
              <p>Sedang mengambil data dari database...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500 bg-red-50/50 rounded-2xl p-8 border border-red-100 max-w-lg mx-auto text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
              <p className="font-bold mb-2 text-lg text-red-700">Gagal Terhubung ke Backend</p>
              <p className="text-sm mb-6 text-red-600 bg-white p-3 rounded border border-red-100 font-mono">Error: {error}</p>
              
              <div className="text-left text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100 shadow-sm w-full">
                <p className="font-bold mb-2">Coba langkah ini:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Cek terminal Backend: Apakah ada pesan error merah?</li>
                  <li>Apakah terminal Backend sudah jalan (`npm run dev`)?</li>
                  <li>Apakah portnya benar `5000`?</li>
                </ul>
              </div>

              <button onClick={fetchProducts} className="mt-6 bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                Coba Hubungkan Lagi
              </button>
            </div>
          ) : (
            // Tampilan Produk Asli
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24 lg:pb-0">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 group flex flex-col">
                  
                  {/* Gambar Produk */}
                  <div className="relative h-40 rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <img 
                      src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      // Fallback jika gambar error/tidak ada
                      onError={(e: any) => e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                    />
                    {Number(product.stock) < 10 && (
                      <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">
                        Sisa {product.stock}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium">
                      {product.category || "Umum"}
                    </div>
                  </div>

                  {/* Info Produk */}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-3">{product.name}</h3>
                    <div className="space-y-2">
                      {/* Tampilkan Varian (Satuan/Pack) */}
                      {product.variants?.map((variant: any) => {
                        // Logic Harga: Cek harga channel, kalau null pake harga offline
                        const rawPrice = variant.prices?.[selectedChannel];
                        const activePrice = rawPrice ? Number(rawPrice) : Number(variant.prices?.['offline'] || 0);
                        
                        return (
                          <button
                            key={variant.id}
                            onClick={() => addToCart({
                              variant_id: variant.id,
                              product_name: product.name,
                              variant_name: variant.name,
                              price: activePrice,
                              quantity: 1
                            })}
                            className="w-full flex justify-between items-center px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 active:scale-95 transition-all group/btn"
                          >
                            <span className="text-xs font-semibold text-slate-600 group-hover/btn:text-orange-700">
                              {variant.name}
                            </span>
                            <div className="flex items-center gap-2">
                               <span className="text-sm font-bold">Rp {formatRp(activePrice)}</span>
                               <div className="bg-white rounded-full p-0.5 text-slate-400 group-hover/btn:text-orange-500">
                                 <Plus size={12}/>
                               </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- CART / KERANJANG (KANAN) --- */}
      <aside className="hidden lg:flex flex-col w-96 bg-white border-l border-slate-100 h-screen sticky top-0 z-30 shadow-xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
             <ShoppingCart size={20} className="text-slate-800"/>
             <h2 className="font-bold text-lg text-slate-800">Keranjang</h2>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg transition-colors">
              <Trash2 size={12}/> Reset
            </button>
          )}
        </div>

        {/* List Belanjaan */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Coffee size={48} className="text-slate-300" />
              </div>
              <p className="font-medium text-sm">Belum ada pesanan</p>
              <p className="text-xs">Pilih menu di samping</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variant_id} className="flex gap-3 items-start group">
                <div className="flex flex-col items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                   <button onClick={() => updateQuantity(item.variant_id, item.quantity + 1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600"><Plus size={12}/></button>
                   <span className="text-xs font-bold py-1 text-slate-800">{item.quantity}</span>
                   <button onClick={() => item.quantity > 1 ? updateQuantity(item.variant_id, item.quantity - 1) : removeFromCart(item.variant_id)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-400 hover:text-red-500"><Minus size={12}/></button>
                </div>
                <div className="flex-1 bg-white border border-slate-100 p-3 rounded-xl shadow-sm group-hover:border-orange-200 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-slate-700 text-sm leading-tight">{item.product_name}</p>
                    <p className="font-bold text-slate-800 text-sm">Rp {formatRp(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>{item.variant_name}</span><span>@{formatRp(item.price)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tombol Bayar Desktop */}
        <div className="p-5 bg-slate-50 border-t border-slate-100">
          <div className="flex justify-between text-lg font-extrabold text-slate-800 mb-4 pt-2">
              <span>Total</span><span>Rp {formatRp(getTotal())}</span>
          </div>
          <button 
            disabled={cart.length === 0 || isProcessing} 
            className={`w-full py-4 rounded-xl font-bold shadow-lg flex justify-between px-6 items-center transition-all ${
              cart.length === 0 || isProcessing 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white shadow-slate-300 hover:bg-slate-800 active:scale-95'
            }`}
            onClick={handleCheckout}
          >
            <span>{isProcessing ? 'Memproses...' : 'Bayar Sekarang'}</span>
            {!isProcessing && <span className="bg-white/20 px-2 py-0.5 rounded text-sm">PROSES</span>}
          </button>
        </div>
      </aside>

      {/* --- MOBILE LAYOUT (HP) --- */}
      <div className="lg:hidden">
        {/* Tombol Keranjang Melayang */}
        {cart.length > 0 && (
          <div className="fixed bottom-24 left-4 right-4 z-40">
            <button 
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full"><ShoppingCart size={20} className="text-orange-400"/></div>
                <div className="text-left">
                  <p className="text-xs text-slate-300">{cart.length} Item</p>
                  <p className="font-bold">Rp {formatRp(getTotal())}</p>
                </div>
              </div>
              <span className="bg-orange-500 px-4 py-2 rounded-xl text-sm font-bold">Bayar</span>
            </button>
          </div>
        )}

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 px-6 flex justify-between items-center z-30">
          <Link href="/" className="flex flex-col items-center gap-1 text-orange-600"><LayoutGrid size={24} fill="currentColor" /><span className="text-[10px] font-bold">Kasir</span></Link>
          <Link href="/kitchen" className="flex flex-col items-center gap-1 text-slate-400"><ChefHat size={24} /><span className="text-[10px] font-medium">Dapur</span></Link>
          <div className="w-8"></div>
          <Link href="/inventory" className="flex flex-col items-center gap-1 text-slate-400"><Package size={24} /><span className="text-[10px] font-medium">Gudang</span></Link>
          <Link href="/store" className="flex flex-col items-center gap-1 text-slate-400"><Store size={24} /><span className="text-[10px] font-medium">Toko</span></Link>
        </div>
        
        {/* Drawer Keranjang Mobile */}
        {isMobileCartOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm p-4">
             <div className="bg-white w-full max-w-md rounded-3xl p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Keranjang</h2>
                  <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-slate-100 rounded-full"><Minus size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto mb-4">
                   {cart.map(item => (
                      <div key={item.variant_id} className="flex justify-between mb-4 border-b pb-4">
                         <div>
                            <p className="font-bold">{item.product_name}</p>
                            <p className="text-xs text-slate-500">{item.variant_name}</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="font-bold">x{item.quantity}</span>
                            <span className="font-bold">Rp {formatRp(item.price * item.quantity)}</span>
                         </div>
                      </div>
                   ))}
                </div>
                <button 
                  onClick={handleCheckout} 
                  disabled={isProcessing}
                  className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-orange-200"
                >
                  {isProcessing ? 'Memproses...' : `Bayar Rp ${formatRp(getTotal())}`}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}