"use client";

import { useState, useEffect, useCallback } from 'react';
import { Package, Search, AlertTriangle, Filter, Plus, Edit, Trash2, X, LayoutGrid, ChefHat, Store, Loader2, RefreshCw, Utensils, Save } from 'lucide-react';
import Link from 'next/link';

// Helper Format Rupiah
const formatRp = (amount: number) => {
  const val = Number(amount) || 0;
  return val.toLocaleString('id-ID');
};

const SidebarItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) => (
  <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
    <Icon size={20} className={active ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'} />
    <span className="text-sm">{label}</span>
  </Link>
);

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  
  // State Modal CRUD Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('ingredient');

  // State Modal Resep
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [recipeLines, setRecipeLines] = useState<any[]>([]); // [{id, qty, name}]

  // --- 1. FETCH DATA (READ) ---
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('http://localhost:5000/api/inventory');
      if (!res.ok) throw new Error(`Server menjawab dengan status ${res.status}. Pastikan database aktif.`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) { 
      console.error("Fetch Error:", error);
      setErrorMsg(error.message === "Failed to fetch" ? "Gagal koneksi ke Backend. Apakah terminal 'npm run dev' di folder backend sudah nyala?" : error.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // --- 2. ADD & EDIT ITEM ---
  const handleSaveItem = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = {
        name: formData.get('name'), type: formData.get('type'), stock: Number(formData.get('stock')),
        unit: formData.get('unit') || 'pcs', min_stock: Number(formData.get('min_stock')),
        avg_cost: Number(formData.get('avg_cost')), category: formData.get('category'), 
        image_url: formData.get('image_url'), price_offline: Number(formData.get('price_offline') || 0),
        price_online: Number(formData.get('price_online') || 0)
    };
    try {
        let url = 'http://localhost:5000/api/inventory';
        let method = 'POST';
        if (editingItem) { url = `http://localhost:5000/api/inventory/${editingItem.item_id}`; method = 'PUT'; }
        const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || "Gagal menyimpan."); }
        await fetchInventory(); 
        setIsModalOpen(false);
        setEditingItem(null);
    } catch (error: any) { alert("⚠️ Simpan Gagal: " + error.message); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
      if(!confirm("Hapus item ini? Data akan diarsipkan.")) return;
      try {
          const res = await fetch(`http://localhost:5000/api/inventory/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Gagal menghapus.");
          fetchInventory();
      } catch (error: any) { alert("Error: " + error.message); }
  }

  // --- 3. RECIPE MANAGEMENT LOGIC ---
  const openRecipeModal = async (product: any) => {
    setTargetProduct(product);
    try {
      // Ambil semua bahan baku yang tersedia
      const resIng = await fetch('http://localhost:5000/api/ingredients-only');
      const ingredients = await resIng.json();
      setAvailableIngredients(ingredients);

      // Ambil resep produk ini jika sudah ada
      const resRecipe = await fetch(`http://localhost:5000/api/recipes/${product.item_id}`);
      const currentRecipe = await resRecipe.json();
      
      const formatted = currentRecipe.map((r: any) => ({
        id: r.ingredient_id,
        name: r.ingredient_name,
        qty: r.quantity_needed
      }));
      setRecipeLines(formatted);
      setIsRecipeModalOpen(true);
    } catch (err) { alert("Gagal memuat resep."); }
  };

  const addRecipeLine = () => {
    setRecipeLines([...recipeLines, { id: '', qty: 0 }]);
  };

  const updateRecipeLine = (index: number, field: string, value: any) => {
    const newLines = [...recipeLines];
    newLines[index][field] = value;
    setRecipeLines(newLines);
  };

  const removeRecipeLine = (index: number) => {
    setRecipeLines(recipeLines.filter((_, i) => i !== index));
  };

  const saveRecipe = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: targetProduct.item_id,
          ingredients: recipeLines.map(l => ({ id: Number(l.id), qty: Number(l.qty) }))
        })
      });
      if(res.ok) {
        alert("✅ Resep berhasil diperbarui!");
        setIsRecipeModalOpen(false);
      } else { throw new Error(); }
    } catch (err) { alert("Gagal menyimpan resep."); }
  };

  const openAddModal = () => { setEditingItem(null); setSelectedType('ingredient'); setIsModalOpen(true); }
  const openEditModal = (item: any) => { setEditingItem(item); setSelectedType(item.item_type); setIsModalOpen(true); }

  const filteredData = items.filter(item => {
    const matchType = filterType === 'all' ? true : item.item_type === filterType;
    return matchType && item.item_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 z-30 p-4">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200"><Store size={22} /></div>
          <div><h1 className="font-extrabold text-lg leading-tight">Rumah Rasa</h1><p className="text-xs text-slate-400 font-medium">POS System v1.0</p></div>
        </div>
        <nav className="flex-1 space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu Utama</p>
          <SidebarItem href="/" icon={LayoutGrid} label="Kasir" />
          <SidebarItem href="/kitchen" icon={ChefHat} label="Dapur Produksi" />
          <SidebarItem href="/inventory" icon={Package} label="Gudang Stok" active />
          <SidebarItem href="/store" icon={Store} label="Laporan Toko" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Gudang & Stok</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${errorMsg ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{errorMsg ? 'Terputus' : 'Tersambung ke Supabase'}</p>
            </div>
          </div>
          <button onClick={fetchInventory} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-transform active:rotate-180 duration-500">
            <RefreshCw size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
           <div className="max-w-6xl mx-auto">
              
              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm"><AlertTriangle size={24} className="text-red-500" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Gagal Mengambil Data Stok</p>
                    <p className="text-xs opacity-80">{errorMsg}</p>
                  </div>
                  <button onClick={fetchInventory} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">Coba Lagi</button>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                 <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari item di gudang..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all" onChange={(e) => setSearch(e.target.value)} />
                 </div>
                 <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {['all', 'ingredient', 'intermediate', 'product'].map((type) => (
                        <button key={type} onClick={() => setFilterType(type)} className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap capitalize transition-all border ${filterType === type ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{type === 'all' ? 'Semua' : type}</button>
                    ))}
                 </div>
                 <button onClick={openAddModal} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-200 transition-transform active:scale-95"><Plus size={18}/> Tambah</button>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="animate-spin text-orange-500 mb-4" size={48}/>
                  <p className="font-medium animate-pulse">Menghubungkan ke Gudang...</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {!loading && filteredData.map((item) => (
                    <div key={item.item_id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-orange-300 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${item.item_type === 'ingredient' ? 'bg-green-50 text-green-600' : item.item_type === 'product' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                {item.item_name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight mb-1 group-hover:text-orange-600 transition-colors">{item.item_name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-black tracking-tighter">{item.item_type}</span>
                                  <p className="text-[11px] text-slate-400 font-medium">HPP: Rp {formatRp(item.average_cost)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-xl font-black text-slate-800 tracking-tight">{Number(item.current_stock).toLocaleString()}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit || 'pcs'}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(item.item_type === 'product' || item.item_type === 'intermediate') && (
                                  <button onClick={() => openRecipeModal(item)} title="Atur Resep" className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Utensils size={14}/></button>
                                )}
                                <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14}/></button>
                                <button onClick={() => handleDelete(item.item_id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
              </div>
           </div>
        </div>
      </main>

      {/* CRUD MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <form onSubmit={handleSaveItem} className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                    <div><h2 className="text-2xl font-black text-slate-800 leading-tight">{editingItem ? 'Edit Data Item' : 'Tambah Item Baru'}</h2><p className="text-xs text-slate-400">Isi detail barang dengan teliti</p></div>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
                  </div>
                  <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</label>
                        <input name="name" defaultValue={editingItem?.item_name} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" required placeholder="Contoh: Tepung Terigu Segitiga"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Barang</label>
                              <select name="type" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold appearance-none">
                                  <option value="ingredient">Bahan Baku</option>
                                  <option value="intermediate">Setengah Jadi</option>
                                  <option value="product">Produk Jual</option>
                              </select>
                          </div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label><input name="category" defaultValue={editingItem?.category} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold" placeholder="Snack, Cairan..."/></div>
                      </div>
                      <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 flex gap-6">
                          <div className="flex-1 space-y-1.5"><label className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic">Stok Sekarang</label><input name="stock" type="number" defaultValue={editingItem?.current_stock || 0} className="w-full bg-white border border-orange-100 p-3 rounded-2xl font-black text-2xl text-orange-700"/></div>
                          <div className="flex-1 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Alert</label><input name="min_stock" type="number" defaultValue={editingItem?.minimum_stock || 10} className="w-full bg-white border border-slate-100 p-3 rounded-2xl font-bold"/></div>
                      </div>
                      {selectedType === 'product' && (
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4 animate-in slide-in-from-top-4 duration-500">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Atur Harga Jual</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[9px] font-bold text-blue-400 uppercase">Offline</label><input name="price_offline" type="number" className="w-full bg-white border border-blue-100 p-3 rounded-2xl font-bold" placeholder="3000"/></div>
                                <div className="space-y-1"><label className="text-[9px] font-bold text-blue-400 uppercase">Online (Ojol)</label><input name="price_online" type="number" className="w-full bg-white border border-blue-100 p-3 rounded-2xl font-bold" placeholder="4000"/></div>
                            </div>
                        </div>
                      )}
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Modal (HPP)</label><input name="avg_cost" type="number" defaultValue={editingItem?.average_cost || 0} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold" placeholder="Harga beli per satuan"/></div>
                  </div>
                  <div className="mt-10 flex gap-4">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-100 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">Batal</button>
                      <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 tracking-widest text-sm">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : 'SIMPAN DATA'}</button>
                  </div>
              </form>
          </div>
      )}

      {/* MODAL RESEP 🍳 */}
      {isRecipeModalOpen && targetProduct && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-6">
              <div><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Recipe Manager</p><h2 className="text-2xl font-black text-slate-800">{targetProduct.item_name}</h2></div>
              <button onClick={() => setIsRecipeModalOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X size={24}/></button>
            </div>

            <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
              {recipeLines.length === 0 && <p className="text-center py-10 text-slate-400 italic text-sm bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">Belum ada bahan baku. Klik tombol tambah di bawah.</p>}
              {recipeLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm group">
                  <select value={line.id} onChange={(e) => updateRecipeLine(idx, 'id', e.target.value)} className="flex-[2] bg-slate-50 border-none p-2 rounded-xl text-sm font-bold">
                    <option value="">Pilih Bahan...</option>
                    {availableIngredients.map(ing => <option key={ing.item_id} value={ing.item_id}>{ing.item_name}</option>)}
                  </select>
                  <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <input type="number" value={line.qty} onChange={(e) => updateRecipeLine(idx, 'qty', e.target.value)} className="w-full bg-transparent border-none text-right font-black text-slate-700 focus:ring-0 p-0" placeholder="Qty"/>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Qty</span>
                  </div>
                  <button onClick={() => removeRecipeLine(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={addRecipeLine} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-sm"><Plus size={16}/> Tambah Bahan Baku</button>
              <div className="flex gap-3">
                <button onClick={() => setIsRecipeModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl">Batal</button>
                <button onClick={saveRecipe} className="flex-[2] py-4 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-600 flex items-center justify-center gap-2 tracking-widest text-sm"><Save size={18}/> SIMPAN RESEP</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE NAV */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 px-6 flex justify-between items-center z-30">
          <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-orange-500"><LayoutGrid size={24} /><span className="text-[10px] font-medium tracking-tighter uppercase">Kasir</span></Link>
          <Link href="/kitchen" className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-orange-500"><ChefHat size={24} /><span className="text-[10px] font-medium tracking-tighter uppercase">Dapur</span></Link>
          <div className="w-8"></div>
          <Link href="/inventory" className="flex flex-col items-center gap-1 text-orange-600 font-bold"><Package size={24} /><span className="text-[10px] tracking-tighter uppercase">Gudang</span></Link>
          <Link href="/store" className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-orange-500"><Store size={24} /><span className="text-[10px] font-medium tracking-tighter uppercase">Toko</span></Link>
      </div>
    </div>
  );
}