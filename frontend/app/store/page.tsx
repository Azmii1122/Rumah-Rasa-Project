"use client";

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  LayoutGrid, 
  ChefHat, 
  Package, 
  Store, 
  CreditCard, 
  Loader2, 
  RefreshCw, 
  ArrowUpRight, 
  ShoppingBag, 
  Download,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

// Helper format mata uang
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

export default function StorePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('Semua Waktu');

  // 1. Fetch Reports dari Backend (Data Asli)
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/reports');
      if (!res.ok) throw new Error("Gagal mengambil data laporan");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Helper untuk hitung persentase kanal
  const getChannelPercentage = (channel: string) => {
    if (!stats?.channelStats || stats.channelStats.total === 0) return 0;
    return Math.round((stats.channelStats.data[channel] / stats.channelStats.total) * 100);
  };

  if (loading && !stats) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-400">
      <Loader2 className="animate-spin mb-4 text-orange-500" size={48}/>
      <p className="font-black text-xl tracking-tight animate-pulse uppercase">Menganalisis Performa...</p>
    </div>
  );

  if (!stats) return <div className="flex h-screen items-center justify-center text-red-500">Gagal memuat data laporan.</div>;

  const offlinePercent = getChannelPercentage('offline');
  const onlinePercent = 100 - offlinePercent;

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
          <SidebarItem href="/kitchen" icon={ChefHat} label="Dapur Produksi" />
          <SidebarItem href="/inventory" icon={Package} label="Gudang Stok" />
          <SidebarItem href="/store" icon={Store} label="Laporan Toko" active />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Laporan Toko</h1>
            <p className="text-sm text-slate-500">Analisis bisnis berdasarkan data transaksi nyata</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={fetchReports} className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm">
                <RefreshCw size={18} className={loading ? 'animate-spin text-orange-500' : 'text-slate-400'} />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* --- RINGKASAN FINANSIAL --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group md:col-span-2">
                  <div className="absolute -right-6 -top-6 text-white/5 transition-transform group-hover:scale-110 duration-500"><DollarSign size={150}/></div>
                  <div className="relative z-10">
                    <p className="text-orange-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <TrendingUp size={12}/> Total Omzet Keseluruhan
                    </p>
                    <h2 className="text-4xl font-black mb-6 tracking-tight">Rp {formatRp(stats.omzet)}</h2>
                    <div className="flex gap-4">
                      <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                        <p className="text-[10px] text-white/50 font-bold uppercase mb-0.5">Transaksi</p>
                        <p className="font-black text-xl">{stats.transaksi}</p>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                        <p className="text-[10px] text-white/50 font-bold uppercase mb-0.5">Rata-rata Keranjang</p>
                        <p className="font-black text-xl">Rp {formatRp(stats.omzet / (stats.transaksi || 1))}</p>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-green-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4"><CreditCard size={24}/></div>
                    <span className="text-[9px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-widest">Gross Profit</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimasi Laba (40%)</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">Rp {formatRp(stats.profitKotor)}</p>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-red-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4"><ArrowDownRight size={24}/></div>
                    <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-widest">Expenses</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">HPP & Operasional</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">Rp {formatRp(stats.pengeluaran)}</p>
                  </div>
               </div>
            </div>

            {/* --- ANALISIS DETAIL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               
               {/* Transaksi Terbaru */}
               <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <h3 className="font-black text-slate-800 flex items-center gap-3">
                      <ShoppingBag size={20} className="text-orange-500"/> Riwayat Penjualan Terbaru
                    </h3>
                  </div>
                  <div className="flex-1 p-4 space-y-2 max-h-[450px] overflow-y-auto scrollbar-thin">
                    {stats.recent.map((trx: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black text-[10px] group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                            #{stats.transaksi - idx}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-tighter shadow-sm ${
                                trx.sales_channel === 'offline' ? 'bg-slate-800 text-white' : 'bg-orange-500 text-white'
                              }`}>
                                {trx.sales_channel}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {new Date(trx.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="font-bold text-slate-700 text-sm tracking-tight">{trx.transaction_no}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-800">Rp {formatRp(Number(trx.total_amount))}</p>
                        </div>
                      </div>
                    ))}
                    {stats.recent.length === 0 && (
                      <div className="py-20 text-center text-slate-300 italic text-sm">Belum ada transaksi di database.</div>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                     <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors shadow-sm">
                        <Download size={14}/> Download Laporan .CSV
                     </button>
                  </div>
               </div>

               {/* Produk Terlaris (REAL DATA) */}
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-50 bg-white/50 backdrop-blur-sm">
                    <h3 className="font-black text-slate-800 flex items-center gap-3">
                      <BarChart3 size={20} className="text-green-500"/> Menu Terlaris
                    </h3>
                  </div>
                  <div className="flex-1 p-6 space-y-6">
                     {stats.bestSellers && stats.bestSellers.length > 0 ? (
                        stats.bestSellers.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rank #{idx+1}</p>
                                    <p className="font-black text-slate-800 leading-tight">{item.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-800">{Number(item.sold).toLocaleString()} <span className="text-xs font-normal opacity-50">Unit</span></p>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div 
                                className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" 
                                style={{ width: `${100 - (idx * 25)}%` }}
                                ></div>
                            </div>
                        </div>
                        ))
                     ) : (
                        <div className="py-10 text-center text-slate-300 italic text-sm">Data penjualan belum tersedia.</div>
                     )}
                     
                     {/* Analisis Kanal (REAL DATA) */}
                     <div className="mt-8 p-5 bg-orange-50 rounded-3xl border border-orange-100">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="p-2 bg-white rounded-xl shadow-sm text-orange-500"><PieIcon size={16} /></div>
                           <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Persentase Kanal</p>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between text-[10px] font-black">
                              <span className="text-slate-500 uppercase">Offline / Dine-in</span>
                              <span className="text-slate-800">{offlinePercent}%</span>
                           </div>
                           <div className="h-2 w-full bg-orange-200 rounded-full overflow-hidden flex">
                              <div className="h-full bg-slate-900" style={{ width: `${offlinePercent}%` }}></div>
                              <div className="h-full bg-orange-500 shadow-lg shadow-orange-300/50" style={{ width: `${onlinePercent}%` }}></div>
                           </div>
                           <div className="flex justify-between text-[10px] font-black">
                              <span className="text-slate-500 uppercase">Ojek Online (Total)</span>
                              <span className="text-slate-800">{onlinePercent}%</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 px-6 flex justify-between items-center z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <Link href="/" className="flex flex-col items-center gap-1 text-slate-400"><LayoutGrid size={24} /><span className="text-[10px] font-medium uppercase tracking-tighter">Kasir</span></Link>
          <Link href="/kitchen" className="flex flex-col items-center gap-1 text-slate-400"><ChefHat size={24} /><span className="text-[10px] font-medium uppercase tracking-tighter">Dapur</span></Link>
          <div className="w-8"></div>
          <Link href="/inventory" className="flex flex-col items-center gap-1 text-slate-400"><Package size={24} /><span className="text-[10px] font-medium uppercase tracking-tighter">Gudang</span></Link>
          <Link href="/store" className="flex flex-col items-center gap-1 text-orange-600 font-bold"><Store size={24} /><span className="text-[10px] font-bold uppercase tracking-tighter">Toko</span></Link>
      </div>
    </div>
  );
}