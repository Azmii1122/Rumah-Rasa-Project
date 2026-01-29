"use client";

import { useState, useEffect } from 'react';
import { ChefHat, Utensils, Scale, LayoutGrid, Package, Store, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const SidebarItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) => (
  <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
    <Icon size={20} className={active ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'} />
    <span className="text-sm">{label}</span>
  </Link>
);

export default function KitchenPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // 1. Ambil Daftar Resep dari Backend
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch('http://localhost:5000/api/recipes');
      if (!res.ok) throw new Error("Gagal mengambil data resep");
      const data = await res.json();
      setRecipes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // 2. Kirim Proses Produksi (Update Stok Bahan & Barang Jadi)
  const handleProduction = async () => {
    if (!selectedRecipe) return;
    if (!confirm(`Konfirmasi produksi ${selectedRecipe.name} sebanyak ${multiplier} batch?`)) return;

    setProcessing(true);
    try {
      const res = await fetch('http://localhost:5000/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedRecipe.id,
          multiplier: multiplier
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        alert("✅ Produksi Berhasil! Stok bahan baku telah terpotong dan stok barang jadi bertambah.");
        setMultiplier(1);
      } else {
        alert("❌ Gagal: " + (result.error || "Terjadi kesalahan"));
      }
    } catch (err) {
      alert("❌ Error koneksi ke server.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
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
          <SidebarItem href="/" icon={LayoutGrid} label="Kasir" />
          <SidebarItem href="/kitchen" icon={ChefHat} label="Dapur Produksi" active />
          <SidebarItem href="/inventory" icon={Package} label="Gudang Stok" />
          <SidebarItem href="/store" icon={Store} label="Laporan Toko" />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
         <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-extrabold text-slate-800">Dapur Produksi</h1>
             <p className="text-sm text-slate-500 italic">Sistem Kalkulasi Resep Otomatis</p>
           </div>
           <button onClick={fetchRecipes} className="p-2 hover:bg-slate-100 rounded-full transition-all">
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
         </header>

         <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {error ? (
              <div className="max-w-md mx-auto mt-20 p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                <p className="font-bold text-red-800">Gagal Memuat Resep</p>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button onClick={fetchRecipes} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold">Coba Lagi</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                {/* LIST RESEP */}
                <div className="lg:col-span-4 space-y-3">
                  <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Pilih Item Produksi</h3>
                  {loading && recipes.length === 0 ? (
                    <div className="py-10 text-center"><Loader2 className="animate-spin inline text-orange-500" /></div>
                  ) : recipes.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm italic">
                      Belum ada resep yang diatur di menu Gudang.
                    </div>
                  ) : (
                    recipes.map((recipe) => (
                      <button 
                        key={recipe.id} 
                        onClick={() => { setSelectedRecipe(recipe); setMultiplier(1); }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                          selectedRecipe?.id === recipe.id 
                          ? "bg-white border-orange-500 ring-4 ring-orange-50 shadow-xl" 
                          : "bg-white border-slate-100 hover:border-orange-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`font-bold text-lg ${selectedRecipe?.id === recipe.id ? 'text-slate-800' : 'text-slate-500'}`}>{recipe.name}</span>
                          <ChefHat size={16} className={selectedRecipe?.id === recipe.id ? 'text-orange-500' : 'text-slate-200'} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Hasil per Batch: {recipe.output_qty} {recipe.output_unit}</p>
                      </button>
                    ))
                  )}
                </div>

                {/* KALKULATOR PRODUKSI */}
                <div className="lg:col-span-8">
                  {selectedRecipe ? (
                    <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-4">
                      <div className="bg-orange-50 p-8 border-b border-orange-100">
                         <div className="flex justify-between items-start mb-8">
                            <div>
                               <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Estimasi Bahan Baku</p>
                               <h2 className="text-4xl font-black text-slate-800 leading-none">{selectedRecipe.name}</h2>
                            </div>
                         </div>
                         
                         <div className="bg-white rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-orange-100">
                            <div className="flex items-center gap-4">
                               <button onClick={() => setMultiplier(m => Math.max(1, m - 1))} className="w-14 h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-600 transition-all">-</button>
                               <div className="text-center w-24">
                                  <span className="text-4xl font-black text-slate-800">{multiplier}</span>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Batch</p>
                               </div>
                               <button onClick={() => setMultiplier(m => m + 1)} className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center font-black text-2xl text-white transition-all shadow-xl shadow-slate-200">+</button>
                            </div>
                            <div className="hidden md:block h-12 w-px bg-slate-100"></div>
                            <div className="text-center md:text-left">
                               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Hasil</p>
                               <p className="text-3xl font-black text-orange-600">{(selectedRecipe.output_qty * multiplier).toLocaleString()} <span className="text-sm font-bold text-orange-400">{selectedRecipe.output_unit}</span></p>
                            </div>
                         </div>
                      </div>

                      <div className="p-8">
                         <h4 className="font-black text-slate-700 flex items-center gap-2 mb-6 text-xs uppercase tracking-widest">
                            <Utensils size={16} className="text-orange-500"/> Rincian Pengambilan Stok
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            {selectedRecipe.ingredients.map((ing: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-orange-200 transition-colors">
                                <span className="text-slate-600 font-bold">{ing.name}</span>
                                <div className="text-right">
                                  <span className="font-black text-slate-800 text-lg">{(ing.qty * multiplier).toLocaleString()}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{ing.unit}</span>
                                </div>
                              </div>
                            ))}
                         </div>
                         <button 
                           onClick={handleProduction} 
                           disabled={processing} 
                           className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-slate-300 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 tracking-[0.1em]"
                         >
                           <Scale size={24} /> {processing ? 'MENCATAT PRODUKSI...' : 'KONFIRMASI SELESAI MASAK'}
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-white rounded-[32px] border-4 border-dashed border-slate-50 min-h-[500px]">
                      <div className="bg-slate-50 p-8 rounded-full mb-6 ring-8 ring-slate-50/50"><ChefHat size={64} className="text-slate-200" /></div>
                      <p className="font-black text-xl text-slate-400 uppercase tracking-widest">Pilih Resep Untuk Mulai</p>
                      <p className="text-sm text-slate-300 mt-2 font-medium">Data stok akan terpotong otomatis</p>
                    </div>
                  )}
               </div>
            </div>
            )}
         </div>
      </main>
      
      {/* MOBILE NAV */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 px-6 flex justify-between items-center z-30">
          <Link href="/" className="flex flex-col items-center gap-1 text-slate-400"><LayoutGrid size={24} /><span className="text-[10px] font-medium uppercase tracking-tighter">Kasir</span></Link>
          <Link href="/kitchen" className="flex flex-col items-center gap-1 text-orange-600 font-bold"><ChefHat size={24} /><span className="text-[10px] uppercase tracking-tighter">Dapur</span></Link>
          <div className="w-8"></div>
          <Link href="/inventory" className="flex flex-col items-center gap-1 text-slate-400"><Package size={24} /><span className="text-[10px] font-medium uppercase tracking-tighter">Gudang</span></Link>
          <Link href="/store" className="flex flex-col items-center gap-1 text-slate-400"><Store size={24} /><span className="text-[10px] font-medium uppercase tracking-tighter">Toko</span></Link>
      </div>
    </div>
  );
}