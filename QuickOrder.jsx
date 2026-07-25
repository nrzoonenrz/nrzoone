import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShoppingBag, CheckCircle, ArrowLeft, Phone, MapPin, User, ChevronDown, Package, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_COLORS = ['Black', 'Maroon', 'Olive', 'Navy', 'Grey', 'Brown', 'Purple', 'White', 'Pink', 'Mehndi', 'Coffee', 'Chocolate', 'Sky Blue', 'Teal', 'Lavender', 'Emerald', 'Peach', 'Golden', 'Silver', 'Nude'];

const BORKA_SIZE_GROUPS = [
    { label: 'বেবি হাফ সাইজ', sizes: ['20','22','24','26','28','30'] },
    { label: 'বেবি ফুল সাইজ', sizes: ['32','34','36','38','40'] },
    { label: 'মেয়ে হাফ সাইজ', sizes: ['42','44','46','48'] },
    { label: 'মেডিয়াম/লং', sizes: ['50','52','54','56','58'] },
];

const HIJAB_SIZES = ['40 Inchi (Choto)', '72 Inchi (Majhari)', '80 Inchi (Boro)'];

const QuickOrder = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [category, setCategory] = useState('borka'); // 'borka' or 'hijab'
    const [selectedColor, setSelectedColor] = useState('Black');
    const [selectedSize, setSelectedSize] = useState('52');
    const [customPrice, setCustomPrice] = useState('1350');
    const [deliveryArea, setDeliveryArea] = useState('inside');
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');

    // Fetch products from Firebase on load
    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllProducts(snapshot.docs?.map(doc => ({ 
                firebaseId: doc.id, 
                ...doc.data() 
            })) || []);
        });
        return () => unsubscribe();
    }, []);

    // Find the currently selected product
    const selectedProduct = allProducts.find(p => p.firebaseId === selectedProductId) || null;

    // Determine available colors and sizes
    const availableColors = selectedProduct?.colors?.length > 0 ? selectedProduct.colors : DEFAULT_COLORS;
    
    const getSizesList = () => {
        if (selectedProduct) {
            return selectedProduct.sizes?.length > 0 ? selectedProduct.sizes : (selectedProduct.category === 'Hijab' ? HIJAB_SIZES : BORKA_SIZE_GROUPS.flatMap(g => g.sizes));
        }
        return category === 'borka' ? BORKA_SIZE_GROUPS.flatMap(g => g.sizes) : HIJAB_SIZES;
    };
    const availableSizes = getSizesList();

    // Auto-update price, color, size, and category when product changes
    useEffect(() => {
        if (selectedProduct) {
            setCustomPrice(selectedProduct.price || '1350');
            setCategory(selectedProduct.category === 'Hijab' ? 'hijab' : 'borka');
            
            if (selectedProduct.colors?.length > 0) {
                setSelectedColor(selectedProduct.colors[0]);
            }
            if (selectedProduct.sizes?.length > 0) {
                setSelectedSize(selectedProduct.sizes[0]);
            } else {
                setSelectedSize(selectedProduct.category === 'Hijab' ? '72 Inchi (Majhari)' : '52');
            }
        } else {
            setCustomPrice('1350');
            setSelectedColor('Black');
            setSelectedSize(category === 'borka' ? '52' : '72 Inchi (Majhari)');
        }
    }, [selectedProductId, selectedProduct, category]);

    const deliveryCharges = { inside: 80, outside: 150 };
    const currentPrice = Number(customPrice) || 0;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const handleOrderSubmit = async (e) => {
        e.preventDefault();

        let cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('88') && cleanPhone.length === 13) {
            cleanPhone = cleanPhone.substring(2);
        }
        
        if (cleanPhone.length !== 11) {
            alert('সঠিক মোবাইল নম্বরটি দিন (১১ ডিজিটের হতে হবে)!');
            return;
        }

        const orderData = {
            name: formData.name,
            phone: cleanPhone,
            address: formData.address,
            landingPage: 'Quick Messenger Order',
            sourceWebsite: 'NRZOONE.COM',
            productType: selectedProduct ? selectedProduct.name : (category === 'borka' ? 'বোরকা / অন্যান্য (Direct)' : 'হিজাব কালেকশন (Direct)'),
            selectedProductId: selectedProductId || '',
            color: selectedColor,
            size: selectedSize,
            quantity: 1,
            price: currentPrice,
            deliveryCharge: deliveryCharges[deliveryArea],
            total: currentTotal,
            status: 'pending',
            date: new Date().toLocaleDateString('en-GB'),
            createdAt: serverTimestamp()
        };

        try {
            setIsSubmitting(true);
            
            // Optimistic update
            setOrderSuccess(true);
            setIsSubmitting(false);

            // Add order doc to Firestore
            const docRef = await addDoc(collection(db, "orders"), orderData);
            setOrderId(docRef.id.slice(0, 8).toUpperCase());

            // FB Pixel Trigger
            if (window.fbq) {
                try {
                    window.fbq('track', 'Purchase', { 
                        currency: 'BDT', 
                        value: currentTotal, 
                        content_category: 'Quick Order' 
                    });
                } catch (e) { console.error(e); }
            }

        } catch (error) {
            console.error("Order Submission Error:", error);
            alert('দুঃখিত, অর্ডারটি সম্পন্ন করতে সমস্যা হচ্ছে। অনুগ্রহ করে আমাদের সাথে সরাসরি ফোনে যোগাযোগ করুন।');
            setOrderSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#3A1212] font-bengali flex flex-col justify-between">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#EBEDF0] px-4 py-4 flex items-center justify-between shadow-sm">
                <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-[#3A1212]/70 hover:text-[#3A1212] transition-colors">
                    <ArrowLeft size={16} />
                    <span>হোম পেজ</span>
                </Link>
                <div className="text-right">
                    <h1 className="text-lg font-bold tracking-wider text-[#3A1212] uppercase font-sans">NRZOONE</h1>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">Premium Modest Wear</p>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow flex items-center justify-center p-4 py-8">
                <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    {orderSuccess ? (
                        /* Success View */
                        <div className="p-8 md:p-12 text-center space-y-6 animate-fadeIn">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                                <CheckCircle size={44} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!</h2>
                                <p className="text-slate-500 text-sm">আমাদের একজন প্রতিনিধি খুব শীঘ্রই আপনার ঠিকানায় কল করে অর্ডারটি নিশ্চিত করবেন।</p>
                            </div>
                            
                            {orderId && (
                                <div className="bg-[#FAF8F5] border border-[#EBEDF0] rounded-2xl p-4 max-w-xs mx-auto">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">অর্ডার আইডি</p>
                                    <p className="text-lg font-mono font-bold text-[#3A1212] mt-0.5">#{orderId}</p>
                                </div>
                            )}

                            <div className="pt-4 space-y-3 max-w-xs mx-auto">
                                <Link 
                                    to="/" 
                                    className="block w-full bg-[#3A1212] hover:bg-black text-white py-3.5 rounded-xl font-bold text-center transition-colors shadow-sm"
                                >
                                    আরো কেনাকাটা করুন
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* Form View */
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="text-center space-y-1">
                                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-[#855D2C] text-xs font-bold rounded-full border border-amber-100 uppercase tracking-wide">
                                    <Sparkles size={12} /> Easy Customer Order Form
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">অর্ডার করতে নিচের তথ্য দিন</h2>
                            </div>

                            <form onSubmit={handleOrderSubmit} className="space-y-5">
                                {/* Customer Name */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">কাস্টমারের নাম *</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <User size={16} />
                                        </div>
                                        <input 
                                            required 
                                            type="text" 
                                            placeholder="কাস্টমারের সম্পূর্ণ নাম লিখুন"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#3A1212] focus:border-[#3A1212] outline-none transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">মোবাইল নম্বর *</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Phone size={16} />
                                        </div>
                                        <input 
                                            required 
                                            type="tel" 
                                            placeholder="০১৭XXXXXXXX (১১ ডিজিট)"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#3A1212] focus:border-[#3A1212] outline-none transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">ডেলিভারি ঠিকানা *</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-4 text-slate-400">
                                            <MapPin size={16} />
                                        </div>
                                        <textarea 
                                            required 
                                            rows="2"
                                            placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা দিন (জেলা ও থানা সহ)"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#3A1212] focus:border-[#3A1212] outline-none transition-all font-medium text-sm resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 my-2"></div>

                                {/* Product Select Optional */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">প্রোডাক্ট সিলেক্ট করুন (ঐচ্ছিক)</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedProductId}
                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#3A1212] focus:border-[#3A1212] outline-none transition-all font-medium text-sm appearance-none"
                                        >
                                            <option value="">-- সরাসরি এন্ট্রি (কোনো প্রোডাক্ট সিলেক্ট না করে) --</option>
                                            {allProducts?.map(p => (
                                                <option key={p.firebaseId} value={p.firebaseId}>{p.name} - ৳{p.price}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* If NO product is selected, show Category selector */}
                                {!selectedProduct && (
                                    <div className="space-y-1.5 animate-fadeIn">
                                        <label className="text-sm font-bold text-slate-700">ক্যাটাগরি</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => setCategory('borka')}
                                                className={`py-3 rounded-xl border text-sm font-bold transition-all ${category === 'borka' ? 'border-[#3A1212] bg-[#FAF8F5] text-[#3A1212]' : 'border-slate-200 text-slate-500 bg-white'}`}
                                            >
                                                বোরকা / অন্যান্য
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setCategory('hijab')}
                                                className={`py-3 rounded-xl border text-sm font-bold transition-all ${category === 'hijab' ? 'border-[#3A1212] bg-[#FAF8F5] text-[#3A1212]' : 'border-slate-200 text-slate-500 bg-white'}`}
                                            >
                                                হিজাব কালেকশন
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Color and Size Select fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">কালার সিলেক্ট করুন</label>
                                        <div className="relative">
                                            <select 
                                                value={selectedColor}
                                                onChange={(e) => setSelectedColor(e.target.value)}
                                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#3A1212] focus:border-[#3A1212] outline-none transition-all font-medium text-sm appearance-none"
                                            >
                                                {availableColors.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">সাইজ সিলেক্ট করুন</label>
                                        <div className="relative">
                                            <select 
                                                value={selectedSize}
                                                onChange={(e) => setSelectedSize(e.target.value)}
                                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#3A1212] focus:border-[#3A1212] outline-none transition-all font-medium text-sm appearance-none"
                                            >
                                                {availableSizes.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Area */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">ডেলিভারি এলাকা</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${deliveryArea === 'inside' ? 'border-[#3A1212] bg-[#FAF8F5] text-[#3A1212] font-bold shadow-sm' : 'border-slate-200 text-slate-500 bg-white'}`}>
                                            <span className="text-xs">🏙️ ঢাকার ভেতরে</span>
                                            <input 
                                                type="radio" 
                                                name="delivery" 
                                                value="inside" 
                                                checked={deliveryArea === 'inside'} 
                                                onChange={() => setDeliveryArea('inside')} 
                                                className="hidden" 
                                            />
                                            <span className="text-xs">৳৮০</span>
                                        </label>
                                        <label className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${deliveryArea === 'outside' ? 'border-[#3A1212] bg-[#FAF8F5] text-[#3A1212] font-bold shadow-sm' : 'border-slate-200 text-slate-500 bg-white'}`}>
                                            <span className="text-xs">🚚 ঢাকার বাইরে</span>
                                            <input 
                                                type="radio" 
                                                name="delivery" 
                                                value="outside" 
                                                checked={deliveryArea === 'outside'} 
                                                onChange={() => setDeliveryArea('outside')} 
                                                className="hidden" 
                                            />
                                            <span className="text-xs">৳১৫০</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Custom Price Input */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">পণ্যের মূল্য (৳)</label>
                                    <input 
                                        type="number" 
                                        value={customPrice}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 outline-none font-bold text-sm text-slate-600 cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">অর্ডার করার পর কোনো ডিসকাউন্ট বা মূল্য পরিবর্তন করতে চাইলে আমাদের পেজে মেসেজ করুন।</p>
                                </div>

                                {/* Product Preview */}
                                <div className="border border-[#EBEDF0] rounded-2xl p-4 bg-[#FAF8F5] flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white border border-[#EBEDF0] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {selectedProduct?.imageUrl ? (
                                            <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="text-slate-300" size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">প্রোডাক্ট প্রিভিউ</p>
                                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                                            {selectedProduct ? selectedProduct.name : 'উপরের ড্রপডাউন থেকে প্রোডাক্ট সিলেক্ট করলে এখানে ছবি ও ডিটেইল দেখাবে'}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="bg-slate-50 border border-[#EBEDF0] rounded-2xl p-4 space-y-2 text-sm font-medium">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">অর্ডার সামারি</p>
                                    <div className="flex justify-between text-slate-500">
                                        <span>পণ্যের মূল্য</span>
                                        <span>৳{currentPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>ডেলিভারি চার্জ</span>
                                        <span>৳{deliveryCharges[deliveryArea]}</span>
                                    </div>
                                    <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
                                        <span>মোট বিল</span>
                                        <span>৳{currentTotal}</span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full bg-[#3A1212] hover:bg-black text-white py-4 rounded-xl font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <ShoppingBag size={18} />
                                    {isSubmitting ? 'অর্ডার হচ্ছে...' : '✅ কনফার্ম এন্ট্রি করুন'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-xs text-slate-400 border-t border-[#EBEDF0] bg-white/50">
                <p>&copy; {new Date().getFullYear()} NRZOONE. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default QuickOrder;
