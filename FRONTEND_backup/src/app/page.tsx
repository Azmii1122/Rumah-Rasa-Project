"use client";

import { useState } from 'react';
import { usePOSStore, SalesChannel } from '@/store/useStore';
import { 
  ShoppingCart, Plus, Minus, ChefHat, Package, Store, 
  Search, UtensilsCrossed, Coffee, IceCream, Home 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// --- DATA DUMMY DENGAN GAMBAR ---
const PRODUCTS = [
  {
    id: 1,
    name: "Risol Mayo Lumer",
    category: "Snack",
    image: "https://images.unsplash.com/photo-1626685823126-7248f07dc6d4?auto=format&fit=crop&w=300&q=80",
    stock: 50,
    variants: [
      { id: 101, name: "Satuan", prices: { offline: 3000, gofood: 4000, grabfood: 4000, shopee: 3500 } },
      { id: 102, name: "Pack (Isi 4)", prices: { offline: 12000, gofood: 15000, grabfood: 15000, shopee: 14000 } },
    ]
  },
  {
    id: 2,
    name: "Martabak Mini Coklat",
    category: "Manis",
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=300&q=80",
    stock: 20,
    variants: [
      { id: 201, name: "Coklat Keju", prices: { offline: 2500, gofood: 3000, grabfood: 3000, shopee: 2700 } },
      { id: 202, name: "Full Coklat", prices: { offline: 2000, gofood: 2500, grabfood: 2500, shopee: 2200 } },
    ]
  },
  {
    id: 3,
    name: "Pastel Kari Ayam",
    category: "Snack",
    image: "https://images.unsplash.com/photo-1601666687440-a197775a68c0?auto=format&fit=crop&w=300&q=80",
    stock: 15,
    variants: [
      { id: 301, name: "Original", prices: { offline: 3000, gofood: 3500, grabfood: 3500, shopee: 3200 } },
    ]
  },
  {
    id: 4,
    name: "Es Teh Manis Jumbo",
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80",
    stock: 100,
    variants: [
      { id: 401, name: "Cup Besar", prices: { offline: 5000, gofood: 6500, grabfood: 6500, shopee: 6000 } },
    ]
  },
];

export default function POSPage() {
  const { selectedChannel, setChannel, addToCart, cart, updateQuantity, getTotal, removeFromCart } = usePOSStore();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Logic Warna Channel
  const getChannelColor = (channel: string) => {
    switch(channel) {
      case 'gofood': return 'bg-red-500 text-white ring-red-200';
      case 'grabfood': return 'bg-green-600 text-white ring-green-200';
      case 'shopee': return 'bg-orange-500 text-white ring-orange-200';
      default: return 'bg-slate-800 text-white ring-slate-200';
    }
  };

  // Filter Produk
  const filteredProducts = PRODUCTS.filter(p => {
    const matchCat = activeCategory === "Semua" ? true : p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-32">
      
      {/* 1. HEADER MODERN */}
      <header className="bg-white px-4 pt-6 pb-4 sticky top-0 z-20 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] rounded-b-3xl">
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Sistem Kasir</p>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="bg-orange-500 text-white p-1.5 rounded-lg"><Store size={20}/></span>
              Rumah Rasa
            </h1>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <span className="font-bold text-slate-600">RR</span>
          </div>
        </div>

        {/* Channel Switcher (Pill Style) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
          {(['offline', 'gofood', 'grabfood', 'shopee'] as SalesChannel[]).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                selectedChannel === c 
                  ? `${getChannelColor(c)} shadow-lg transform scale-105` 
                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari risol, martabak..." 
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* 2. CATEGORY FILTER */}
      <div className="px-4 py-4 flex gap-3 overflow-x-auto scrollbar-hide">
        {["Semua", "Snack", "Manis", "Minuman"].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeCategory === cat
                ? "bg-slate-800 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. PRODUCT GRID (CARD PREMIUM) */}
      <main className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-4 items-start group hover:border-orange-300 transition-all">
            {/* Image Container */}
            <div className="w-24 h-24 relative rounded-xl overflow-hidden shrink-0">
              <img 
                src={product.image} 
                alt={product.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
              {product.stock < 10 && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-[10px] text-center py-0.5 font-bold">
                  Sisa {product.stock}
                </div>
              )}
            </div>

            {/* Info & Variants */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800 leading-tight mb-2">{product.name}</h3>
              </div>
              
              <div className="space-y-2">
                {product.variants.map((variant: any) => {
                  const activePrice = variant.prices[selectedChannel];
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
                      className="w-full flex justify-between items-center px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-orange-50 hover:border-orange-200 active:scale-95 transition-all"
                    >
                      <span className="text-xs font-medium text-slate-600">{variant.name}</span>
                      <span className="text-xs font-bold text-orange-600">Rp {activePrice.toLocaleString()}</span>
                      <div className="bg-white rounded-full p-0.5 shadow-sm text-slate-400">
                        <Plus size={12}/>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* 4. BOTTOM NAVIGATION BAR (FIXED) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe pt-2 px-6 z-30 flex justify-between items-center h-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <Link href="/" className="flex flex-col items-center gap-1 text-orange-600">
          <div className="bg-orange-50 p-2 rounded-full">
            <Home size={22} fill="currentColor" className="opacity-100" />
          </div>
          <span className="text-[10px] font-bold">Kasir</span>
        </Link>
        
        <Link href="/kitchen" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
          <ChefHat size={22} />
          <span className="text-[10px] font-medium">Dapur</span>
        </Link>

        <div className="w-12"></div> {/* Spacer untuk Cart Button di tengah (optional) */}

        <Link href="/inventory" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
          <Package size={22} />
          <span className="text-[10px] font-medium">Gudang</span>
        </Link>
        
        <button onClick={() => alert("Menu Laporan belum dibuat")} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
          <Store size={22} />
          <span className="text-[10px] font-medium">Toko</span>
        </button>
      </div>

      {/* 5. FLOATING CART (PREMIUM UI) */}
      {cart.length > 0 && (
        <>
          {/* Cart Summary Floating Button */}
          <div 
            className="fixed bottom-24 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl z-40 flex items-center justify-between cursor-pointer transform hover:scale-[1.02] transition-all"
            onClick={() => setIsCheckoutModalOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <ShoppingCart size={20} className="text-orange-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-300 font-medium">{cart.length} Item</span>
                <span className="font-bold text-lg">Rp {getTotal().toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-900/20">
              Bayar
            </div>
          </div>

          {/* Checkout Modal (Overlay) */}
          {isCheckoutModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Rincian Pesanan</h2>
                  <button 
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200"
                  >
                    <Minus size={20} />
                  </button>
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-4 mb-6 pr-2">
                  {cart.map((item) => (
                    <div key={item.variant_id} className="flex justify-between items-center border-b border-slate-50 pb-4">
                      <div>
                        <p className="font-bold text-slate-700">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.variant_name} • @{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <button onClick={() => item.quantity > 1 ? updateQuantity(item.variant_id, item.quantity - 1) : removeFromCart(item.variant_id)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                            <Minus size={14}/>
                         </button>
                         <span className="font-bold w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.variant_id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md">
                            <Plus size={14}/>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-slate-500 text-sm">
                    <span>Subtotal</span>
                    <span>Rp {getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold text-slate-800 pb-4">
                    <span>Total Bayar</span>
                    <span>Rp {getTotal().toLocaleString()}</span>
                  </div>
                  <button className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-orange-200 hover:bg-orange-600 transition-colors">
                    Proses Pembayaran
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}