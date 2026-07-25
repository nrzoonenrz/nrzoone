import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
    Package, UploadCloud, Edit, Trash2, Image as ImageIcon, Tag, Loader, X, PlusCircle,
    LayoutGrid, List, Plus, Minus, AlertTriangle, Zap, Eye, CheckCircle, HelpCircle
} from 'lucide-react';

const ProductManagerView = () => {
    const getTotalStock = (inv) => inv ? Object.values(inv)?.reduce((a, b) => a + b, 0) : 0;
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [showUploadForm, setShowUploadForm] = useState(false);
    
    // Dynamic Categories
    const [categories, setCategories] = useState([
        { id: 'classic', name: 'ক্লাসিক কম্বো' },
        { id: 'ma', name: 'মা কালেকশন' },
        { id: 'maboromeye', name: 'মা ও বড়মেয়ে' },
        { id: 'borobon', name: 'বড়বোন কালেকশন' },
        { id: 'kids', name: 'কিডস কালেকশন' },
        { id: 'hijab', name: 'হিজাব কালেকশন' }
    ]);
    const [newCatName, setNewCatName] = useState('');
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'classic',
        price: '',
        discountPrice: '',
        colors: [],
        sizes: [],
        inventory: {},
        imageUrl: '',
        stock: 'available',
        stockCount: 50, // Default stock count
        costPrice: '', // Production cost
        description: ''
    });

    const commonColors = [
        'Black', 'Maroon', 'Olive', 'Navy', 'Grey', 'Brown', 'Purple', 'White', 
        'Pink', 'Mehndi', 'Coffee', 'Chocolate', 'Sky Blue', 'Teal', 'Lavender', 
        'Emerald', 'Peach', 'Golden', 'Silver', 'Nude'
    ];
    
    // Size range for Borka/General
    const borkaSizes = Array.from({ length: (58 - 20) / 2 + 1 }, (_, i) => (20 + i * 2).toString());
    const hijabSizes = ['40 Inchi (Choto)', '72 Inchi (Majhari)', '80 Inchi (Boro)'];
    
    const currentSizes = newProduct.category === 'hijab' ? hijabSizes : [...borkaSizes, 'Free Size'];

    // Listen to Products
    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs?.map(doc => {
                const data = doc.data();
                // Ensure stockCount is calculated if missing
                const totalInv = getTotalStock(data.inventory);
                const finalStockCount = data.stockCount !== undefined ? data.stockCount : (totalInv || 0);
                return { 
                    ...data, 
                    stockCount: finalStockCount,
                    firebaseId: doc.id 
                };
            }));
        });
        return () => unsubscribe();
    }, []);

    const handleAddCategory = () => {
        if (!newCatName) return;
        const id = newCatName.toLowerCase().replace(/\s+/g, '_');
        setCategories([...categories, { id, name: newCatName }]);
        setNewProduct({ ...newProduct, category: id });
        setNewCatName('');
        alert('নতুন ক্যাটাগরি যুক্ত হয়েছে!');
    };

    const toggleColor = (color) => {
        const current = [...newProduct.colors];
        if (current.includes(color)) {
            setNewProduct({ ...newProduct, colors: current?.filter(c => c !== color) });
        } else {
            setNewProduct({ ...newProduct, colors: [...current, color] });
        }
    };

    const toggleSize = (size) => {
        const current = [...newProduct.sizes];
        if (current.includes(size)) {
            setNewProduct({ ...newProduct, sizes: current?.filter(s => s !== size) });
        } else {
            setNewProduct({ ...newProduct, sizes: [...current, size] });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error", error);
                alert("ছবি আপলোড ফেইল হয়েছে।");
                setLoading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setNewProduct({ ...newProduct, imageUrl: downloadURL });
                setLoading(false);
                setUploadProgress(0);
            }
        );
    };

    const addProduct = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "products"), {
                ...newProduct,
                price: parseInt(newProduct.price),
                discountPrice: newProduct.discountPrice ? parseInt(newProduct.discountPrice) : null,
                costPrice: newProduct.costPrice ? parseInt(newProduct.costPrice) : null,
                stockCount: parseInt(newProduct.stockCount) || 0,
                createdAt: serverTimestamp()
            });
            setNewProduct({ name: '', category: 'classic', price: '', discountPrice: '', colors: [], sizes: [], inventory: {}, imageUrl: '', stock: 'available', stockCount: 50, costPrice: '', description: '' });
            alert('প্রোডাক্ট সফলভাবে যোগ করা হয়েছে!');
        } catch (error) {
            console.error(error);
            alert('দুঃখিত, কোনো একটি সমস্যা হয়েছে।');
        }
    };

    const deleteProduct = async (id) => {
        if (confirm('আপনি কি এই প্রোডাক্টটি ডিলিট করতে চান?')) {
            await deleteDoc(doc(db, "products", id));
        }
    };

    const toggleStock = async (id, currentStock) => {
        const newStock = currentStock === 'available' ? 'out_of_stock' : 'available';
        await updateDoc(doc(db, "products", id), { stock: newStock });
    };

    // ─── Smart Stock Helpers ───────────────────────────────
    const getStockStatus = (product) => {
        const stockCount = product.stockCount !== undefined ? product.stockCount : 0;
        if (product.stock === 'out_of_stock' || stockCount === 0) {
            return { label: 'OUT OF STOCK', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', pulse: '' };
        }
        if (stockCount <= 20) {
            return { label: 'LOW STOCK', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500', pulse: 'animate-pulse' };
        }
        return { label: 'LIVE', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500', pulse: 'animate-pulse' };
    };

    const updateStockCount = async (id, currentCount, delta) => {
        const newCount = Math.max(0, (currentCount || 0) + delta);
        await updateDoc(doc(db, 'products', id), { 
            stockCount: newCount,
            stock: newCount === 0 ? 'out_of_stock' : 'available'
        });
    };

    // ─── Summary stats ───
    const totalProducts = products.length;
    const liveProducts = products?.filter(p => getStockStatus(p).label === 'LIVE').length;
    const lowStockProducts = products?.filter(p => getStockStatus(p).label === 'LOW STOCK').length;
    const outOfStockProducts = products?.filter(p => getStockStatus(p).label === 'OUT OF STOCK').length;

    return (
        <div className="space-y-12 animate-fade-in text-slate-800 dark:text-white pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h2 className="text-[#111827] dark:text-white text-xl font-black tracking-tight text-slate-900 dark:text-white tracking-tight">ইনভেন্টরি ও প্রোডাক্ট আপলোড</h2>
                    <p className="text-slate-500 dark:text-zinc-300 font-semibold text-xs mt-1">প্রোডাক্ট সংগ্রহ ও স্টক লেভেল ট্র্যাকিং</p>
                </div>
                <div className="flex gap-2 flex-wrap w-full md:w-auto text-[11px] font-bold">
                    <span className="px-4 py-2 bg-slate-100 neo-inset text-slate-700 dark:text-white rounded-xl border border-slate-200 shadow-sm neo-bg">
                        📦 সর্বমোট: {totalProducts}
                    </span>
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        লাইভ: {liveProducts}
                    </span>
                    <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        লো স্টক: {lowStockProducts}
                    </span>
                    <span className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        স্টক শেষ: {outOfStockProducts}
                    </span>
                </div>
            </div>

            {/* Toggle Button for Upload Form */}
            <div className="flex justify-center md:justify-start">
                <button 
                    onClick={() => setShowUploadForm(!showUploadForm)} 
                    className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2 ${
                        showUploadForm 
                        ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' 
                        : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                    }`}
                >
                    {showUploadForm ? '❌ প্রোডাক্ট আপলোড ফর্ম বন্ধ করুন' : '➕ নতুন প্রোডাক্ট আপলোড ফর্ম খুলুন'}
                </button>
            </div>

            {/* UPOLOAD FORM */}
            {showUploadForm && (
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                <h3 className="text-xl font-bold uppercase text-[#111827] dark:text-white mb-8 border-b pb-4 inline-block">নতুন প্রোডাক্ট যুক্ত করুন</h3>
                <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="space-y-4 md:col-span-2 flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-200 rounded-xl bg-slate-50 neo-inset relative overflow-hidden group neo-bg">
                        {newProduct.imageUrl ? (
                            <img loading="lazy" src={newProduct.imageUrl} alt="preview" className="h-48 object-contain rounded-xl shadow-sm border border-slate-200 z-10 relative" />
                        ) : (
                            <div className="text-center z-10 relative pointer-events-none">
                                <UploadCloud size={48} className="mx-auto text-slate-300 mb-4 group-hover:text-indigo-500 transition-colors" />
                                <p className="font-bold text-slate-500 dark:text-zinc-300">প্রোডাক্টের ছবি সিলেক্ট করুন (PNG/JPG)</p>
                            </div>
                        )}
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-[#111827] dark:text-white font-bold neo-card dark:border-white/5 ">
                                <Loader className="animate-spin mb-2" size={32} />
                                {uploadProgress}% আপলোড হচ্ছে...
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-30 w-full h-full" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-slate-400">অথবা ছবির সরাসরি লিংক দিন (URL)</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input type="text" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} placeholder="https://..." className="w-full pl-16 pr-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold neo-bg" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-400">কালেকশন / ক্যাটাগরি</label>
                        <div className="flex gap-2">
                           <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="flex-1 px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold appearance-none neo-bg">
                               {categories?.map(c => <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-400">নতুন ক্যাটাগরি তৈরি করুন (দরকার হলে)</label>
                        <div className="flex gap-2">
                           <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ক্যাটাগরি নাম..." className="flex-1 px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold neo-bg" />
                           <button type="button" onClick={handleAddCategory} className="bg-[#0f172a] text-white px-6 rounded-xl font-bold uppercase text-[10px]">Add</button>
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-slate-400">প্রোডাক্টের নাম / টাইটেল</label>
                        <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="যেমন: এক্সক্লুসিভ বোরকা..." className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold neo-bg" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">রেগুলার প্রাইস (৳)</label>
                        <input required type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} placeholder="1500" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold text-xl neo-bg" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">ডিসকাউন্ট প্রাইস (৳)</label>
                        <input type="number" value={newProduct.discountPrice} onChange={(e) => setNewProduct({...newProduct, discountPrice: e.target.value})} placeholder="1250" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold text-xl neo-bg" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">উৎপাদন খরচ / Cost Price (৳)</label>
                        <input type="number" value={newProduct.costPrice} onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value})} placeholder="800" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold text-xl neo-bg" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">স্টক শুরু করুন (পিস সংখ্যা)</label>
                        <input required type="number" value={newProduct.stockCount} onChange={(e) => setNewProduct({...newProduct, stockCount: e.target.value})} placeholder="50" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus:border-indigo-500 font-bold text-xl neo-bg" />
                    </div>

                    <div className="space-y-4 md:col-span-1 relative">
                        <label className="text-xs font-bold uppercase text-slate-400">অ্যাভেইলেবল কালার (ড্রপডাউন)</label>
                        <div 
                            className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus-within:border-indigo-500 font-bold cursor-pointer flex justify-between items-center neo-bg"
                            onClick={() => { setShowColorDropdown(!showColorDropdown); setShowSizeDropdown(false); }}
                        >
                            <span className={newProduct.colors.length === 0 ? "text-slate-400" : "text-slate-900 dark:text-white tracking-tight"}>
                                {newProduct.colors.length === 0 ? "কালার সিলেক্ট করুন..." : `${newProduct.colors.length} টি সিলেক্টেড`}
                            </span>
                            <span className="text-slate-400">▼</span>
                        </div>
                        
                        {showColorDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar neo-card dark:border-white/5 ">
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {commonColors?.map(color => (
                                        <button 
                                            type="button" 
                                            key={color} 
                                            onClick={() => toggleColor(color)} 
                                            className={`px-3 py-2 rounded-md font-bold text-sm text-left transition-all ${newProduct.colors.includes(color) ? 'bg-[#111827] text-white' : 'bg-slate-50 neo-inset text-slate-600 dark:text-zinc-300 hover:bg-slate-100 neo-inset'}`}
                                        >
                                            {newProduct.colors.includes(color) ? '✓ ' : ''}{color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {newProduct.colors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {newProduct.colors?.map(color => (
                                    <span key={color} className="px-3 py-1 bg-[#111827] text-white rounded-full text-xs font-bold flex items-center gap-1">
                                        {color}
                                        <X size={12} className="cursor-pointer hover:text-red-400" onClick={() => toggleColor(color)} />
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 md:col-span-1 relative">
                        <label className="text-xs font-bold uppercase text-slate-400">অ্যাভেইলেবল সাইজ (ড্রপডাউন)</label>
                        <div 
                            className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded-xl outline-none focus-within:border-indigo-500 font-bold cursor-pointer flex justify-between items-center neo-bg"
                            onClick={() => { setShowSizeDropdown(!showSizeDropdown); setShowColorDropdown(false); }}
                        >
                            <span className={newProduct.sizes.length === 0 ? "text-slate-400" : "text-slate-900 dark:text-white tracking-tight"}>
                                {newProduct.sizes.length === 0 ? "সাইজ সিলেক্ট করুন..." : `${newProduct.sizes.length} টি সিলেক্টেড`}
                            </span>
                            <span className="text-slate-400">▼</span>
                        </div>

                        {showSizeDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar neo-card dark:border-white/5 ">
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {currentSizes?.map(size => (
                                        <button 
                                            type="button" 
                                            key={size} 
                                            onClick={() => toggleSize(size)} 
                                            className={`px-3 py-2 rounded-md font-bold text-sm text-left transition-all ${newProduct.sizes.includes(size) ? 'bg-emerald-600 text-white' : 'bg-slate-50 neo-inset text-slate-600 dark:text-zinc-300 hover:bg-slate-100 neo-inset'}`}
                                        >
                                            {newProduct.sizes.includes(size) ? '✓ ' : ''}{size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {newProduct.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {newProduct.sizes?.map(size => (
                                    <span key={size} className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center gap-1">
                                        {size}
                                        <X size={12} className="cursor-pointer hover:text-red-400" onClick={() => toggleSize(size)} />
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 md:col-span-2 border-t pt-8 mt-4">
                        <button type="submit" disabled={!newProduct.imageUrl || loading} className="w-full bg-[#0f172a] text-white py-6 rounded-xl font-bold text-xl uppercase tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-4">
                            <PlusCircle size={28} /> প্রোডাক্ট লাইভ করুন
                        </button>
                    </div>
                </form>
            </div>
            )}



            {/* PRODUCT LIST & TOGGLE */}
            <div className="mt-16 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-[#111827] dark:text-white text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3"><Package size={28}/> প্রোডাক্ট লিস্ট ({products.length})</h3>
                    <div className="flex gap-2 bg-slate-100 neo-inset p-1.5 rounded-xl self-stretch sm:self-auto neo-bg">
                        <button onClick={() => setViewMode('grid')} className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 dark:text-white tracking-tight shadow-sm' : 'text-slate-500 dark:text-zinc-300 hover:text-slate-800 dark:text-white'}`}>
                            <LayoutGrid size={14} /> গ্রিড ভিউ
                        </button>
                        <button onClick={() => setViewMode('table')} className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 dark:text-white tracking-tight shadow-sm' : 'text-slate-500 dark:text-zinc-300 hover:text-slate-800 dark:text-white'}`}>
                            <List size={14} /> টেবিল ভিউ
                        </button>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products?.map(product => {
                            const status = getStockStatus(product);
                            return (
                                <div key={product.firebaseId} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 overflow-hidden flex flex-col justify-between group transition-all duration-300 neo-card dark:border-white/5 ">
                                    <div className="relative">
                                        <img loading="lazy" src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
                                        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-[10px] font-bold border-2 flex items-center gap-1.5 shadow-sm ${status.color}`}>
                                            <span className={`w-2 h-2 rounded-full ${status.dot} ${status.pulse}`}></span>
                                            {status.label}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{categories.find(c => c.id === product.category)?.name || product.category}</div>
                                            <div className="font-bold text-slate-800 dark:text-white text-lg leading-snug truncate" title={product.name}>{product.name}</div>
                                            <div className="flex gap-2 items-center">
                                                <div className="text-xl font-black text-emerald-700">৳{product.discountPrice || product.price}</div>
                                                {product.discountPrice && <div className="text-xs text-slate-400 line-through font-bold">৳{product.price}</div>}
                                            </div>
                                            {product.costPrice && (
                                                <div className="text-xs text-slate-500 dark:text-zinc-300 font-semibold bg-slate-50 neo-inset px-2.5 py-1 rounded-md w-fit neo-bg">
                                                    উৎপাদন খরচ: <span className="font-bold text-slate-700 dark:text-white">৳{product.costPrice}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Colors & Sizes pills */}
                                        <div className="space-y-3">
                                            {product.colors && product.colors.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {product.colors?.map(col => <span key={col} className="bg-slate-100 neo-inset text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold neo-bg">{col}</span>)}
                                                </div>
                                            )}
                                            {product.sizes && product.sizes.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {product.sizes?.map(sz => <span key={sz} className="bg-indigo-50/50 text-indigo-600 dark:text-blue-500 px-2 py-0.5 rounded text-[10px] font-bold">Sz: {sz}</span>)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stock Adjuster Inline */}
                                        <div className="bg-slate-50 neo-inset p-4 rounded-xl space-y-3 mt-2 neo-bg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">স্টক সংখ্যা</span>
                                                <span className="text-base font-black text-slate-800 dark:text-white">{product.stockCount || 0} পিস</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, -10)} className="flex-1 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 dark:text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 neo-card dark:border-white/5 "><Minus size={10}/> 10</button>
                                                <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, -1)} className="flex-1 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 dark:text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 neo-card dark:border-white/5 "><Minus size={10}/> 1</button>
                                                <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, 1)} className="flex-1 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 dark:text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 neo-card dark:border-white/5 "><Plus size={10}/> 1</button>
                                                <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, 10)} className="flex-1 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 dark:text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 neo-card dark:border-white/5 "><Plus size={10}/> 10</button>
                                            </div>
                                        </div>

                                        {/* Bottom Action buttons */}
                                        <div className="flex justify-between items-center border-t pt-4 mt-2">
                                            <button onClick={() => toggleStock(product.firebaseId, product.stock)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.stock === 'available' ? 'bg-[#FF6A00]' : 'bg-slate-300'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.stock === 'available' ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                            <button onClick={() => deleteProduct(product.firebaseId)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* TABLE VIEW */
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden neo-card dark:border-white/5 ">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#F5F5F5] dark:bg-[#1C1C1F] text-slate-900 dark:text-white font-bold text-[12px] border-y border-[#EBEDF0] dark:border-white/10">
                                    <tr>
                                        <th className="px-5 py-4 text-[13px]">প্রোডাক্ট তথ্য</th>
                                        <th className="px-5 py-4 text-[13px]">বিক্রয় মূল্য</th>
                                        <th className="px-5 py-4 text-[13px]">উৎপাদন খরচ</th>
                                        <th className="px-5 py-4 text-[13px]">স্টক অবস্থা</th>
                                        <th className="px-5 py-4 text-[13px]">স্টক সংখ্যা দ্রুত আপডেট</th>
                                        <th className="px-5 py-4 text-[13px]">অন/অফ</th>
                                        <th className="px-5 py-4 text-center">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {products?.map(product => {
                                        const status = getStockStatus(product);
                                        return (
                                            <tr key={product.firebaseId} className="hover:bg-slate-50 neo-inset/50 transition-colors neo-bg">
                                                <td className="px-5 py-4 border-b border-[#EBEDF0] flex items-center gap-4">
                                                    <img loading="lazy" src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover bg-slate-100 neo-inset neo-bg" />
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm max-w-[200px] truncate">{product.name}</div>
                                                        <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">{categories.find(c => c.id === product.category)?.name || product.category}</div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 border-b border-[#EBEDF0] font-bold text-slate-700 dark:text-white">
                                                    {product.discountPrice ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-emerald-700">৳{product.discountPrice}</span>
                                                            <span className="text-slate-400 line-through text-xs">৳{product.price}</span>
                                                        </div>
                                                    ) : (
                                                        <span>৳{product.price}</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 border-b border-[#EBEDF0] font-bold text-slate-600 dark:text-zinc-300">
                                                    {product.costPrice ? `৳${product.costPrice}` : '—'}
                                                </td>
                                                <td className="px-5 py-4 border-b border-[#EBEDF0]">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${status.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse}`}></span>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 border-b border-[#EBEDF0]">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, -10)} className="bg-slate-100 neo-inset hover:bg-slate-200 p-1.5 rounded text-xs font-bold neo-bg">-10</button>
                                                        <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, -1)} className="bg-slate-100 neo-inset hover:bg-slate-200 p-1.5 rounded text-xs font-bold neo-bg">-1</button>
                                                        <span className="font-black text-sm w-12 text-center">{product.stockCount || 0}</span>
                                                        <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, 1)} className="bg-slate-100 neo-inset hover:bg-slate-200 p-1.5 rounded text-xs font-bold neo-bg">+1</button>
                                                        <button onClick={() => updateStockCount(product.firebaseId, product.stockCount, 10)} className="bg-slate-100 neo-inset hover:bg-slate-200 p-1.5 rounded text-xs font-bold neo-bg">+10</button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 border-b border-[#EBEDF0]">
                                                    <button onClick={() => toggleStock(product.firebaseId, product.stock)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.stock === 'available' ? 'bg-[#FF6A00]' : 'bg-slate-300'}`}>
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.stock === 'available' ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4 border-b border-[#EBEDF0] text-center">
                                                    <button onClick={() => deleteProduct(product.firebaseId)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductManagerView;
