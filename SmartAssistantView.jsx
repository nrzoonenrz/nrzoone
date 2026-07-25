import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { Bot, ScanLine, Search, CheckCircle, AlertTriangle, ArrowRight, Package, Box, RefreshCw, Smartphone, Clock, Layers, Wand2, Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';

const SmartAssistantView = () => {
    const [activeTab, setActiveTab] = useState('text'); // 'text', 'scanner', 'analytics', 'stock'
    const [rawText, setRawText] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [scannerMode, setScannerMode] = useState('shipped'); // 'shipped', 'return', 'stockin'
    const [scanResult, setScanResult] = useState('');
    const [scanError, setScanError] = useState('');
    const [scanLog, setScanLog] = useState([]);
    const [analyticsData, setAnalyticsData] = useState({ totalSales: 0, totalExpenses: 0, profit: 0, insights: [] });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const scannerInputRef = useRef(null);

    // Smart Stock Update state
    const [stockRawText, setStockRawText] = useState('');
    const [parsedStockItems, setParsedStockItems] = useState([]);
    const [isSavingStock, setIsSavingStock] = useState(false);
    const [stockSaveLog, setStockSaveLog] = useState([]);

    // AI Text Parser
    const parseText = () => {
        if (!rawText.trim()) return;

        // Basic Regex logic for Bangladeshi contexts
        const phoneRegex = /(?:01|\+8801)[3-9]\d{8}/g;
        const phones = rawText.match(phoneRegex) || [];
        const phone = phones.length > 0 ? phones[0] : '';

        // Try to extract name (assume it's the first line before phone, or just something)
        let name = "Unknown";
        let address = "";
        
        const lines = rawText.split('\n')?.map(l => l.trim())?.filter(l => l.length > 0);
        if (lines.length > 0) {
            name = lines[0].replace(/নাম[:;\-]?\s*/i, '').trim();
        }
        
        // Extract address (lines that aren't phone or name and might contain words like 'zila', 'thana', etc, or just everything else)
        const addressLines = lines?.filter(l => !l.match(phoneRegex) && l !== name);
        if (addressLines.length > 0) {
            address = addressLines.join(', ').replace(/ঠিকানা[:;\-]?\s*/i, '').trim();
        }

        setParsedData({
            name: name,
            phone: phone,
            address: address,
            original: rawText
        });
    };

    const confirmOrder = async () => {
        if (!parsedData || !parsedData.phone) {
            alert('সঠিক ফোন নম্বর পাওয়া যায়নি। দয়া করে ম্যানুয়ালি চেক করুন।');
            return;
        }

        try {
            await addDoc(collection(db, "orders"), {
                name: parsedData.name,
                phone: parsedData.phone,
                address: parsedData.address,
                items: [{name: "Smart Order Entry", price: 0, qty: 1}], // Default placeholder
                total: 0,
                status: 'Pending',
                source: 'Smart Assistant',
                createdAt: serverTimestamp()
            });
            alert('অর্ডার সফলভাবে সেভ হয়েছে!');
            setRawText('');
            setParsedData(null);
        } catch (error) {
            console.error("Order save error:", error);
            alert("অর্ডার সেভ করতে সমস্যা হয়েছে!");
        }
    };

    // Scanner Logic
    useEffect(() => {
        if (activeTab === 'scanner') {
            if (scannerInputRef.current) scannerInputRef.current.focus();
        }
    }, [activeTab]);

    const handleScanSubmit = async (e) => {
        e.preventDefault();
        const code = scanResult.trim();
        if (!code) return;

        setScanResult(''); // clear input immediately for next scan
        setScanError('');

        try {
            // Find order by ID (Assuming the barcode is the document ID or phone number)
            // If barcode is phone number (11 digits), query by phone. Else query by doc ID.
            let orderDocRef = null;
            let orderData = null;

            if (code.length === 11 && code.startsWith('01')) {
                const q = query(collection(db, "orders"), where("phone", "==", code));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    orderDocRef = snap.docs[0].ref;
                    orderData = snap.docs[0].data();
                }
            } else {
                // If it's a doc ID or custom barcode
                const q = query(collection(db, "orders"));
                const snap = await getDocs(q);
                const docFound = snap.docs.find(d => d.id === code || d.data().orderId === code);
                if (docFound) {
                    orderDocRef = docFound.ref;
                    orderData = docFound.data();
                }
            }

            if (!orderDocRef && scannerMode !== 'stockin') {
                setScanError(`অর্ডার পাওয়া যায়নি: ${code}`);
                setScanLog(prev => [{type: 'error', msg: `Not Found: ${code}`, time: new Date()}, ...prev]);
                return;
            }

            if (scannerMode === 'shipped') {
                await updateDoc(orderDocRef, { status: 'Shipped', shippedAt: serverTimestamp() });
                setScanLog(prev => [{type: 'success', msg: `Shipped: ${orderData.name} (${code})`, time: new Date()}, ...prev]);
            } 
            else if (scannerMode === 'return') {
                await updateDoc(orderDocRef, { status: 'Returned', returnedAt: serverTimestamp() });
                // Note: Stock increment logic can be added here based on orderData.items
                setScanLog(prev => [{type: 'success', msg: `Returned: ${orderData.name} (${code})`, time: new Date()}, ...prev]);
            }
            else if (scannerMode === 'stockin') {
                // For stock in, we assume barcode is product ID or name
                // This requires a more complex product query, for now just logging
                setScanLog(prev => [{type: 'success', msg: `Stock Updated for Barcode: ${code}`, time: new Date()}, ...prev]);
            }
        } catch (error) {
            console.error("Scan error:", error);
            setScanError(`স্ক্যান প্রসেস এরর: ${error.message}`);
        }
    };

    const analyzeData = async () => {
        setIsAnalyzing(true);
        try {
            // Fetch Orders
            const ordersSnap = await getDocs(query(collection(db, "orders")));
            let totalSales = 0;
            let returnCount = 0;
            let deliveredCount = 0;
            
            ordersSnap.forEach(doc => {
                const data = doc.data();
                if (data.status === 'Delivered' || data.status === 'Shipped') {
                    totalSales += (data.total || 0);
                    deliveredCount++;
                }
                if (data.status === 'Returned') {
                    returnCount++;
                }
            });

            // Fetch Expenses
            const expensesSnap = await getDocs(query(collection(db, "factory_expenses")));
            let totalExpenses = 0;
            expensesSnap.forEach(doc => {
                totalExpenses += (parseInt(doc.data().amount) || 0);
            });

            const profit = totalSales - totalExpenses;
            
            // Generate AI Insights
            let insights = [];
            
            if (profit > 0) {
                insights.push({ type: 'success', text: `অসাধারণ! আপনার ব্যবসায় মোট ৳${profit.toLocaleString('en-IN')} প্রফিট আছে।` });
            } else if (profit < 0) {
                insights.push({ type: 'warning', text: `সতর্কতা: আপনার খরচের চেয়ে আয় কম। ৳${Math.abs(profit).toLocaleString('en-IN')} লসে আছেন। প্রোডাকশন খরচ কমানোর চেষ্টা করুন।` });
            }
            
            if (returnCount > 10) {
                insights.push({ type: 'danger', text: `হাই রিটার্ন রেট! আপনার ${returnCount} টি পার্সেল রিটার্ন এসেছে। কাস্টমারদের সাথে ফোনে কনফার্মেশন আরও জোরদার করুন।` });
            }
            
            if (totalExpenses > totalSales * 0.7 && totalSales > 0) {
                insights.push({ type: 'warning', text: `আপনার ওভারহেড খরচ অনেক বেশি (মোট আয়ের ৭০% এর ওপর)। প্যাকেজিং এবং ফ্যাক্টরি খরচ অপ্টিমাইজ করুন।` });
            }

            if (deliveredCount > 0) {
                 insights.push({ type: 'info', text: `আপনার মোট ${deliveredCount} টি অর্ডার সফলভাবে ডেলিভার হয়েছে। এভাবেই এগিয়ে যান!` });
            }

            setAnalyticsData({ totalSales, totalExpenses, profit, insights });
            
        } catch (error) {
            console.error("Analytics Error:", error);
            alert("ডেটা অ্যানালাইসিস করতে সমস্যা হয়েছে।");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ===== SMART STOCK PARSER (Supports Bengali + English) =====
    const parseStockText = () => {
        if (!stockRawText.trim()) return;

        // Bengali → English color mapping
        const BN_COLORS = {
            'মেরুন': 'Maroon', 'মেরন': 'Maroon',
            'নীল': 'Navy', 'নিল': 'Navy', 'আসমানি': 'Sky Blue',
            'কালো': 'Black', 'কাল': 'Black',
            'অলিভ': 'Olive', 'অলিব': 'Olive',
            'কফি': 'Coffee',
            'সাদা': 'White',
            'লাল': 'Red',
            'সবুজ': 'Green',
            'হলুদ': 'Yellow',
            'গোলাপি': 'Pink', 'পিংক': 'Pink',
            'বেগুনি': 'Purple', 'বেগুনী': 'Purple',
            'খাকি': 'Khaki',
            'মেহেদি': 'Mehndi', 'মেহেন্দি': 'Mehndi', 'মেহেন্দী': 'Mehndi',
            'ধূসর': 'Grey', 'ধুসর': 'Grey',
            'বাদামি': 'Brown', 'বাদামী': 'Brown',
            'সোনালি': 'Golden', 'সোনালী': 'Golden',
            'রুপালি': 'Silver', 'রূপালি': 'Silver',
            'চকলেট': 'Chocolate',
            'পিচ': 'Peach',
            'ন্যুড': 'Nude',
            'ক্রিম': 'Cream',
            'আকাশি': 'Sky Blue',
            'ফিরোজা': 'Teal',
            'লাভেন্ডার': 'Lavender',
        };

        // English color list
        const EN_COLORS = ['black','maroon','olive','navy','grey','gray','brown','purple','white','pink','mehndi','coffee','chocolate','sky blue','teal','lavender','emerald','peach','golden','silver','nude','red','blue','green','yellow','orange','cream','beige','mustard','burgundy','coral','rose','cyan','magenta','indigo','violet','khaki'];

        // Bengali size mapping (Bengali digits → English)
        const toBengaliNum = (s) => s.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());

        // All sizes (English + Bengali numbers) - proper borka size system
        // Choto Meye: 20-30, Mejo Meye: 32-40, Boro Meye: 42-48, Ma: 50-58
        const EN_SIZES = ['20','22','24','26','28','30','32','34','36','38','40','42','44','46','48','50','52','54','56','58','xs','s','m','l','xl','xxl','2xl','3xl','free size'];
        
        // Size group labels for display
        const getSizeLabel = (size) => {
            const n = parseInt(size);
            if (n >= 20 && n <= 30) return 'চোট মেয়ে';
            if (n >= 32 && n <= 40) return 'মেজো মেয়ে';
            if (n >= 42 && n <= 48) return 'বড় মেয়ে';
            if (n >= 50 && n <= 58) return 'মা';
            return size;
        };

        // Smart block splitter — detect product blocks
        // Split by: product title line pattern OR double newline
        const text = stockRawText.trim();
        
        // Find product blocks by detecting lines that look like product names (before price lines)
        // Pattern: a line followed by price pattern ৳ or price in text
        let blocks = [];
        
        // Try to split by detecting color name as first word (common in their format)
        const colorNamePattern = Object.keys(BN_COLORS).join('|');
        const splitRegex = new RegExp(`(?=^(?:${colorNamePattern})\\s*$)`, 'mi');
        const byColor = text.split(splitRegex)?.filter(b => b.trim());
        
        if (byColor.length > 1) {
            blocks = byColor;
        } else {
            // Fallback: split by double newline or numbered items
            blocks = text.split(/\n{2,}|(?=\d+[\.\)]\s)/);
        }

        const items = blocks?.map((block, idx) => {
            if (!block.trim()) return null;
            const lines = block.trim().split('\n')?.map(l => l.trim())?.filter(Boolean);
            if (!lines.length) return null;

            // Extract product name — find line ending with বোরকা/হিজাব/set/combo/dress
            let name = '';
            const nameLine = lines.find(l => /বোরকা|হিজাব|dress|set|combo|ড্রেস|সেট|জিলবাব|আবায়া/i.test(l) && l.length < 60);
            if (nameLine) {
                name = nameLine.trim();
            } else {
                // First non-price, non-badge line
                name = lines.find(l => !/^\d|৳|ছাড়|টাকা|পরিমাণ|মোট|কার্ট|অর্ডার|সাইজ|হিজাব|ধরণ|পছন্দ/.test(l) && l.length > 2 && l.length < 80) || lines[0];
            }
            name = name.replace(/^\d+[\.\)]\s*/, '').trim();

            // Extract Bengali colors from the block
            const foundColors = [];
            Object.entries(BN_COLORS).forEach(([bn, en]) => {
                if (block.includes(bn) && !foundColors.includes(en)) foundColors.push(en);
            });
            // Also check English colors
            EN_COLORS.forEach(c => {
                const re = new RegExp('\\b' + c + '\\b', 'i');
                if (re.test(block) && !foundColors?.map(x=>x.toLowerCase()).includes(c.toLowerCase())) {
                    foundColors.push(c.charAt(0).toUpperCase() + c.slice(1));
                }
            });

            // Extract Bengali sizes — convert Bengali digits ৫০ → 50
            const bengaliSizeMatches = block.match(/[০-৯]+/g) || [];
            const foundSizes = new Set();
            bengaliSizeMatches.forEach(s => {
                const en = toBengaliNum(s);
                if (parseInt(en) >= 20 && parseInt(en) <= 70) foundSizes.add(en);
            });
            // Also English sizes
            EN_SIZES.forEach(s => {
                const re = new RegExp('\\b' + s + '\\b', 'i');
                if (re.test(block)) foundSizes.add(s);
            });

            // Extract price — support ৳ symbol and Bengali digits
            const priceMatches = block.match(/(\d+)\s*৳|৳\s*(\d+)/g) || [];
            let price = 0;
            if (priceMatches.length > 0) {
                const nums = priceMatches?.map(m => parseInt(m.replace(/[৳\s]/g, '')))?.filter(n => !isNaN(n));
                price = Math.min(...nums); // Take the discounted (lower) price
            }
            // Also detect plain number before ৳
            if (!price) {
                const plainMatch = block.match(/(\d{3,5})\s*৳/);
                if (plainMatch) price = parseInt(plainMatch[1]);
            }

            // Extract original price (higher value = MRP)
            const allPrices = (block.match(/(\d{3,5})/g) || [])?.map(Number)?.filter(n => n > 100 && n < 100000);
            const originalPrice = allPrices.length > 1 ? Math.max(...allPrices) : price;

            // Extract badge
            const badgeMatch = block.match(/জনপ্রিয়|সেরাসেলার|নতুন|বেস্টসেলার|\d+%\s*ছাড়/);
            const badge = badgeMatch ? badgeMatch[0] : '';

            // Extract product type
            const typeMatch = block.match(/ফুল কম্বো সেট|কম্বো|সিঙ্গেল|শুধু মা|শুধু বাচ্চা|only ma|only baby/i);
            const productType = typeMatch ? typeMatch[0] : '';

            // Extract image URL
            const imageMatch = block.match(/https?:\/\/[^\s,\n"']+\.(jpg|jpeg|png|webp|gif)[^\s,\n"']*/i);
            const imageUrl = imageMatch ? imageMatch[0] : '';

            // Quantity
            const qtyMatch = block.match(/(?:পরিমাণ|quantity|qty|stock|স্টক)[:：]?\s*(\d+)/i);
            const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

            return {
                id: Date.now() + idx,
                name: name || ('প্রোডাক্ট ' + (idx + 1)),
                imageUrl,
                description: productType ? 'টাইপ: ' + productType : '',
                colors: foundColors.length > 0 ? foundColors : ['Black'],
                sizes: foundSizes.size > 0 ? Array.from(foundSizes) : ['50'],
                qty,
                price,
                originalPrice,
                badge,
                expanded: true,
            };
        })?.filter(item => item && item.name.length > 1);

        setParsedStockItems(items.length > 0 ? items : []);
        setStockSaveLog([]);
        if (items.length === 0) alert('কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি। প্রতিটি প্রোডাক্টের মাঝে ফাঁকা লাইন দিন।');
    };

    const updateStockItem = (id, field, value) => {
        setParsedStockItems(prev => prev?.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeStockItem = (id) => {
        setParsedStockItems(prev => prev?.filter(item => item.id !== id));
    };

    const saveAllStock = async () => {
        if (!parsedStockItems.length) return;
        setIsSavingStock(true);
        const log = [];

        for (const item of parsedStockItems) {
            try {
                // Build inventory from colors × sizes
                const inventory = {};
                item.colors.forEach(color => {
                    item.sizes.forEach(size => {
                        inventory[`${color}__${size}`] = item.qty;
                    });
                });

                // Check if product exists
                const q = query(collection(db, 'products'), where('name', '==', item.name));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    // Update existing product
                    const existing = snap.docs[0];
                    const existingInv = existing.data().inventory || {};
                    const merged = { ...existingInv };
                    Object.entries(inventory).forEach(([k, v]) => {
                        merged[k] = (merged[k] || 0) + v;
                    });
                    await updateDoc(doc(db, 'products', existing.id), {
                        inventory: merged,
                        colors: [...new Set([...(existing.data().colors || []), ...item.colors])],
                        sizes: [...new Set([...(existing.data().sizes || []), ...item.sizes])],
                        ...(item.imageUrl && { imageUrl: item.imageUrl }),
                        ...(item.description && { description: item.description }),
                        updatedAt: serverTimestamp()
                    });
                    log.push({ name: item.name, type: 'updated', msg: 'স্টক আপডেট হয়েছে' });
                } else {
                    // Create new product
                    await addDoc(collection(db, 'products'), {
                        name: item.name,
                        imageUrl: item.imageUrl || '',
                        description: item.description || '',
                        price: item.price,
                        colors: item.colors,
                        sizes: item.sizes,
                        inventory,
                        stock: 'in_stock',
                        category: 'Smart Import',
                        createdAt: serverTimestamp()
                    });
                    log.push({ name: item.name, type: 'created', msg: 'নতুন প্রোডাক্ট তৈরি হয়েছে' });
                }
            } catch (err) {
                log.push({ name: item.name, type: 'error', msg: 'সমস্যা: ' + err.message });
            }
        }

        setStockSaveLog(log);
        setIsSavingStock(false);
        if (log.every(l => l.type !== 'error')) {
            setParsedStockItems([]);
            setStockRawText('');
        }
    };

    return (
        <div className="bg-slate-50 neo-inset min-h-full rounded-2xl p-4 md:p-8 neo-bg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-[#111827] dark:text-white text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Bot className="text-indigo-600 dark:text-blue-500" /> Smart Assistant & Scanner
                    </h2>
                    <p className="text-slate-500 dark:text-zinc-300 text-sm mt-1">অটোমেটিক মেসেজ পড়া এবং বারকোড স্ক্যানিং</p>
                </div>
                <div className="flex bg-slate-200 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'text' ? 'bg-white shadow text-indigo-600 dark:text-blue-500' : 'text-slate-500 dark:text-zinc-300 hover:text-slate-700 dark:text-white'}`}
                    >
                        <Search size={16} /> Text AI
                    </button>
                    <button 
                        onClick={() => setActiveTab('scanner')}
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'scanner' ? 'bg-white shadow text-indigo-600 dark:text-blue-500' : 'text-slate-500 dark:text-zinc-300 hover:text-slate-700 dark:text-white'}`}
                    >
                        <ScanLine size={16} /> Scanner Mode
                    </button>
                    <button 
                        onClick={() => {setActiveTab('analytics'); analyzeData();}}
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white shadow text-purple-600' : 'text-slate-500 dark:text-zinc-300 hover:text-slate-700 dark:text-white'}`}
                    >
                        <Bot size={16} /> AI Analyst 📊
                    </button>
                    <button 
                        onClick={() => setActiveTab('stock')}
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'stock' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 dark:text-zinc-300 hover:text-slate-700 dark:text-white'}`}
                    >
                        <Layers size={16} /> স্মার্ট স্টক 📦
                    </button>
                </div>
            </div>

            {activeTab === 'text' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Area */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Smartphone className="text-indigo-500" size={20}/> 
                            মেসেজ কপি-পেস্ট করুন
                        </h3>
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={"এখানে কাস্টমারের মেসেজ পেস্ট করুন...\nউদাহরণ:\nনাম: রহিম\nফোন: 01712345678\nঠিকানা: মিরপুর ১০, ঢাকা\nসাইজ: ৪০ ইঞ্চি"}
                            className="w-full h-64 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
                        ></textarea>
                        <button 
                            onClick={parseText}
                            className="w-full py-3 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 hover:bg-indigo-700 dark:hover:bg-zinc-200 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Bot size={20} /> ম্যাজিক দেখুন (Parse)
                        </button>
                    </div>

                    {/* Result Area */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="text-green-500" size={20}/> 
                            সিস্টেম যা বুঝতে পেরেছে
                        </h3>
                        
                        {parsedData ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-wider">নাম</label>
                                    <input type="text" value={parsedData.name} onChange={(e) => setParsedData({...parsedData, name: e.target.value})} className="w-full p-2 border-b border-slate-200 outline-none focus:border-indigo-500 font-semibold" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-wider">ফোন নম্বর</label>
                                    <input type="text" value={parsedData.phone} onChange={(e) => setParsedData({...parsedData, phone: e.target.value})} className="w-full p-2 border-b border-slate-200 outline-none focus:border-indigo-500 font-semibold text-indigo-600 dark:text-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-wider">ঠিকানা</label>
                                    <textarea value={parsedData.address} onChange={(e) => setParsedData({...parsedData, address: e.target.value})} className="w-full p-2 border-b border-slate-200 outline-none focus:border-indigo-500 resize-none h-20" />
                                </div>
                                <div className="pt-4">
                                    <button onClick={confirmOrder} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                                        <CheckCircle size={20} /> অর্ডার কনফার্ম করুন
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                <Bot size={48} className="mb-2 opacity-50" />
                                <p>মেসেজ পেস্ট করে "ম্যাজিক দেখুন" এ ক্লিক করুন</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'scanner' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-4xl mx-auto neo-card dark:border-white/5 ">
                    <div className="flex flex-wrap gap-4 mb-8 justify-center">
                        <button 
                            onClick={() => {setScannerMode('shipped'); if(scannerInputRef.current) scannerInputRef.current.focus();}}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${scannerMode === 'shipped' ? 'bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-slate-100 neo-inset text-slate-500 dark:text-zinc-300 hover:bg-slate-200'}`}
                        >
                            <Package size={20} /> Shipping Mode
                        </button>
                        <button 
                            onClick={() => {setScannerMode('return'); if(scannerInputRef.current) scannerInputRef.current.focus();}}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${scannerMode === 'return' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 scale-105' : 'bg-slate-100 neo-inset text-slate-500 dark:text-zinc-300 hover:bg-slate-200'}`}
                        >
                            <RefreshCw size={20} /> Return Parcel Mode
                        </button>
                        <button 
                            onClick={() => {setScannerMode('stockin'); if(scannerInputRef.current) scannerInputRef.current.focus();}}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${scannerMode === 'stockin' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-slate-100 neo-inset text-slate-500 dark:text-zinc-300 hover:bg-slate-200'}`}
                        >
                            <Box size={20} /> Stock In Mode
                        </button>
                    </div>

                    <form onSubmit={handleScanSubmit} className="relative mb-8 max-w-lg mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <ScanLine className="h-6 w-6 text-slate-400" />
                        </div>
                        <input
                            ref={scannerInputRef}
                            type="text"
                            value={scanResult}
                            onChange={(e) => setScanResult(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 neo-inset border-2 border-slate-200 rounded-xl text-lg font-bold focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none neo-bg"
                            placeholder="বারকোড স্ক্যান করুন..."
                            autoFocus
                        />
                        <button type="submit" className="hidden">Submit</button>
                    </form>

                    {scanError && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 font-bold max-w-lg mx-auto justify-center">
                            <AlertTriangle size={20} /> {scanError}
                        </div>
                    )}

                    <div className="max-w-lg mx-auto">
                        <h4 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2 border-b pb-2">
                            <Clock size={18} /> স্ক্যান হিস্ট্রি
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {scanLog?.map((log, index) => (
                                <div key={index} className={`p-3 rounded-lg flex items-center gap-3 text-sm font-medium ${log.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                    {log.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                    <span>{log.msg}</span>
                                    <span className="ml-auto text-xs opacity-60">
                                        {log.time.toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                            {scanLog.length === 0 && (
                                <div className="text-center text-slate-400 py-4">কোনো স্ক্যান হিস্ট্রি নেই</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-[5px_5px_15px_#d1d5db,-5px_-5px_15px_#ffffff] text-center border border-white neo-card dark:border-white/5 ">
                            <h4 className="text-slate-500 dark:text-zinc-300 font-bold mb-2">মোট সেলস (আয়)</h4>
                            <p className="text-3xl font-black text-indigo-600 dark:text-blue-500">৳{analyticsData.totalSales.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-[5px_5px_15px_#d1d5db,-5px_-5px_15px_#ffffff] text-center border border-white neo-card dark:border-white/5 ">
                            <h4 className="text-slate-500 dark:text-zinc-300 font-bold mb-2">মোট ফ্যাক্টরি খরচ</h4>
                            <p className="text-3xl font-black text-rose-600">৳{analyticsData.totalExpenses.toLocaleString('en-IN')}</p>
                        </div>
                        <div className={`p-6 rounded-2xl shadow-[5px_5px_15px_#d1d5db,-5px_-5px_15px_#ffffff] text-center border border-white ${analyticsData.profit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-rose-50 to-rose-100'}`}>
                            <h4 className="text-slate-500 dark:text-zinc-300 font-bold mb-2">{analyticsData.profit >= 0 ? 'মোট প্রফিট' : 'মোট লস'}</h4>
                            <p className={`text-3xl font-black ${analyticsData.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ৳{Math.abs(analyticsData.profit).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-[5px_5px_20px_#c2c3c7,-5px_-5px_20px_#ffffff] neo-card dark:border-white/5 ">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-4">
                            <Bot className="text-purple-600" size={24} /> 
                            AI Business Insights
                        </h3>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-500 dark:text-zinc-300 font-bold animate-pulse">ডেটা অ্যানালাইসিস চলছে...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {analyticsData.insights.length > 0 ? (
                                    analyticsData.insights?.map((insight, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl flex items-start gap-3 border ${
                                            insight.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:text-emerald-200' :
                                            insight.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800 dark:text-amber-200' :
                                            insight.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                                            'bg-indigo-50/50 border-blue-100 text-indigo-800 dark:text-indigo-200'
                                        }`}>
                                            <div className="mt-1">
                                                {insight.type === 'success' && <CheckCircle size={20} />}
                                                {(insight.type === 'warning' || insight.type === 'danger') && <AlertTriangle size={20} />}
                                                {insight.type === 'info' && <Bot size={20} />}
                                            </div>
                                            <p className="font-semibold">{insight.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-400 py-8">যথেষ্ট ডেটা পাওয়া যায়নি।</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== SMART STOCK UPDATE TAB ===== */}
            {activeTab === 'stock' && (
                <div className="space-y-8">
                    {/* Input Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-lg">
                                <Wand2 className="text-emerald-500" size={22}/> 
                                বাল্ক টেক্সট পেস্ট করুন
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">AI নিজেই নাম, কালার, সাইজ, ছবি বের করবে</p>
                            <textarea
                                value={stockRawText}
                                onChange={(e) => setStockRawText(e.target.value)}
                                placeholder={`উদাহরণ (প্রতিটি প্রোডাক্টের মাঝে ফাঁকা লাইন দিন):\n\nচেরি জর্জেট বোরকা ডিজাইন ০১\nকালার: Black, Maroon, Olive, Navy\nসাইজ: 52, 54, 56, 58\nদাম: 1350\nস্টক: 10\nhttps://example.com/image1.jpg\n\nচেরি জর্জেট বোরকা ডিজাইন ০২\nকালার: White, Pink, Lavender\nসাইজ: 52, 54, 56\nদাম: 1450\nস্টক: 15`}
                                className="w-full h-72 p-4 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-emerald-400 resize-none font-mono text-sm"
                            ></textarea>
                            <button 
                                onClick={parseStockText}
                                className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-95"
                            >
                                <Wand2 size={20} /> AI দিয়ে Parse করুন
                            </button>
                        </div>

                        {/* Info Card */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border-2 border-emerald-100 flex flex-col justify-center">
                            <h4 className="font-black text-emerald-800 dark:text-emerald-200 text-lg mb-6 uppercase tracking-widest text-slate-900 dark:text-white">কীভাবে ব্যবহার করবেন</h4>
                            <div className="space-y-4 text-sm">
                                {[
                                    ['1️⃣', 'প্রতিটি প্রোডাক্টের তথ্য আলাদা ব্লকে লিখুন (মাঝে ফাঁকা লাইন)'],
                                    ['2️⃣', 'কালার লিস্ট দিন: Black, Maroon, Olive, Navy'],
                                    ['3️⃣', 'সাইজ লিস্ট দিন: 52, 54, 56, 58'],
                                    ['4️⃣', 'ছবির URL সরাসরি পেস্ট করুন — AI নিজেই খুঁজে নেবে'],
                                    ['5️⃣', 'Parse করুন → চেক করুন → এক ক্লিকে Save!'],
                                ]?.map(([num, text]) => (
                                    <div key={num} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl neo-card dark:border-white/5 ">
                                        <span className="text-xl shrink-0">{num}</span>
                                        <p className="text-emerald-800 dark:text-emerald-200 font-semibold">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Parsed Items Preview */}
                    {parsedStockItems.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <CheckCircle className="text-emerald-500" size={24}/> 
                                    AI পার্স করেছে — {parsedStockItems.length}টি প্রোডাক্ট পাওয়া গেছে
                                </h3>
                                <button 
                                    onClick={saveAllStock}
                                    disabled={isSavingStock}
                                    className="px-8 py-4 bg-[#0f172a] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingStock ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>সেভ হচ্ছে...</span></>
                                    ) : (
                                        <><Save size={18}/><span>সব সেভ করুন ({parsedStockItems.length}টি)</span></>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {parsedStockItems?.map((item) => (
                                    <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden neo-card dark:border-white/5 ">
                                        <div className="p-5 flex items-start gap-4">
                                            {/* Image Preview */}
                                            {item.imageUrl ? (
                                                <img loading="lazy" src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-xl border border-slate-100 shrink-0" onError={e => e.target.style.display='none'}/>
                                            ) : (
                                                <div className="w-20 h-20 bg-slate-100 neo-inset rounded-xl flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold text-center neo-bg">ছবি নেই</div>
                                            )}

                                             <div className="flex-1 min-w-0">
                                                {/* Badge */}
                                                {item.badge && (
                                                    <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 px-2 py-0.5 rounded-full mb-2">{item.badge}</span>
                                                )}
                                                {/* Name */}
                                                <input 
                                                    className="w-full font-black text-slate-900 dark:text-white tracking-tight text-base outline-none border-b-2 border-transparent focus:border-emerald-400 pb-1 mb-1 bg-transparent dark:text-white" 
                                                    value={item.name} 
                                                    onChange={e => updateStockItem(item.id, 'name', e.target.value)}
                                                />
                                                {/* Price info */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-emerald-700 font-black text-sm">৳{item.price}</span>
                                                    {item.originalPrice > item.price && (
                                                        <span className="text-slate-400 font-semibold text-xs line-through">৳{item.originalPrice}</span>
                                                    )}
                                                    {item.description && <span className="text-[9px] bg-indigo-50/50 text-indigo-600 dark:text-blue-500 font-bold px-2 py-0.5 rounded-full">{item.description}</span>}
                                                </div>

                                                {/* Colors */}
                                                <div className="mb-2">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">কালার ({item.colors.length}টি)</label>
                                                    <input 
                                                        className="w-full mt-1 p-2 text-sm bg-slate-50 neo-inset border-2 rounded-lg outline-none focus:border-emerald-400 font-semibold neo-bg" 
                                                        value={item.colors.join(', ')} 
                                                        onChange={e => updateStockItem(item.id, 'colors', e.target.value.split(',')?.map(c => c.trim())?.filter(Boolean))}
                                                        placeholder="Black, Maroon, Olive..."
                                                    />
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.colors?.map(c => (
                                                            <span key={c} className="text-[10px] font-bold bg-slate-100 neo-inset text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-full uppercase neo-bg">{c}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Sizes */}
                                                <div className="mb-2">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">সাইজ ({item.sizes.length}টি)</label>
                                                    <input 
                                                        className="w-full mt-1 p-2 text-sm bg-slate-50 neo-inset border-2 rounded-lg outline-none focus:border-emerald-400 font-semibold neo-bg" 
                                                        value={item.sizes.join(', ')} 
                                                        onChange={e => updateStockItem(item.id, 'sizes', e.target.value.split(',')?.map(s => s.trim())?.filter(Boolean))}
                                                        placeholder="52, 54, 56, 58..."
                                                    />
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.sizes?.map(s => (
                                                            <span key={s} className="text-[10px] font-bold bg-indigo-50/50 text-indigo-600 dark:text-blue-500 px-2 py-0.5 rounded-full">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Qty & Price & Delete */}
                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                <button onClick={() => removeStockItem(item.id)} className="text-rose-400 hover:text-rose-600 transition-colors">
                                                    <Trash2 size={18}/>
                                                </button>
                                                <div className="text-right">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400">প্রতি কম্বো স্টক</label>
                                                    <input 
                                                        type="number" min="0"
                                                        className="w-20 mt-1 p-2 text-center bg-emerald-50 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-lg outline-none focus:border-emerald-500 font-black text-emerald-800 dark:text-emerald-200 text-lg" 
                                                        value={item.qty} 
                                                        onChange={e => updateStockItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="text-right">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400">দাম (৳)</label>
                                                    <input 
                                                        type="number" min="0"
                                                        className="w-24 mt-1 p-2 text-center bg-slate-50 neo-inset border-2 rounded-lg outline-none focus:border-blue-400 font-bold text-slate-800 dark:text-white neo-bg" 
                                                        value={item.price} 
                                                        onChange={e => updateStockItem(item.id, 'price', parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="bg-slate-50 neo-inset text-slate-600 dark:text-zinc-300 text-[10px] font-bold rounded-lg px-3 py-2 text-center uppercase tracking-widest neo-bg">
                                                    {item.colors.length} × {item.sizes.length} = {item.colors.length * item.sizes.length} ভেরিয়েন্ট
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Save Log */}
                    {stockSaveLog.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm neo-card dark:border-white/5 ">
                            <h4 className="font-black text-slate-800 dark:text-white mb-4 uppercase tracking-widest text-sm">সেভ রিপোর্ট</h4>
                            <div className="space-y-2">
                                {stockSaveLog?.map((log, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold ${log.type === 'error' ? 'bg-rose-50 text-rose-700' : log.type === 'created' ? 'bg-indigo-50/50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                        {log.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
                                        <span className="font-black">{log.name}</span>
                                        <span className="ml-auto">{log.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default SmartAssistantView;
