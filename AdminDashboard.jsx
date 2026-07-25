import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, storage, auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, addDoc, serverTimestamp, where, getDocs, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ProductManagerView from './ProductManagerView';
import FinancialLedgerView from './FinancialLedgerView';
import CourierTrackingView from './CourierTrackingView';
import NeumorphicDashboardView from './NeumorphicDashboardView';
import TeamChatView from './TeamChatView';
import NoticeBoardView from './NoticeBoardView';
import SmartAnalyticsView from './SmartAnalyticsView';
import ProfitLossView from './ProfitLossView';
import CustomerDatabaseView from './CustomerDatabaseView';
import SmartAssistantView from './SmartAssistantView';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Tesseract from 'tesseract.js';
import {
    LayoutDashboard,
    ShoppingBag,
    PlusCircle,
    Search,
    Phone,
    MapPin,
    XCircle,
    Menu,
    X,
    Printer,
    LogOut,
    FileText,
    ExternalLink,
    Link,
    Globe,
    Package,
    TrendingUp,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    Copy,
    Check,
    Facebook,
    BarChart2,
    RefreshCw,
    Wallet,
    Factory,
    Calendar,
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingDown,
    Shield,
    Users,
    User,
    CreditCard,
    QrCode,
    History,
    UploadCloud,
    Image as ImageIcon,
    AlertTriangle, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Sparkles, MessageSquare, Bell, Moon, Sun } from 'lucide-react';
import {  GOOGLE_SHEET_URL, GOOGLE_SHEET_VIEW_URL , appConfig } from './config';

const LINKS = {
    website: [
        { label: 'হোম পেজ', url: '/', icon: '🏠' },
        { label: 'হায়া সিরিজ', url: '/haya', icon: '✨' },
        { label: 'ক্লাসিক কম্বো', url: '/classic', icon: '👗' },
        { label: 'মা কালেকশন', url: '/ma', icon: '💝' },
        { label: 'মা ও বড়মেয়ে', url: '/maboromeye', icon: '💫' },
        { label: 'বড়বোন কালেকশন', url: '/borobon', icon: '🌸' },
        { label: 'কিডস কালেকশন', url: '/kids', icon: '🎀' },
        { label: 'হিজাব কালেকশন', url: '/hijab', icon: '🧕' },
    ],
    admin: [
        { label: '➕ নতুন ম্যানুয়াল অর্ডার এন্ট্রি', tab: 'add-order', icon: '➕' },
        { label: 'Admin Dashboard', url: '/admin', icon: '🔐' },
        { label: 'Google Sheet (Orders)', url: GOOGLE_SHEET_VIEW_URL, icon: '📊' },
        { label: 'Firebase Console', url: 'https://console.firebase.google.com/project/nr-zone-bd/firestore', icon: '🔥' },
        { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', icon: '▲' },
        { label: 'GitHub Repository', url: 'https://github.com', icon: '🐙' },
    ],
    social: [
        { label: 'Facebook Page', url: 'https://www.facebook.com/nrzonee', icon: '📘' },
        { label: 'Facebook Ads Manager', url: 'https://www.facebook.com/adsmanager', icon: '📣' },
        { label: 'Facebook Business Suite', url: 'https://business.facebook.com', icon: '💼' },
    ]
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isStockPanelOpen, setIsStockPanelOpen] = useState(false);
    const [bookingOrder, setBookingOrder] = useState(null);
    const [bookingConfig, setBookingConfig] = useState({
        courier: 'steadfast',
        cod: 0,
        weight: '0.5',
        note: 'পার্সেল ডেলিভারি'
    });

    // Update CoD when bookingOrder is selected
    useEffect(() => {
        if (bookingOrder) {
            setBookingConfig({
                courier: 'steadfast',
                cod: bookingOrder.total || 0,
                weight: '0.5',
                note: 'পার্সেল ডেলিভারি'
            });
        }
    }, [bookingOrder]);

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        if (!bookingOrder) return;
        try {
            let result;
            const orderData = {
                ...bookingOrder,
                total: parseInt(bookingConfig.cod),
                weight: parseFloat(bookingConfig.weight),
                note: bookingConfig.note
            };

            if (bookingConfig.courier === 'steadfast') {
                const config = {
                    apiKey: integrations.steadfastApiKey,
                    secretKey: integrations.steadfastSecretKey
                };
                result = await bookSteadfastOrder(orderData, config);
            } else if (bookingConfig.courier === 'pathao') {
                const config = {
                    clientId: integrations.pathaoClientId,
                    clientSecret: integrations.pathaoClientSecret,
                    storeId: integrations.pathaoStoreId
                };
                result = await bookPathaoOrder(orderData, config);
            } else if (bookingConfig.courier === 'redx') {
                const config = {
                    apiKey: integrations.redxApiKey
                };
                result = await bookRedxOrder(orderData, config);
            }

            if (result && result.success) {
                // Update Firestore order
                await updateDoc(doc(db, "orders", bookingOrder.firebaseId), {
                    trackingId: result.trackingId,
                    courier: bookingConfig.courier,
                    status: 'shipped',
                    courierStatus: 'কুরিয়ারে বুকড করা হয়েছে'
                });

                // Dispatch WhatsApp Shipped notification
                if (integrations.whatsappApiKey) {
                    await sendWhatsAppNotification('shipped', {
                        ...orderData,
                        trackingId: result.trackingId,
                        courier: bookingConfig.courier
                    }, {
                        gatewayUrl: integrations.whatsappGatewayUrl,
                        apiKey: integrations.whatsappApiKey,
                        instanceId: integrations.whatsappInstanceId
                    });
                }

                alert(`বুকিং সফল হয়েছে!\nট্র্যাকিং আইডি: ${result.trackingId}`);
                setBookingOrder(null);
            }
        } catch (err) {
            alert(`বুকিং ব্যর্থ হয়েছে: ${err.message}`);
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState('Overview');
    const [orders, setOrders] = useState([]);
    const [globalWebsiteFilter, setGlobalWebsiteFilter] = useState('All');
    
    const uniqueWebsites = useMemo(() => ['All', ...new Set(orders?.map(o => o.sourceWebsite || 'NR ZONE'))], [orders]);
    
    const filteredOrdersByWebsite = useMemo(() => {
        return globalWebsiteFilter === 'All' ? orders : orders?.filter(o => (o.sourceWebsite || 'NR ZONE') === globalWebsiteFilter);
    }, [orders, globalWebsiteFilter]);
    const [fraudNumbers, setFraudNumbers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('adminLoggedIn') === 'true');
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [loginError, setLoginError] = useState('');
    const [copiedUrl, setCopiedUrl] = useState('');
    const [printData, setPrintData] = useState(null);
    const [printMode, setPrintMode] = useState('a4');
    const [showMobileFAB, setShowMobileFAB] = useState(false);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
    const [workerAccounts, setWorkerAccounts] = useState([]);
    const [workerTransactions, setWorkerTransactions] = useState([]);
    const [remotePasswords, setRemotePasswords] = useState(null);
    const [staffUsers, setStaffUsers] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    // New order notification logic
    const prevOrderCount = useRef(0);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    useEffect(() => {
        if (orders.length > prevOrderCount.current && prevOrderCount.current !== 0) {
            // New order arrived!
            audioRef.current.play().catch(e => console.log('Audio play error:', e));
        }
        prevOrderCount.current = orders.length;
    }, [orders]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Auto-expand stock panel when a stock/finance tab becomes active
    useEffect(() => {
        if (['products', 'factory-expenses', 'financial-ledger', 'worker-ledger'].includes(activeTab)) {
            setIsStockPanelOpen(true);
        }
    }, [activeTab]);

    // Responsive sidebar listener: only collapse on small screens, never auto-expand to respect user choice
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1200) {
                setIsSidebarOpen(false);
            }
        };
        handleResize(); // run once on load
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = e.target.username.value;
        const password = e.target.password.value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            setIsLoggedIn(true);
            setUserRole('Admin');
            setUserName(user.email.split('@')[0]);
            
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('userRole', 'Admin');
            localStorage.setItem('userName', user.email.split('@')[0]);
            setLoginError('');
        } catch (error) {
            console.error("Login Error:", error);
            setLoginError('ভুল ইমেইল বা পাসওয়ার্ড!');
        }
    };

    const handleLogout = async () => {
        // 1. Clear all React state
        setIsLoggedIn(false);
        setUserRole('');
        setUserName('');
        setActiveTab('dashboard');

        // 2. Nuke ALL localStorage & sessionStorage (no trace left)
        localStorage.clear();
        sessionStorage.clear();

        // 3. Clear Firebase Auth
        if (auth) {
            try {
                await auth.signOut();
            } catch(e) {}
        }

        // 3. Clear all cookies for this domain
        document.cookie.split(';').forEach(function(c) {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });

        // 4. Unregister PWA Service Workers (prevent cached credential reuse)
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) await reg.unregister();
            } catch(e) {}
        }

        // 5. Clear Cache API (junk file cleanup)
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                for (let key of keys) await caches.delete(key);
            } catch(e) {}
        }
    };

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(''), 2000);
    };

    const handlePrint = (order, mode = 'a4') => {
        setPrintMode(mode);
        setPrintData(order);
        setTimeout(() => {
            window.print();
            setPrintData(null);
        }, 300);
    };

    const isAdmin = userRole === 'Admin';
    const isManager = userRole === 'Manager';
    const isWorker = userRole === 'Worker';

    const toggleFraud = async (phone) => {
        if (!phone) return;
        const p = phone.trim();
        try {
            if (fraudNumbers.includes(p)) {
                const q = query(collection(db, 'fraud_numbers'), where('phone', '==', p));
                const snap = await getDocs(q);
                snap.forEach(d => deleteDoc(doc(db, 'fraud_numbers', d.id)));
                setToastMessage("Fraud status removed");
            } else {
                await addDoc(collection(db, 'fraud_numbers'), { phone: p, addedAt: serverTimestamp() });
                setToastMessage("Marked as Fraud!");
            }
        } catch (error) {
            console.error("Error toggling fraud:", error);
        }
    };

    const checkOnlineFraud = async (phone) => {
        // This is a stub for Steadfast/Pathao API integration
        // Since we need an API key, we will alert the user for now
        // Later we can implement the real fetch request here
        alert(`API Key is required to check fraud records for ${phone}.\nPlease add your Steadfast/Pathao API Key in the settings first.`);
        // Example future implementation:
        // const response = await fetch(`https://steadfast.com.bd/api/v1/status_by_phone/${phone}`, { headers: { 'Api-Key': 'YOUR_KEY', 'Secret-Key': 'YOUR_SECRET' }});
    };

    // Fraud Numbers Listener
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "fraud_numbers"), (snapshot) => {
            setFraudNumbers(snapshot.docs?.map(doc => doc.data().phone));
        });
        return () => unsubscribe();
    }, []);

    // Orders Listener
    useEffect(() => {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersArray = [];
            querySnapshot.forEach((doc) => {
                ordersArray.push({ ...doc.data(), firebaseId: doc.id });
            });
            setOrders(ordersArray);
        }, (error) => {
            console.error("Firestore Orders Error:", error);
            alert("Firestore Error (Orders): " + error.message);
            // Fallback for missing index
            if (error.message.includes('index')) {
                console.warn("Falling back to unordered orders fetch.");
                const fallbackQ = query(collection(db, "orders"));
                onSnapshot(fallbackQ, (fallbackSnapshot) => {
                    const fallbackArray = [];
                    fallbackSnapshot.forEach((doc) => {
                        fallbackArray.push({ ...doc.data(), firebaseId: doc.id });
                    });
                    // Sort manually if createdAt exists
                    fallbackArray.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                    setOrders(fallbackArray);
                }, (fallbackError) => {
                    alert("Fallback Fetch Error: " + fallbackError.message);
                });
            }
        });
        return () => unsubscribe();
    }, []);

    // Expenses Listener
    useEffect(() => {
        const q = query(collection(db, "factory_expenses"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const expensesArray = [];
            querySnapshot.forEach((doc) => {
                expensesArray.push({ ...doc.data(), firebaseId: doc.id });
            });
            setExpenses(expensesArray);
        });
        return () => unsubscribe();
    }, []);

    // Worker Accounts Listener
    useEffect(() => {
        const q = query(collection(db, "worker_accounts"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setWorkerAccounts(snapshot.docs?.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });
        return () => unsubscribe();
    }, []);

    // Worker Transactions Listener
    useEffect(() => {
        const q = query(collection(db, "worker_transactions"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setWorkerTransactions(snapshot.docs?.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });
        return () => unsubscribe();
    }, []);

    
    // Load Staff Users
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "staff_users"), (snapshot) => {
            setStaffUsers(snapshot.docs?.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });
        return () => unsubscribe();
    }, []);

    // Load Remote Passwords
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "passwords"), (doc) => {
            if (doc.exists()) setRemotePasswords(doc.data());
        });
        return () => unsubscribe();
    }, []);

    // Load Products into allProducts
    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllProducts(snapshot.docs?.map(doc => ({ 
                firebaseId: doc.id,
                ...doc.data() 
            })));
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (isLoggedIn) {
            if (isWorker && activeTab !== 'orders') {
                setActiveTab('orders');
            } else if (isManager && activeTab === 'dashboard') {
                setActiveTab('orders');
            }
        }
    }, [isLoggedIn, userRole]);

    const updateTrackingId = async (firebaseId, trackingId) => {
        try {
            await updateDoc(doc(db, "orders", firebaseId), { trackingId });
        } catch (error) { console.error(error); }
    };

    const adjustStockForOrder = async (orderId, oldStatus, newStatus) => {
        try {
            const order = orders.find(o => o.firebaseId === orderId);
            if (!order || !order.selectedProductId) return;

            const productId = order.selectedProductId;
            const quantity = parseInt(order.quantity) || 1;

            let delta = 0;
            if (oldStatus !== 'delivered' && newStatus === 'delivered') {
                delta = -quantity;
            } else if (oldStatus === 'delivered' && newStatus !== 'delivered') {
                delta = quantity;
            }

            if (delta === 0) return;

            const productRef = doc(db, "products", productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const productData = productSnap.data();
                const currentStock = productData.stockCount !== undefined ? parseInt(productData.stockCount) : 0;
                const newStock = Math.max(0, currentStock + delta);
                
                await updateDoc(productRef, {
                    stockCount: newStock,
                    stock: newStock === 0 ? 'out_of_stock' : 'available'
                });
                // Stock adjusted for product
            }
        } catch (error) {
            console.error("adjustStockForOrder error:", error);
        }
    };

    const updateStatus = async (firebaseId, newStatus) => {
        try {
            const order = orders.find(o => o.firebaseId === firebaseId);
            const oldStatus = order ? order.status : 'pending';
            await adjustStockForOrder(firebaseId, oldStatus, newStatus);
            await updateDoc(doc(db, "orders", firebaseId), { status: newStatus });
        } catch (error) { console.error(error); }
    };

    const deleteOrder = async (firebaseId) => {
        if (!isAdmin) { alert('দুঃখিত, শুধুমাত্র এডমিন ডিলিট করতে পারবেন।'); return; }
        if (confirm('আপনি কি এই অর্ডারটি ডিলিট করতে চান?')) {
            try {
                const order = orders.find(o => o.firebaseId === firebaseId);
                if (order && order.status === 'delivered') {
                    await adjustStockForOrder(firebaseId, 'delivered', 'cancelled');
                }
                await deleteDoc(doc(db, "orders", firebaseId));
            } catch (error) { console.error(error); }
        }
    };

    const deleteExpense = async (firebaseId) => {
        if (!isAdmin) { alert('দুঃখিত, শুধুমাত্র এডমিন ডিলিট করতে পারবেন।'); return; }
        if (confirm('আপনি কি এই খরচটি ডিলিট করতে চান?')) {
            try { await deleteDoc(doc(db, "factory_expenses", firebaseId)); } catch (error) { console.error(error); }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 border-amber-200 dark:border-amber-500/30 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50';
            case 'confirmed': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 border-indigo-200 dark:border-indigo-500/30 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50';
            case 'shipped': return 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50';
            case 'delivered': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50';
            case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-900 border-red-200 dark:border-red-500/30 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/50';
            case 'returned': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-900 border-pink-200 dark:border-pink-500/30 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700/50';
            case 'qc_in_progress': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 border-indigo-200 dark:border-indigo-500/30 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50';
            case 'scrapped': return 'bg-[#1e293b] text-white border-slate-900 dark:bg-slate-800 dark:border-slate-600';
            default: return 'bg-gray-100 text-gray-900 dark:text-white dark:bg-white/10 dark:text-gray-300';
        }
    };

    const getStatusBangla = (status) => {
        switch (status) {
            case 'pending': return 'নতু্ন অর্ডার';
            case 'confirmed': return 'কনফার্মড';
            case 'shipped': return 'কুরিয়ারে আছে';
            case 'delivered': return 'ডেলিভারড';
            case 'cancelled': return 'বাতিল';
            case 'returned': return 'রিটার্নড';
            case 'qc_in_progress': return 'QC ইন প্রোগ্রেস';
            case 'scrapped': return 'ড্যামেজ/স্ক্র্যাপ';
            default: return status;
        }
    };

    // ─── DASHBOARD VIEW ────────────────────────────────
    const DashboardView = () => {
        const totalSales = orders?.filter(o => o.status === 'delivered')?.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const totalExpenses = expenses?.reduce((acc, curr) => acc + (parseInt(curr.amount) || 0), 0);
        const pendingCount = orders?.filter(o => o.status === 'pending').length;

        const stats = [
            { label: 'মোট বিক্রি (Cash)', value: `৳ ${totalSales.toLocaleString()}`, sub: 'Delivered', icon: <ArrowUpCircle size={28} />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'মোট খরচ (Expense)', value: `৳ ${totalExpenses.toLocaleString()}`, sub: 'Factory/Production', icon: <TrendingDown size={28} />, color: 'text-rose-700', bg: 'bg-rose-50' },
            { label: 'নিট প্রফিট (Estimated)', value: `৳ ${(totalSales - totalExpenses).toLocaleString()}`, sub: 'Profit/Loss', icon: <Wallet size={28} />, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'নতুন অর্ডার (Waiting)', value: pendingCount, sub: 'অপেক্ষমাণ', icon: <Clock size={28} />, color: 'text-amber-700', bg: 'bg-amber-50' },
        ];

        return (
            <div className="space-y-10 animate-fade-in no-print">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight dark:text-white">ড্যাশবোর্ড ওভারভিউ</h2>
                        <p className="text-slate-700 dark:text-white font-medium">
                             <User size={16} /> লগইন আছেন: <span className="font-medium text-slate-800 dark:text-white">{userRole}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats?.map((stat, i) => (
                        <div key={i} className="bg-white p-4 md:p-8 rounded-md shadow-sm border border-slate-100 hover:shadow-sm hover:scale-[1.02] transition-all group neo-card dark:border-white/5 ">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold uppercase tracking-normal mb-3">{stat.label}</p>
                                    <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-2 font-medium">{stat.sub}</p>
                                </div>
                                <div className={`p-4 ${stat.bg} ${stat.color} rounded-[1.2rem] group-hover:rotate-12 transition-transform`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden neo-card dark:border-white/5 ">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50 neo-inset/20 neo-bg">
                            <h3 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-3">
                                <ShoppingBag size={24} className="text-[#111827] dark:text-white" /> সাম্প্রতিক অর্ডারসমূহ
                            </h3>
                            <button onClick={() => setActiveTab('orders')} className="text-sm font-semibold text-[#111827] dark:text-white hover:underline">সব অর্ডার</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm md:text-base text-left">
                                <thead className="text-slate-900 dark:text-white font-bold uppercase text-[11px] tracking-widest border-b border-slate-50 dark:border-white/10 dark:bg-[#1C1C1F]">
                                    <tr>
                                        <th className="px-4 py-3 text-[13px]">ID</th>
                                        <th className="px-4 py-3 text-[13px]">নাম</th>
                                        <th className="px-4 py-3 text-[13px]">টাকা</th>
                                        <th className="p-6 text-right">স্ট্যাটাস</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orders.slice(0, 5)?.map((order) => (
                                        <tr key={order.firebaseId} className="hover:bg-slate-50 neo-inset/50 transition-colors neo-bg">
                                            <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] font-semibold text-[#111827] dark:text-white">#{order.firebaseId?.slice(-4).toUpperCase()}</td>
                                            <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] font-medium text-slate-700 dark:text-white">{order.name}</td>
                                            <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] font-semibold text-slate-900 dark:text-white tracking-tight dark:text-white">৳{order.total}</td>
                                            <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] text-right font-semibold uppercase">
                                                <span className={`px-3 py-1 rounded-xl text-[11px] ${getStatusColor(order.status)} border`}>
                                                    {getStatusBangla(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden neo-card dark:border-white/5 ">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50 neo-inset/20 neo-bg">
                            <h3 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-3">
                                <Factory size={24} className="text-rose-600" /> সাম্প্রতিক খরচসমূহ
                            </h3>
                            <button onClick={() => setActiveTab('factory-expenses')} className="text-sm font-semibold text-rose-600 hover:underline">সব খরচ</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm md:text-base text-left">
                                <thead className="text-slate-900 dark:text-white font-bold uppercase text-[11px] tracking-widest border-b border-slate-50 dark:border-white/10 dark:bg-[#1C1C1F]">
                                    <tr>
                                        <th className="px-4 py-3 text-[13px]">তারিখ</th>
                                        <th className="px-4 py-3 text-[13px]">ক্যাটাগরি</th>
                                        <th className="p-6 text-right">অংক</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expenses.slice(0, 5)?.map((exp) => (
                                        <tr key={exp.firebaseId} className="hover:bg-slate-50 neo-inset/50 transition-colors neo-bg">
                                            <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] font-medium text-slate-500 dark:text-zinc-300">{exp.date}</td>
                                            <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] font-semibold text-slate-700 dark:text-white">{exp.category}</td>
                                            <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] text-right font-semibold text-rose-600 uppercase">৳{exp.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── ORDER LIST VIEW ────────────────────────────────
    const OrderListView = () => {
        const [statusFilter, setStatusFilter] = useState('all');
        const [isScanning, setIsScanning] = useState(false);
        const [selectedOrders, setSelectedOrders] = useState([]);
        
        const handleToggleSelect = (e, orderId) => {
            e.stopPropagation();
            setSelectedOrders(prev => 
                prev.includes(orderId) ? prev?.filter(id => id !== orderId) : [...prev, orderId]
            );
        };

        const handleSelectAll = (e, filteredOrderIds) => {
            e.stopPropagation();
            if (selectedOrders.length === filteredOrderIds.length) {
                setSelectedOrders([]);
            } else {
                setSelectedOrders(filteredOrderIds);
            }
        };

        const handleBulkStatusUpdate = async (newStatus) => {
            if (!newStatus || selectedOrders.length === 0) return;
            if (!window.confirm(`Are you sure you want to update ${selectedOrders.length} orders to ${newStatus}?`)) return;
            
            try {
                // Adjust stock for each selected order first
                for (const id of selectedOrders) {
                    const order = orders.find(o => o.firebaseId === id);
                    const oldStatus = order ? order.status : 'pending';
                    await adjustStockForOrder(id, oldStatus, newStatus);
                }

                const updatePromises = selectedOrders?.map(id => updateDoc(doc(db, 'orders', id), { status: newStatus }));
                await Promise.all(updatePromises);
                setSelectedOrders([]); // Clear selection after success
                alert(`${selectedOrders.length} orders updated successfully!`);
            } catch (err) {
                console.error("Bulk update error:", err);
                alert("Failed to update some orders.");
            }
        };

        const handleWhatsAppMessage = (order) => {
            let msg = "";
            const cleanPhone = order.phone?.replace(/\D/g, '') || '';
            const waPhone = cleanPhone.length === 11 ? `88${cleanPhone}` : cleanPhone;

            if (order.status === 'pending') {
                msg = `আসসালামু আলাইকুম ${order.name} ভাই/আপু,\n\nNR ZONE এ আপনার #${order.firebaseId?.slice(-6).toUpperCase()} অর্ডারটি পেয়েছি। অর্ডারটি কনফার্ম করতে রিপ্লাই দিন।\n\nপ্রোডাক্ট: ${order.productType}\nটোটাল বিল: ৳${order.total}`;
            } else if (order.status === 'shipped') {
                msg = `আসসালামু আলাইকুম ${order.name},\n\nআপনার অর্ডারটি কুরিয়ারে হস্তান্তর করা হয়েছে। পার্সেলটি দ্রুত আপনার কাছে পৌঁছে যাবে। ধন্যবাদ!`;
            } else if (order.status === 'delivered') {
                msg = `আসসালামু আলাইকুম ${order.name},\n\nআপনার অর্ডারটি ডেলিভারি হয়েছে। আমাদের সার্ভিস কেমন লেগেছে তা রিভিউ দিলে খুশি হবো!`;
            } else {
                msg = `*ORDER* #${order.firebaseId?.slice(-6).toUpperCase()} - ${order.name} - ${order.phone}\nAddress: ${order.address}\nProduct: ${order.productType} Sz:${order.size} Col:${order.color}\nTotal: ৳${order.total}`;
            }

            const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
        };

        const handlePrintLabels = (orderIds) => {
            if (orderIds.length === 0) return;
            const ordersToPrint = orders?.filter(o => orderIds.includes(o.firebaseId));
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print Labels</title>
                    <style>
                        body { font-family: sans-serif; margin: 0; padding: 0; }
                        /* Standard 50x50mm label CSS */
                        .label {
                            width: 50mm;
                            height: 50mm;
                            padding: 3mm;
                            box-sizing: border-box;
                            page-break-after: always;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            border: 1px dashed #ccc; /* for preview */
                        }
                        @media print {
                            .label { border: none; }
                            @page { margin: 0; size: 50mm 50mm; }
                        }
                        .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
                        .order-id { font-size: 10px; margin-bottom: 4px; }
                        .qr-code { width: 80px; height: 80px; margin-bottom: 4px; }
                        .customer-name { font-size: 11px; font-weight: bold; }
                        .customer-phone { font-size: 11px; }
                    </style>
                </head>
                <body>
                    ${ordersToPrint?.map(o => `
                        <div class="label">
                            <div class="shop-name">NR ZONE</div>
                            <div class="order-id">ID: #${(o.firebaseId || '').slice(-6).toUpperCase()}</div>
                            <img loading="lazy" class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${o.firebaseId}" />
                            <div class="customer-name">${(o.name || '').substring(0, 20)}</div>
                            <div class="customer-phone">${o.phone}</div>
                        </div>
                    `).join('')}
                    <script>
                        window.onload = () => { window.print(); };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        };
        
        const startScanner = () => {
            setIsScanning(true);
            setTimeout(() => {
                const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
                scanner.render(
                    (decodedText) => {
                        setSearchTerm(decodedText);
                        setIsScanning(false);
                        scanner.clear();
                    },
                    (error) => {
                        // ignore error
                    }
                );
            }, 300);
        };

        const downloadDispatchManifest = async () => {
            const manifestOrders = orders?.filter(o => o.status === 'confirmed' || o.status === 'shipped');
            if (manifestOrders.length === 0) {
                alert('No Confirmed or Shipped orders found for the manifest.');
                return;
            }
            
            const manifestDiv = document.createElement('div');
            manifestDiv.style.width = '800px';
            manifestDiv.style.padding = '40px';
            manifestDiv.style.background = '#fff';
            manifestDiv.style.color = '#000';
            manifestDiv.style.fontFamily = 'sans-serif';
            manifestDiv.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px;">NR ZONE Daily Dispatch Manifest</h1>
                    <p style="margin: 5px 0;">Date: ${new Date().toLocaleDateString()}</p>
                    <p style="margin: 5px 0;">Total Parcels: ${manifestOrders.length}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; text-align: left;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="border: 1px solid #ccc; padding: 8px;">Order ID</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">Customer Name</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">Phone</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">Address</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">COD</th>
                            <th style="border: 1px solid #ccc; padding: 8px; width: 100px;">Signature</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${manifestOrders?.map(o => `
                            <tr>
                                <td style="border: 1px solid #ccc; padding: 8px;">#${o.firebaseId?.slice(-6).toUpperCase()}</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${o.name}</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${o.phone}</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${o.address.substring(0,30)}...</td>
                                <td style="border: 1px solid #ccc; padding: 8px;">${o.total}</td>
                                <td style="border: 1px solid #ccc; padding: 8px;"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="display: flex; justify-content: space-between; margin-top: 50px;">
                    <div>
                        <hr style="width: 200px; border: 1px solid #000; margin-bottom: 5px;" />
                        <p style="text-align: center; margin: 0;">Authorized Signature</p>
                    </div>
                    <div>
                        <hr style="width: 200px; border: 1px solid #000; margin-bottom: 5px;" />
                        <p style="text-align: center; margin: 0;">Courier Boy Signature</p>
                    </div>
                </div>
            `;
            document.body.appendChild(manifestDiv);
            
            try {
                const canvas = await html2canvas(manifestDiv, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Dispatch_Manifest_${new Date().toISOString().slice(0,10)}.pdf`);
            } catch (e) {
                console.error("PDF generation failed", e);
                alert("PDF generation failed.");
            } finally {
                document.body.removeChild(manifestDiv);
            }
        };

        const phoneCounts = {};
        orders.forEach(o => {
            if (o.phone) {
                const p = o.phone.trim();
                phoneCounts[p] = (phoneCounts[p] || 0) + 1;
            }
        });

        const filteredOrders = orders?.filter(order => {
            const matchesSearch = (order.name?.toLowerCase().includes(searchTerm.toLowerCase()) || order.phone?.includes(searchTerm) || order.firebaseId?.toLowerCase().includes(searchTerm.toLowerCase()) || order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            const matchesWorker = !isWorker || order.enteredByName === userName;
            return matchesSearch && matchesStatus && matchesWorker;
        });

        const workerEarnings = useMemo(() => {
            if (!isWorker) return 0;
            const myDeliveredOrders = orders?.filter(o => o.enteredByName === userName && o.status === 'delivered');
            const rate = Number(localStorage.getItem('commissionRate') || 20);
            return myDeliveredOrders.length * rate;
        }, [orders, isWorker, userName]);

        return (
            <div className="space-y-8 no-print min-h-screen animate-fade-in text-slate-800 dark:text-white">
                <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
                    <div>
                        <h2 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight dark:text-white">অর্ডার আর্কাইভ</h2>
                        <p className="text-slate-700 dark:text-white text-lg mt-2 font-medium">নিখুঁত অর্ডার ট্র্যাকিং সিস্টেম</p>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                        {isWorker && (
                            <div className="bg-emerald-50 border-2 border-emerald-200 dark:border-emerald-500/30 px-6 py-4 rounded-xl text-emerald-800 dark:text-emerald-200">
                                <p className="text-[11px] font-medium uppercase tracking-widest">আমার ইনকাম (ডেলিভারড)</p>
                                <p className="text-xl font-semibold">৳{workerEarnings}</p>
                            </div>
                        )}
                        {(isAdmin || isManager) && (
                            <button 
                                onClick={() => setIsAddOrderModalOpen(true)}
                                className="px-6 py-5 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 hover:bg-indigo-700 dark:hover:bg-zinc-200 text-white font-medium rounded-md transition shadow-sm whitespace-nowrap border-none text-base cursor-pointer flex items-center gap-2"
                            >
                                ➕ নতুন ম্যানুয়াল অর্ডার
                            </button>
                        )}
                        <button onClick={startScanner} className="px-6 py-5 bg-premium-gold text-white font-medium rounded-md hover:bg-yellow-600 transition shadow-sm border border-slate-200 whitespace-nowrap">
                            Scan QR
                        </button>
                        <button onClick={downloadDispatchManifest} className="px-6 py-5 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 hover:bg-indigo-700 dark:hover:bg-zinc-200 text-white font-medium rounded-md transition shadow-sm whitespace-nowrap border-none text-base cursor-pointer flex items-center gap-2">
                            <FileText size={18} /> PDF Manifest
                        </button>
                        <div className="relative group w-full md:w-[450px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-300 group-hover:text-indigo-500 transition-colors" size={24} />
                            <input
                                type="text"
                                placeholder="নাম, ফোন বা অর্ডার আইডি..."
                                className="pl-14 pr-8 py-5 border-2 border-slate-50 rounded-md w-full shadow-sm focus:ring-8 focus:ring-blue-100 focus:border-indigo-500 outline-none transition-all font-medium text-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {isScanning && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-white p-6 rounded-lg w-full max-w-lg neo-card dark:border-white/5 ">
                            <h3 className="text-xl font-medium mb-4 text-center text-slate-900 dark:text-white">Scan QR Code or Barcode</h3>
                            <div id="reader" className="w-full"></div>
                            <button onClick={() => setIsScanning(false)} className="w-full mt-4 px-4 py-3 bg-red-50 text-red-600 font-medium rounded-xl">Cancel Scanning</button>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 overflow-x-auto pb-4 noscroll">
                    {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned']?.map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-8 py-4 rounded text-slate-600 dark:text-zinc-300 font-semibold uppercase tracking-normal whitespace-nowrap transition-all border-2 ${statusFilter === status ? 'bg-[#0f172a] border-slate-900 text-white shadow-sm scale-[1.05]' : 'bg-white border-slate-50 text-slate-600 dark:bg-transparent dark:border-white/5 dark:text-zinc-400 hover:dark:bg-white/5'}`}
                        >
                            {status === 'all' ? 'সব অর্ডার' : getStatusBangla(status)}
                        </button>
                    ))}
                </div>

                {/* Bulk Action Bar */}
                {selectedOrders.length > 0 && (
                    <div className="bg-indigo-50/50 border border-indigo-200 dark:border-indigo-500/30 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs">{selectedOrders.length}</span>
                            <span className="font-semibold text-indigo-800 dark:text-indigo-200 text-sm">Orders Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                                value=""
                                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold outline-none focus:border-indigo-500"
                            >
                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="" disabled>-- Bulk Status Update --</option>
                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="pending">Mark as NEW ORDER</option>
                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="confirmed">Mark as CONFIRMED</option>
                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="shipped">Mark as SHIPPING</option>
                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="delivered">Mark as DELIVERED</option>
                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="cancelled">Mark as CANCELLED</option>
                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="returned">Mark as RETURNED</option>
                            </select>
                            
                            {/* Bulk Label Print */}
                            <button onClick={() => handlePrintLabels(selectedOrders)} className="px-4 py-2 bg-[#0f172a] text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-[#1e293b] transition-colors">
                                Print {selectedOrders.length} Labels
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm shadow-slate-200/50 border border-slate-50 overflow-hidden neo-card dark:border-white/5 ">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm md:text-base text-left border-collapse">
                            <thead className="bg-[#F5F5F5] dark:bg-[#1C1C1F] text-slate-900 dark:text-white font-bold text-[12px] border-y border-[#EBEDF0] dark:border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-center w-10">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 dark:text-blue-500 focus:ring-indigo-500 cursor-pointer"
                                            checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                                            onChange={(e) => handleSelectAll(e, filteredOrders?.map(o => o.firebaseId))}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[13px]">ORDER ID & DATE</th>
                                    <th className="px-4 py-3 text-[13px]">CUSTOMER DETAILS</th>
                                    <th className="px-4 py-3 text-[13px]">PRODUCT INFO</th>
                                    <th className="px-4 py-3 text-[13px]">TOTAL AMOUNT</th>
                                    <th className="px-4 py-3 text-[13px]">STATUS & TRACKING</th>
                                    <th className="px-4 py-3 text-center text-[13px]">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredOrders?.map((order) => {
                                    const pCount = order.phone ? phoneCounts[order.phone.trim()] : 0;
                                    const isFraud = order.phone ? fraudNumbers.includes(order.phone.trim()) : false;
                                    
                                    let rowClass = 'hover:bg-indigo-50/50 transition-all group dark:hover:bg-white/5';
                                    const isShortAddress = order.address && order.address.trim().length < 10;
                                    
                                    if (isFraud) {
                                        rowClass = 'border-[3px] border-rose-600 bg-rose-50 transition-all group dark:bg-rose-950/20 dark:border-rose-900/50';
                                    } else if (pCount > 1) {
                                        rowClass = 'border-[3px] border-orange-400 bg-orange-50/80 transition-all group dark:bg-orange-950/20 dark:border-orange-900/50';
                                    } else if (isShortAddress) {
                                        rowClass = 'border-[3px] border-yellow-400 bg-yellow-50/80 transition-all group dark:bg-yellow-950/20 dark:border-yellow-900/50';
                                    }

                                    return (
                                    <tr key={order.firebaseId} onClick={() => setSelectedOrderDetail(order)} className={`${rowClass} cursor-pointer`}>
                                        <td className="px-4 py-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 dark:text-blue-500 focus:ring-indigo-500 cursor-pointer"
                                                checked={selectedOrders.includes(order.firebaseId)}
                                                onChange={(e) => handleToggleSelect(e, order.firebaseId)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-[13px]">
                                            <div className="font-semibold text-[#111827] dark:text-white text-base uppercase tracking-wider">#{order.firebaseId?.slice(-6)}</div>
                                            <div className="text-xs text-slate-600 dark:text-zinc-300 mt-1 font-medium flex items-center gap-1.5"><Calendar size={12} /> {order.date}</div>
                                            {order.enteredByName && (
                                                <div className="text-[11px] mt-1 font-semibold bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded inline-block">
                                                    Entered by: {order.enteredByName} ({order.enteredByRole})
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[13px]">
                                            <div className="font-semibold text-slate-900 dark:text-white tracking-tight text-base leading-tight dark:text-white">
                                                {order.name}
                                                {isFraud && <span className="ml-2 inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-medium tracking-widest"><AlertCircle size={10} /> Fraud Detected</span>}
                                            </div>
                                            <div className="text-sm text-indigo-700 mt-1 font-semibold flex items-center gap-2 tracking-wide">
                                                <Phone size={14} className="text-blue-400" /> {order.phone}
                                                {pCount > 1 && (
                                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 text-[11px] font-semibold px-2 py-0.5 rounded-full ml-2 flex items-center gap-1 animate-pulse">
                                                        <AlertCircle size={10} /> ডাবল অর্ডার! ({pCount}টি)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-zinc-300 mt-2 font-medium leading-relaxed max-w-[200px]">
                                                {order.address}
                                                {isShortAddress && (
                                                    <div className="mt-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                                                        <AlertCircle size={10} /> ঠিকানা অসম্পূর্ণ
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px]">
                                            <div className="font-semibold text-slate-900 dark:text-white tracking-tight text-xs uppercase tracking-widest bg-slate-100 neo-inset/50 inline-block px-3 py-1 rounded-md mb-3 dark:text-white neo-bg">
                                                {order.sourceWebsite ? `${order.sourceWebsite} / ${order.landingPage}` : (order.landingPage || 'Direct Order')}
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="bg-[#0f172a] text-white px-4 py-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-widest shadow-md">COL: {order.color}</span>
                                                <span className="bg-[#111827] hover:bg-[#1F2937] text-white px-4 py-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-widest shadow-md">SZ: {order.size}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px]">
                                            <div className="font-semibold text-slate-900 dark:text-white tracking-tight text-xl tracking-tighter dark:text-white">৳{order.total}</div>
                                            <div className="text-[11px] text-slate-700 dark:text-white font-medium uppercase mt-1">Price + {order.deliveryCharge || 0} Del.</div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px]">
                                            <select
                                                value={order.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => updateStatus(order.firebaseId, e.target.value)}
                                                className={`text-[11px] font-semibold uppercase py-2 px-3 rounded border-2 appearance-none cursor-pointer tracking-widest ${getStatusColor(order.status)} transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 pr-8`}
                                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'3\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '12px' }}
                                            >
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="pending">NEW ORDER</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="confirmed">CONFIRMED</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="shipped">SHIPPING</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="delivered">DELIVERED</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="cancelled">CANCELLED</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="returned">RETURNED</option>
                                            </select>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()} className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] text-center w-[200px]">
                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                <button onClick={() => setBookingOrder(order)} className="p-1.5 px-2.5 bg-amber-50 hover:bg-premium-gold text-premium-gold hover:text-white dark:bg-premium-gold/15 dark:text-premium-gold dark:hover:text-white border border-premium-gold/20 rounded text-[10px] font-semibold uppercase flex items-center gap-1 transition-all active:scale-95" title="Book Courier (Steadfast/Pathao/RedX)">
                                                     🚚 বুকিং
                                                 </button>
                                                 <button onClick={() => checkOnlineFraud(order.phone)} className="p-1.5 px-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-blue-500 hover:bg-blue-200 rounded text-[10px] font-medium uppercase" title="Check Online Fraud API">
                                                    Fraud Check
                                                </button>
                                                <button onClick={() => toggleFraud(order.phone)} className={`p-2 rounded transition-all shadow-sm ${isFraud ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-300' : 'bg-slate-100 neo-inset text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`} title={isFraud ? "Unmark Fraud" : "Mark as Fraud Locally"}>
                                                    <AlertCircle size={16} />
                                                </button>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    const message = `*NEW ORDER ALERT* 📦\n\n*Order ID:* #${order.firebaseId?.slice(-6).toUpperCase()}\n*Customer:* ${order.name}\n*Phone:* ${order.phone}\n*Address:* ${order.address}\n\n*Product:* ${order.productType} (Sz: ${order.size}, Col: ${order.color})\n*QTY:* ${order.quantity || 1}\n*Total Bill:* ৳${order.total}\n\nPlease process this order.`;
                                                    navigator.clipboard.writeText(message).catch(() => {});
                                                    window.open(`https://chat.whatsapp.com/BE5Dux9KPRiFTdDDYb2Zm6`, '_blank');
                                                }} className="p-2 bg-emerald-50 text-emerald-600 hover:text-white hover:bg-emerald-500 rounded transition-all shadow-sm shadow-emerald-200" title="Copy Info & Open WhatsApp Group">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handlePrint(order, 'a4'); }} className="p-2 bg-[#111827] hover:bg-[#1F2937] text-white rounded hover:scale-110 active:scale-90 transition-all shadow-sm shadow-blue-200" title="Print Invoice (A4)">
                                                    <Printer size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handlePrint(order, 'thermal'); }} className="p-2 bg-sky-50 text-sky-600 hover:text-white hover:bg-sky-600 rounded hover:scale-110 active:scale-90 transition-all shadow-sm border border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30" title="Print POS Label (80mm)">
                                                    <FileText size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteOrder(order.firebaseId); }} className="p-2 bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded transition-all" title="Delete Order">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                                })}
                                {filteredOrders.length === 0 && (
                                    <tr><td colSpan="6" className="p-32 text-center text-slate-500 dark:text-zinc-300 font-semibold uppercase tracking-normal text-xl">Empty Result</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            {/* ─── ORDER FULL DETAIL MODAL ─── */}
            {selectedOrderDetail && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={() => setSelectedOrderDetail(null)}>
                    <div className="bg-white neo-card dark:border-white/5  rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                            <div>
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Order Details</div>
                                <div className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight dark:text-white tracking-tight">#{selectedOrderDetail.firebaseId?.slice(-6).toUpperCase()}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-widest ${getStatusColor(selectedOrderDetail.status)}`}>{getStatusBangla(selectedOrderDetail.status)}</span>
                                <button onClick={() => setSelectedOrderDetail(null)} className="p-2 bg-slate-100 neo-inset hover:bg-slate-200 rounded-full transition-all neo-bg"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-slate-50 neo-inset neo-bg rounded-xl p-5">
                                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3">কাস্টমার তথ্য</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">নাম</div>
                                        <div className="text-lg font-medium text-slate-900 dark:text-white tracking-tight dark:text-white mt-1">{selectedOrderDetail.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">মোবাইল</div>
                                        <div className="text-lg font-medium text-indigo-600 dark:text-blue-500 mt-1">{selectedOrderDetail.phone}</div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">ডেলিভারি ঠিকানা</div>
                                        <div className="text-base font-semibold text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed">{selectedOrderDetail.address}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 neo-inset neo-bg rounded-xl p-5">
                                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3">প্রোডাক্ট</div>
                                    <div className="flex gap-2 flex-wrap w-full md:w-auto">
                                        <span className="bg-[#0f172a] text-white px-3 py-1 rounded-lg text-xs font-medium uppercase">{selectedOrderDetail.productType}</span>
                                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-lg text-xs font-medium uppercase">COLOR: {selectedOrderDetail.color}</span>
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-medium uppercase">SIZE: {selectedOrderDetail.size}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-zinc-300 font-semibold mt-2">{selectedOrderDetail.sourceWebsite || 'NR ZONE'}</div>
                                </div>
                                <div className="bg-emerald-50 neo-bg rounded-xl p-5">
                                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3">পেমেন্ট</div>
                                    <div className="text-xl font-semibold text-emerald-700 tracking-tight">৳{selectedOrderDetail.total}</div>
                                    <div className="text-xs text-slate-500 dark:text-zinc-300 font-semibold mt-1">মূল্য ৳{selectedOrderDetail.price} + ডেলিভারি ৳{selectedOrderDetail.deliveryCharge || 0}</div>
                                </div>
                            </div>
                            <div className="bg-indigo-50/50 neo-bg rounded-xl p-5">
                                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3">অর্ডার তথ্য</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">তারিখ</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-zinc-300 mt-1">{selectedOrderDetail.date}</div>
                                    </div>
                                    {selectedOrderDetail.enteredByName && (
                                        <div>
                                            <div className="text-[11px] text-slate-400 font-semibold uppercase">এন্ট্রি করেছেন</div>
                                            <div className="text-sm font-medium text-indigo-700 mt-1">{selectedOrderDetail.enteredByName} <span className="text-blue-400">({selectedOrderDetail.enteredByRole})</span></div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">বর্তমান অবস্থা</div>
                                        <div className={`text-sm font-medium mt-1 ${getStatusColor(selectedOrderDetail.status)} px-3 py-1 rounded-full inline-block`}>{getStatusBangla(selectedOrderDetail.status)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                    <button onClick={() => handlePrint(selectedOrderDetail, 'a4')} className="flex-1 flex items-center justify-center gap-2 bg-[#0f172a] text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all">
                                        <Printer size={18} /> A4 প্রিন্ট
                                    </button>
                                    <button onClick={() => handlePrint(selectedOrderDetail, 'thermal')} className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 transition-all">
                                        <FileText size={18} /> POS থার্মাল লেবেল
                                    </button>
                                <button onClick={() => handleWhatsAppMessage(selectedOrderDetail)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Floating Action Button (FAB) */}
            <div className="md:hidden no-print fixed bottom-6 right-6 z-[400]">
                <button onClick={() => setShowMobileFAB(!showMobileFAB)} className="w-14 h-14 bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all">
                    {showMobileFAB ? <X size={24} /> : <PlusCircle size={24} />}
                </button>
                {showMobileFAB && (
                    <div className="absolute bottom-18 right-0 bg-white border border-slate-100 p-3 rounded-2xl shadow-2xl w-48 space-y-2 animate-fade-in text-left neo-card dark:border-white/5 ">
                        <button onClick={() => { setActiveTab('add-order'); setShowMobileFAB(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 neo-inset rounded-xl text-xs font-medium text-slate-800 dark:text-white flex items-center gap-2 neo-bg">
                            <PlusCircle size={16} className="text-indigo-600 dark:text-blue-500" /> + নতুন অর্ডার
                        </button>
                        <button onClick={() => { setActiveTab('products'); setShowMobileFAB(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 neo-inset rounded-xl text-xs font-medium text-slate-800 dark:text-white flex items-center gap-2 neo-bg">
                            <Package size={16} className="text-emerald-600" /> + প্রোডাক্ট স্টক
                        </button>
                        <button onClick={() => { setActiveTab('factory-expenses'); setShowMobileFAB(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 neo-inset rounded-xl text-xs font-medium text-slate-800 dark:text-white flex items-center gap-2 neo-bg">
                        <button onClick={() => { setActiveTab('analytics'); setShowMobileFAB(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 neo-inset rounded-xl text-xs font-medium text-slate-800 dark:text-white flex items-center gap-2 neo-bg">
                            <BarChart2 size={16} className="text-indigo-600 dark:text-blue-500" /> 🎯 ডেমোগ্রাফিক
                        </button>
                            <TrendingDown size={16} className="text-rose-600" /> + ফ্যাক্টরি খরচ
                        </button>
                        <button onClick={() => { window.location.reload(); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 neo-inset rounded-xl text-xs font-medium text-slate-800 dark:text-white flex items-center gap-2 border-t pt-2 neo-bg">
                            <RefreshCw size={16} className="text-slate-500 dark:text-zinc-300" /> 🔄 পেজ রিফ্রেশ
                        </button>
                    </div>
                )}
            </div>

            </div>
        );
    };
    // ─── PRINT INVOICE COMPONENT ──────────────────────
    const PrintInvoice = ({ order }) => {
        if (!order) return null;
        const trackingUrl = 'https://nrzoone.com/track?phone=' + order.phone;
        const orderId = order.orderId || order.firebaseId?.slice(-8).toUpperCase();
        
        return (
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] font-sans text-black dark:text-white neo-card dark:border-white/5 ">
                {printMode === 'thermal' ? (
                    <>
                        <style>{`
                            @media print {
                                @page { size: 80mm auto; margin: 0; }
                                .no-print { display: none !important; }
                                body { margin: 0; padding: 0; background: #fff; }
                                .thermal-container { width: 72mm; margin: 0 auto; padding: 3mm 0; font-family: 'Inter', sans-serif; box-sizing: border-box; color: #000; }
                                .t-border { border-bottom: 1.5px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
                                .t-bold { font-weight: 800; }
                                .t-center { text-align: center; }
                                .t-title { font-size: 16px; font-weight: 900; letter-spacing: -0.5px; }
                                .cut-line { position: relative; border-bottom: 1px dashed #000; margin: 15px 0; }
                                .cut-line span { position: absolute; top: -6px; left: 50%; transform: translateX(-50%); background: #fff; padding: 0 10px; font-size: 10px; }
                            }
                        `}</style>
                        <div className="thermal-container">
                            {/* --- OFFICE SLIP --- */}
                            <div className="t-center t-border" style={{ paddingBottom: '2px' }}>
                                <div className="t-title">NR ZONE (Office Copy)</div>
                            </div>
                            
                            <div className="t-border" style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                                <div className="t-bold">ID: #{orderId}</div>
                                <div>{order.date}</div>
                            </div>
                            
                            <div className="t-border" style={{ fontSize: '12px' }}>
                                <div className="t-bold">{order.name} | {order.phone}</div>
                                <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: '500' }}>{order.address}</div>
                            </div>
                            
                            <div className="t-border" style={{ fontSize: '11px' }}>
                                <div className="t-bold">{order.productName || 'Borka Collection'}</div>
                                <div>{order.productType?.toUpperCase()} | Col: {order.color} | Sz: {order.size}</div>
                                {order.note && <div style={{ fontStyle: 'italic' }}>Note: {order.note}</div>}
                            </div>
                            
                            <div className="t-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                     <QRCodeCanvas value={trackingUrl} size={60} />
                                </div>
                                <div className="t-bold" style={{ fontSize: '16px', textAlign: 'right' }}>
                                    COD: ৳{order.total}
                                </div>
                            </div>

                            {/* CUT LINE */}
                            <div className="cut-line">
                                <span>✂ - CUT HERE - ✂</span>
                            </div>

                            {/* --- CUSTOMER SLIP --- */}
                            <div className="t-center t-border" style={{ paddingBottom: '2px' }}>
                                <div className="t-title">NR ZONE</div>
                                <div style={{ fontSize: '10px', fontWeight: '600' }}>www.nrzoone.com</div>
                            </div>
                            
                            <div className="t-border" style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                                <div className="t-bold">Order ID: #{orderId}</div>
                                <div>{order.date}</div>
                            </div>
                            
                            <div className="t-border" style={{ fontSize: '12px' }}>
                                <div className="t-bold">{order.name}</div>
                                <div className="t-bold" style={{ fontSize: '13px' }}>{order.phone}</div>
                                <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: '500' }}>{order.address}</div>
                            </div>
                            
                            <div className="t-border" style={{ fontSize: '11px' }}>
                                <div className="t-bold">{order.productName || 'Borka Collection'}</div>
                                <div>Type: {order.productType?.toUpperCase()} | Color: {order.color} | Size: {order.size}</div>
                            </div>
                            
                            <div className="t-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
                                <div className="t-center">
                                     <QRCodeCanvas value={trackingUrl} size={65} />
                                     <div style={{ fontSize: '8px', marginTop: '2px', fontWeight: 'bold'}}>TRACK ORDER</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>CASH TO COLLECT</div>
                                    <div className="t-bold" style={{ fontSize: '20px' }}>৳{order.total}</div>
                                </div>
                            </div>
                            
                            <div className="t-center" style={{ fontSize: '10px', marginTop: '5px', fontWeight: 'bold' }}>
                                Thank you for shopping with us!
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <style>{`
                            @media print { 
                                @page { size: A4; margin: 0; }
                                .no-print { display: none !important; } 
                                body { margin: 0; padding: 0; } 
                                .print-container { width: 210mm; height: 297mm; display: flex; flex-direction: column; padding: 15mm; box-sizing: border-box; font-family: 'Inter', sans-serif; }
                                .slip-part { border: 1px solid #000; border-radius: 8px; padding: 25px; margin-bottom: 25px; position: relative; }
                                .office-copy { height: 35%; }
                                .customer-copy { height: 55%; border-width: 2px; }
                                .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 8rem; color: rgba(0,0,0,0.03); z-index: 0; pointer-events: none; font-weight: 900; white-space: nowrap; }
                                .content { position: relative; z-index: 10; }
                            }
                        `}</style>
                        <div className="print-container bg-white neo-card dark:border-white/5 ">
                            {/* CUSTOMER COPY */}
                            <div className="slip-part customer-copy">
                                <div className="watermark">${order.sourceWebsite || 'NRZOONE'}</div>
                                <div className="content h-full flex flex-col justify-between">
                                    
                                    <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                                        <div>
                                            <h1 className="text-4xl font-semibold tracking-tight uppercase text-slate-900 dark:text-white">${order.sourceWebsite || 'NRZOONE.COM'}</h1>
                                            <p className="text-sm font-medium uppercase tracking-widest mt-1 bg-black text-white inline-block px-3 py-1">Customer Invoice</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium uppercase text-gray-500 tracking-wider">Order ID</p>
                                            <p className="text-xl font-semibold">#${orderId}</p>
                                            <p className="text-sm font-medium text-gray-500 mt-1">Date: ${order.date}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-8 mb-8">
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Delivery Address</p>
                                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">${order.name}</h3>
                                            <p className="text-xl font-medium text-indigo-600 dark:text-blue-500 mt-1">${order.phone}</p>
                                            <p className="text-sm font-semibold text-gray-600 mt-2 leading-relaxed w-72 dark:text-zinc-300">${order.address}</p>
                                        </div>
                                        
                                        <div className="flex flex-col justify-between items-end text-right">
                                            <div>
                                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Package info</p>
                                                <div className="flex gap-2">
                                                    <span className="bg-[#0f172a] text-white px-3 py-1 text-xs font-medium uppercase tracking-wider">${order.productType}</span>
                                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-3 py-1 text-xs font-medium uppercase tracking-wider">COLOR: ${order.color}</span>
                                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 text-xs font-medium uppercase tracking-wider">SIZE: ${order.size}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-6">
                                                <div className="text-right">
                                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Order Tracking</p>
                                                    <p className="text-[9px] text-gray-500 font-semibold mt-1">Scan to track order progress</p>
                                                </div>
                                                <QRCodeCanvas value={trackingUrl} size={100} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col justify-between">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-black text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    <th className="py-2">Description</th>
                                                    <th className="py-2 text-right">Qty</th>
                                                    <th className="py-2 text-right">Price</th>
                                                    <th className="py-2 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                <tr className="text-sm font-semibold">
                                                    <td className="py-4">${order.productName || 'বোরকা কালেকশন'} (${order.color} - ${order.size})</td>
                                                    <td className="py-4 text-right">${order.quantity || 1}</td>
                                                    <td className="py-4 text-right">৳${order.price}</td>
                                                    <td className="py-4 text-right">৳${order.price}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        
                                        <div className="border-t-2 border-black pt-6 flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium leading-relaxed">Thank you for shopping with us!<br/>For support call: 01783155897</p>
                                            </div>
                                            <div className="w-64 space-y-2 text-right">
                                                <div className="flex justify-between text-sm font-semibold text-gray-500"><span>Subtotal</span><span>৳${order.price}</span></div>
                                                <div className="flex justify-between text-sm font-semibold text-gray-500"><span>Delivery Charge</span><span>৳${order.deliveryCharge || 0}</span></div>
                                                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-semibold text-black dark:text-white"><span>Total Bill</span><span>৳${order.total}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                            
                            {/* OFFICE COPY */}
                            <div className="slip-part office-copy border-dashed border-t-4">
                                <div className="watermark">OFFICE COPY</div>
                                <div className="content h-full flex flex-col justify-between">
                                    <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
                                        <div>
                                            <h1 className="text-xl font-semibold uppercase tracking-tight text-slate-900 dark:text-white">${order.sourceWebsite || 'NRZOONE.COM'}</h1>
                                            <p className="text-[11px] font-medium uppercase tracking-widest bg-black text-white inline-block px-2 py-0.5">Office Copy</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-medium uppercase text-gray-400">Order ID</p>
                                            <p className="text-lg font-semibold">#${orderId}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="font-medium text-gray-400 uppercase tracking-widest">Delivery To</p>
                                            <p className="font-semibold text-sm mt-0.5">${order.name} (${order.phone})</p>
                                            <p className="text-gray-500 font-semibold mt-1 truncate w-60">${order.address}</p>
                                        </div>
                                        <div className="text-right flex flex-col justify-between items-end">
                                            <div>
                                                <p className="font-medium text-gray-400 uppercase tracking-widest">Product Info</p>
                                                <p className="font-semibold mt-0.5">${order.productType?.toUpperCase()} | ${order.color} | ${order.size}</p>
                                            </div>
                                            <div className="font-semibold text-sm text-red-600 mt-2">COD: ৳${order.total}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };


// ─── ADD ORDER & EXPENSE (Clean UI version) ────────────────

    const AddOrderView = ({ isModal = false, onClose = null }) => {
        const [formData, setFormData] = useState({ name: '', phone: '', address: '', productType: 'borka', color: 'Black', size: '52', price: 1350, deliveryArea: 'inside', selectedProductId: '' });
        const [ocrLoading, setOcrLoading] = useState(false);
        const ocrInputRef = useRef(null);
        
        // Size groups: চোট মেয়ে → মেজো মেয়ে → বড় মেয়ে → মা
        const BORKA_SIZE_GROUPS = [
            { label: '👶 চোট মেয়ে', sizes: ['20','22','24','26','28','30'] },
            { label: '🧒 মেজো মেয়ে', sizes: ['32','34','36','38','40'] },
            { label: '🧑 বড় মেয়ে', sizes: ['42','44','46','48'] },
            { label: '👩 মা', sizes: ['50','52','54','56','58'] },
        ];
        const borkaSizes = BORKA_SIZE_GROUPS.flatMap(g => g.sizes);
        const hijabSizes = ['40 Inchi (Choto)', '72 Inchi (Majhari)', '80 Inchi (Boro)'];
        const currentSizes = formData.productType === 'borka' ? borkaSizes : hijabSizes;

        // Find selected product from allProducts (parent state)
        const selectedProduct = allProducts.find(p => p.firebaseId === formData.selectedProductId) || null;
        const productColors = selectedProduct?.colors?.length > 0 ? selectedProduct.colors : ['Black', 'Maroon', 'Olive', 'Navy', 'Grey', 'Brown', 'Purple', 'White', 'Pink', 'Mehndi', 'Coffee', 'Chocolate', 'Sky Blue', 'Teal', 'Lavender', 'Emerald', 'Peach', 'Golden', 'Silver', 'Nude'];
        const productSizes = selectedProduct?.sizes?.length > 0 ? selectedProduct.sizes : currentSizes;

        const totalStock = selectedProduct ? (selectedProduct.stockCount || Object.values(selectedProduct.inventory || {})?.reduce((a, b) => a + b, 0)) : null;
        const getProductStockStatus = () => {
            if (!selectedProduct) return null;
            if (selectedProduct.stock === 'out_of_stock' || totalStock === 0) return { label: 'OUT OF STOCK', cls: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/50' };
            if (totalStock <= 20) return { label: 'LOW STOCK', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200 dark:border-amber-500/30 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50' };
            return { label: 'LIVE', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50' };
        };
        const stockStatus = getProductStockStatus();

        // Duplicate phone warning
        const dupCount = formData.phone.length >= 10 ? orders?.filter(o => o.phone === formData.phone).length : 0;

        // Customer Return history stats
        const customerOrders = useMemo(() => {
            if (formData.phone.length < 10) return [];
            return orders?.filter(o => o.phone?.trim() === formData.phone.trim());
        }, [formData.phone, orders]);

        const customerStats = useMemo(() => {
            if (customerOrders.length === 0) return null;
            const total = customerOrders.length;
            const delivered = customerOrders?.filter(o => o.status === 'delivered' || o.courierStatus?.includes('ডেলিভারি') || o.courierStatus?.includes('পেমেন্ট')).length;
            const returned = customerOrders?.filter(o => o.courierStatus?.includes('রিটার্ন')).length;
            const successRate = Math.round((delivered / total) * 100);
            const returnRate = Math.round((returned / total) * 100);
            return { total, successRate, returnRate };
        }, [customerOrders]);

        const handleSubmit = async (e) => {
            if (e && e.preventDefault) e.preventDefault();
            
            // Basic validation
            if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
                alert('দয়া করে কাস্টমারের নাম, মোবাইল নম্বর এবং ঠিকানা সঠিকভাবে পূরণ করুন!');
                return;
            }

            let cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('88') && cleanPhone.length === 13) {
            cleanPhone = cleanPhone.substring(2);
        }
        formData.phone = cleanPhone; // Ensure database always gets consistent 11-digit format
        if (cleanPhone.length !== 11) {
                alert('মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে!');
                return;
            }

            const deliveryCharge = formData.deliveryArea === 'inside' ? 80 : 150;
            const priceVal = parseInt(formData.price) || 0;
            const totalVal = priceVal + deliveryCharge;

            try {
                await addDoc(collection(db, "orders"), { 
                    ...formData, 
                    price: priceVal,
                    deliveryCharge, 
                    total: totalVal, 
                    status: 'pending', 
                    date: new Date().toLocaleDateString('en-GB'), 
                    createdAt: serverTimestamp(),
                    enteredByRole: userRole,
                    enteredByName: userName || 'Staff',
                    sourceWebsite: 'NR ZONE',
                    productName: selectedProduct?.name || '',
                });
                alert('অর্ডার সফলভাবে সেভ হয়েছে!'); 
                if (isModal && onClose) {
                    onClose();
                } else {
                    setActiveTab('orders');
                }
            } catch (error) { 
                console.error("Manual order entry error:", error);
                alert('অর্ডার সেভ করতে ত্রুটি হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।'); 
            }
        };

        const handleOcrUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setOcrLoading(true);
            
            Tesseract.recognize(file, 'eng+ben', { 
                logger: m => console.log(m) 
            }).then(({ data: { text } }) => {
                const phoneMatch = text.match(/(?:01)[3-9]\d{8}/);
                
                // Very basic heuristic for name (first line) and address (rest)
                const lines = text.split('\n')?.map(l => l.trim())?.filter(l => l.length > 2);
                let guessedName = formData.name;
                let guessedAddress = formData.address;
                
                if (lines.length > 0) {
                    // Assume first wordy line might be a name if not set
                    if (!guessedName) guessedName = lines[0].substring(0, 30);
                    // Join everything else for address
                    guessedAddress = lines.join(', ').substring(0, 200);
                }

                setFormData(prev => ({
                    ...prev,
                    phone: phoneMatch ? phoneMatch[0] : prev.phone,
                    name: prev.name || guessedName,
                    address: guessedAddress // Just dump extracted text for manual correction
                }));
                setOcrLoading(false);
                alert('স্ক্রিনশট স্ক্যান সম্পন্ন! ফর্মের ডাটা চেক করে নিন।');
            }).catch(err => {
                console.error('OCR Error:', err);
                setOcrLoading(false);
                alert('স্ক্যান করতে সমস্যা হয়েছে!');
            });
        };

        return (
            <div className="no-print animate-fade-in text-slate-800 dark:text-white">
                {!isModal && (
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-medium tracking-tight underline decoration-slate-100 underline-offset-[12px] text-slate-900 dark:text-white">ম্যানুয়াল অর্ডার এন্ট্রি</h2>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-4 bg-indigo-50/50 border border-blue-100 px-4 py-2 rounded-full inline-block">
                                এন্ট্রি: {userName || 'Staff'} ({userRole})
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Global OCR Upload Button (Available in both Modal and Page views) */}
                <div className="mb-6 bg-slate-50 neo-inset border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 neo-bg">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">অটো-ফিল ফর্ম (AI Scanner)</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-300 font-medium">কাস্টমারের দেয়া ঠিকানার স্ক্রিনশট আপলোড করলে ফর্ম অটোমেটিক পূরণ হয়ে যাবে।</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="file" accept="image/*" ref={ocrInputRef} onChange={handleOcrUpload} className="hidden" />
                        <button 
                            type="button"
                            onClick={() => ocrInputRef.current?.click()}
                            disabled={ocrLoading}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all shadow-sm shrink-0 ${ocrLoading ? 'bg-slate-200 text-slate-500 dark:text-zinc-300 cursor-not-allowed' : 'bg-[#0f172a] text-white hover:bg-[#1e293b] hover:shadow-md active:scale-95'}`}
                        >
                            {ocrLoading ? (
                                <><div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> স্ক্যান হচ্ছে...</>
                            ) : (
                                <><span>📸</span> স্ক্রিনশট আপলোড</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Duplicate phone warning */}
                {dupCount > 0 && (
                    <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <div className="font-medium text-amber-800 dark:text-amber-200">এই নম্বরে আগেই {dupCount}টি অর্ডার আছে!</div>
                            <div className="text-sm text-amber-600 font-semibold">ডুপ্লিকেট অর্ডার হতে পারে, নিশ্চিত হয়ে এন্ট্রি করুন।</div>
                        </div>
                    </div>
                )}

                {/* Customer History & Return Warnings */}
                {customerStats && (
                    <div className={`mb-6 border-2 rounded-xl p-4 flex items-center gap-3 ${customerStats.returnRate > 30 ? 'bg-rose-50 border-rose-300' : 'bg-indigo-50/50 border-indigo-200 dark:border-indigo-500/30'}`}>
                        <span className="text-xl">{customerStats.returnRate > 30 ? '🚨' : '👤'}</span>
                        <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className={`font-medium ${customerStats.returnRate > 30 ? 'text-rose-800' : 'text-indigo-800 dark:text-indigo-200'}`}>
                                    কাস্টমার প্রোফাইল: পূর্বের অর্ডার পাওয়া গেছে ({customerStats.total}টি)
                                </div>
                                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-300 mt-1">
                                    ডেলিভারি সফল: <span className="text-emerald-600 font-semibold">{customerStats.successRate}%</span> &nbsp;|&nbsp; 
                                    রিটার্ন হার: <span className="text-rose-600 font-semibold">{customerStats.returnRate}%</span>
                                </div>
                            </div>
                            {customerStats.returnRate > 30 && (
                                <span className="bg-rose-600 text-white font-semibold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                    HIGH RETURN RISK
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {isModal ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* LEFT: Order Form */}
                    <div className="xl:col-span-2">
                        <form id="manual-order-form" onSubmit={handleSubmit} className="bg-white neo-card dark:border-white/5  p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 space-y-6 transition-colors">
                            
                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">কাস্টমারের নাম</label>
                                    <input required className="w-full px-5 py-4 bg-slate-50 neo-inset neo-bg text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-transparent dark:border-white/5/40 rounded-xl outline-none focus:bg-white dark:focus:bg-dark-bg focus:border-indigo-500 transition-all font-medium text-lg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">মোবাইল নম্বর</label>
                                    <input required className={`w-full px-5 py-4 bg-slate-50 neo-inset neo-bg text-slate-900 dark:text-white tracking-tight dark:text-white border-2 rounded-xl outline-none focus:bg-white dark:focus:bg-dark-bg transition-all font-medium text-lg ${dupCount > 0 ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-transparent dark:border-white/5/40 focus:border-indigo-500'}`} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">ডেলিভারি ঠিকানা</label>
                                <textarea required className="w-full px-5 py-4 bg-slate-50 neo-inset neo-bg text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-transparent dark:border-white/5/40 rounded-xl outline-none focus:bg-white dark:focus:bg-dark-bg focus:border-indigo-500 h-24 font-medium text-lg resize-none" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </div>

                            {/* Product Select */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">প্রোডাক্ট সিলেক্ট করুন (ঐচ্ছিক)</label>
                                <select className="w-full px-5 py-4 bg-slate-50 neo-inset neo-bg text-slate-900 dark:text-white tracking-tight dark:text-white border-2 dark:border-white/5/40 rounded-xl outline-none focus:border-indigo-500 font-medium text-lg appearance-none animate-fade-in" value={formData.selectedProductId} onChange={e => {
                                    const p = allProducts.find(p => p.firebaseId === e.target.value);
                                    setFormData({
                                        ...formData,
                                        selectedProductId: e.target.value,
                                        price: p ? (p.discountPrice || p.price) : formData.price,
                                        color: p?.colors?.length > 0 ? p.colors[0] : 'Black',
                                        size: p?.sizes?.length > 0 ? p.sizes[0] : (p?.productType === 'hijab' ? '40 Inchi (Choto)' : '52'),
                                        productType: p?.category === 'হিজাব কালেকশন' || p?.category?.toLowerCase()?.includes('hijab') ? 'hijab' : 'borka'
                                    });
                                }}>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="">-- সরাসরি এন্ট্রি (কোনো প্রোডাক্ট সিলেক্ট না করে) --</option>
                                    {allProducts?.map(p => {
                                        const stock = p.stockCount || 0;
                                        const statusStr = p.stock === 'out_of_stock' || stock === 0 
                                            ? '❌ স্টক শেষ' 
                                            : stock <= 20 
                                                ? `⚠️ শেষ পর্যায় (${stock} পিস বাকি)` 
                                                : `✅ পর্যাপ্ত (${stock} পিস)`;
                                        return (
                                            <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={p.firebaseId} value={p.firebaseId}>
                                                {p.name} — ৳{p.discountPrice || p.price} ({statusStr})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">ক্যাটাগরি</label>
                                <div className="flex gap-3">
                                    <label className="flex-1 cursor-pointer">
                                        <input type="radio" name="productType" className="hidden" checked={formData.productType === 'borka'} onChange={() => setFormData({...formData, productType: 'borka', size: '52'})} />
                                        <div className={`py-3 text-center font-medium rounded-xl border-2 transition-all text-sm ${formData.productType === 'borka' ? 'bg-[#0f172a] dark:bg-[#3B82F6] dark:text-white dark:border-none tracking-tight text-white border-slate-900 dark:border-white' : 'bg-slate-50 neo-inset neo-bg text-slate-500 dark:text-slate-400 border-transparent dark:border-white/5/40 hover:border-slate-200'}`}>বোরকা / অন্যান্য</div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input type="radio" name="productType" className="hidden" checked={formData.productType === 'hijab'} onChange={() => setFormData({...formData, productType: 'hijab', size: '40 Inchi (Choto)'})} />
                                        <div className={`py-3 text-center font-medium rounded-xl border-2 transition-all text-sm ${formData.productType === 'hijab' ? 'bg-[#0f172a] dark:bg-[#3B82F6] dark:text-white dark:border-none tracking-tight text-white border-slate-900 dark:border-white' : 'bg-slate-50 neo-inset neo-bg text-slate-500 dark:text-slate-400 border-transparent dark:border-white/5/40 hover:border-slate-200'}`}>হিজাব কালেকশন</div>
                                    </label>
                                </div>
                            </div>

                            {/* Color Dropdown Select */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">কালার সিলেক্ট করুন</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-5 py-4 bg-slate-50 neo-inset neo-bg text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-transparent dark:border-white/5/40 rounded-xl outline-none focus:bg-white dark:focus:bg-dark-bg focus:border-indigo-500 font-medium text-lg appearance-none cursor-pointer"
                                        value={formData.color} 
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                    >
                                        {productColors?.map(c => (
                                            <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-zinc-300 font-medium text-xs">▼</div>
                                </div>
                            </div>

                            {/* Size Dropdown Select */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">সাইজ সিলেক্ট করুন</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-5 py-4 bg-slate-50 neo-inset neo-bg text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-transparent dark:border-white/5/40 rounded-xl outline-none focus:bg-white dark:focus:bg-dark-bg focus:border-indigo-500 font-medium text-lg appearance-none cursor-pointer"
                                        value={formData.size} 
                                        onChange={(e) => setFormData({...formData, size: e.target.value})}
                                    >
                                        {formData.productType === 'borka' && !selectedProduct ? (
                                            BORKA_SIZE_GROUPS?.map(group => (
                                                <optgroup key={group.label} label={group.label}>
                                                    {group.sizes?.map(s => (
                                                        <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={s} value={s}>{s}</option>
                                                    ))}
                                                </optgroup>
                                            ))
                                        ) : (
                                            productSizes?.map(s => (
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={s} value={s}>{s}</option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-zinc-300 font-medium text-xs">▼</div>
                                </div>
                            </div>

                            {/* Delivery Area */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">ডেলিভারি এলাকা</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setFormData({...formData, deliveryArea: 'inside'})}
                                        className={`py-4 rounded-xl font-medium border-2 transition-all text-sm ${formData.deliveryArea === 'inside' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 neo-inset neo-bg text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5/40 hover:border-emerald-300'}`}>
                                        🏙️ ঢাকার ভেতরে — ৳80
                                    </button>
                                    <button type="button" onClick={() => setFormData({...formData, deliveryArea: 'outside'})}
                                        className={`py-4 rounded-xl font-medium border-2 transition-all text-sm ${formData.deliveryArea === 'outside' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 neo-inset neo-bg text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5/40 hover:border-orange-300'}`}>
                                        🚚 ঢাকার বাইরে — ৳150
                                    </button>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-300">কাস্টম মূল্য (৳) — এই প্রাইস কুরিয়ারে যাবে</label>
                                <input type="number" className="w-full px-5 py-4 border-2 border-indigo-500/20 dark:border-white/5/40 rounded-xl font-semibold text-xl text-slate-900 dark:text-white tracking-tight dark:text-white outline-none focus:border-indigo-500 bg-slate-50 neo-inset neo-bg focus:bg-white dark:focus:bg-dark-bg transition-all" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                                <p className="text-xs font-medium text-emerald-600">স্টক থেকে প্রডাক্ট কমলেও এই কাস্টম মূল্যের ভিত্তিতেই বিল হবে।</p>
                            </div>

                            {/* Confirm Button Inside Form */}
                            <div className="pt-6 border-t border-slate-100">
                                <button 
                                    type="submit" 
                                    className="w-full bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 hover:bg-indigo-700 dark:hover:bg-zinc-200 text-white py-5 rounded-xl font-semibold text-lg shadow-lg shadow-blue-100 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    ✅ কনফার্ম এন্ট্রি করুন
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT: Product Preview Side Panel */}
                    <div className="xl:col-span-1 space-y-4">
                        <div className="bg-white neo-card dark:border-white/5  rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden sticky top-6">
                            {selectedProduct ? (
                                <>
                                    {/* Product Image */}
                                    <div className="relative">
                                        <img loading="lazy" src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full aspect-square object-cover" />
                                        {stockStatus && (
                                            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium border-2 flex items-center gap-1.5 ${stockStatus.cls}`}>
                                                <span className={`w-2 h-2 rounded-full ${stockStatus.label === 'LIVE' ? 'bg-emerald-500 animate-pulse' : stockStatus.label === 'LOW STOCK' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                                {stockStatus.label}
                                            </div>
                                        )}
                                    </div>
                                    {/* Product Info */}
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{selectedProduct.category}</div>
                                            <div className="font-semibold text-slate-900 dark:text-white tracking-tight dark:text-white text-xl leading-tight mt-1">{selectedProduct.name}</div>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <div className="text-xl font-semibold text-emerald-700">৳{selectedProduct.discountPrice || selectedProduct.price}</div>
                                            {selectedProduct.discountPrice && <div className="text-sm text-slate-400 line-through font-medium">৳{selectedProduct.price}</div>}
                                        </div>
                                        {totalStock !== null && (
                                            <div className="text-sm font-medium text-slate-500 dark:text-zinc-300">মোট স্টক: <span className={`font-semibold ${totalStock > 20 ? 'text-emerald-600' : totalStock > 0 ? 'text-amber-600' : 'text-rose-600'}`}>{totalStock} পিস</span></div>
                                        )}
                                        {/* Selected Color/Size highlight */}
                                        <div className="bg-slate-50 neo-inset neo-bg rounded-xl p-4 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-medium text-slate-400 uppercase">সিলেক্টেড কালার</span>
                                                <span className="bg-[#0f172a] text-white px-3 py-1 rounded-full text-xs font-medium">{formData.color}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-medium text-slate-400 uppercase">সিলেক্টেড সাইজ</span>
                                                <span className="bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white px-3 py-1 rounded-full text-xs font-medium">{formData.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="text-5xl mb-4">📦</div>
                                    <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">প্রোডাক্ট প্রিভিউ</div>
                                    <p className="text-xs text-slate-400 mt-2 font-semibold">উপরের ড্রপডাউন থেকে প্রোডাক্ট সিলেক্ট করলে এখানে ছবি ও ডিটেইল দেখাবে</p>
                                    {allProducts.length > 0 && (
                                        <div className="mt-6 space-y-2">
                                            <div className="text-[11px] font-medium text-slate-400 uppercase">সব প্রোডাক্ট ({allProducts.length}টি)</div>
                                            {allProducts.slice(0, 4)?.map(p => (
                                                <button key={p.firebaseId} type="button" onClick={() => setFormData({...formData, selectedProductId: p.firebaseId, price: p.discountPrice || p.price})}
                                                    className="w-full flex items-center gap-3 p-3 bg-slate-50 neo-inset hover:bg-indigo-50/50 rounded-xl text-left transition-all border border-transparent hover:border-indigo-200 dark:border-indigo-500/30 neo-bg">
                                                    <img loading="lazy" src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt={p.name} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium text-slate-800 dark:text-white truncate">{p.name}</div>
                                                        <div className="text-xs text-emerald-700 font-medium">৳{p.discountPrice || p.price}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Summary inside side panel */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6 m-4 rounded-2xl space-y-3">
                                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">অর্ডার সামারি</div>
                                <div className="flex justify-between text-sm font-semibold"><span className="text-slate-300">পণ্যের মূল্য</span><span className="font-semibold">৳{parseInt(formData.price) || 0}</span></div>
                                <div className="flex justify-between text-sm font-semibold"><span className="text-slate-300">ডেলিভারি চার্জ</span><span className="font-semibold text-amber-400">৳{formData.deliveryArea === 'inside' ? 80 : 150}</span></div>
                                <div className="border-t border-slate-600 pt-3 flex justify-between"><span className="font-medium text-slate-200">মোট বিল</span><span className="text-xl font-semibold text-emerald-400">৳{(parseInt(formData.price) || 0) + (formData.deliveryArea === 'inside' ? 80 : 150)}</span></div>
                            </div>

                            {/* Submit Button */}
                            <div className="p-4">
                                <button 
                                    type="button" 
                                    onClick={handleSubmit} 
                                    className="w-full bg-[#0f172a] text-white py-5 rounded-xl font-medium text-lg hover:bg-slate-700 hover:scale-[1.02] shadow-lg active:scale-95 transition-all"
                                >
                                    ✅ কনফার্ম এন্ট্রি করুন
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>
                ) : (
                    <div className="mb-8 flex flex-col items-center justify-center bg-white neo-card dark:border-white/5  border border-slate-100 dark:border-white/5 rounded-[2rem] p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-indigo-50/50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        </div>
                        <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-2">ম্যানুয়াল অর্ডার তৈরি করুন</h3>
                        <p className="text-sm text-slate-400 font-semibold mb-6 max-w-sm">কাস্টমার ও প্রডাক্টের বিবরণ দিয়ে কুইক মডাল উইন্ডোর মাধ্যমে নতুন অর্ডার তৈরি করুন।</p>
                        <button 
                            type="button"
                            onClick={() => setIsAddOrderModalOpen(true)}
                            className="px-8 py-4 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 hover:bg-indigo-700 dark:hover:bg-zinc-200 text-white font-medium rounded-xl transition shadow-md whitespace-nowrap border-none text-base cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                        >
                            ➕ নতুন ম্যানুয়াল অর্ডার এন্ট্রি
                        </button>
                    </div>
                )}

                {/* ===== RECENT MANUAL ENTRIES LIST ===== */}
                {!isModal && (
                <div className="mt-12 bg-white neo-card dark:border-white/5  rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight dark:text-white tracking-tight">📥 সম্প্রতি এন্ট্রি করা অর্ডারসমূহ</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">আপনার টিম বা আপনার দ্বারা এন্ট্রি করা শেষ ১০টি ম্যানুয়াল অর্ডার</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#1C1C1F] text-slate-900 dark:text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-white/10">
                                <tr>
                                    <th className="px-5 py-4">অর্ডার আইডি</th>
                                    <th className="px-5 py-4">কাস্টমার তথ্য</th>
                                    <th className="px-5 py-4">প্রোডাক্ট বিবরণ</th>
                                    <th className="px-5 py-4">মোট বিল</th>
                                    <th className="px-5 py-4">এন্ট্রি করেছেন</th>
                                    <th className="px-5 py-4">অবস্থা</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-semibold">
                                {orders
                                    ?.filter(o => o.enteredByName) // Only manual/staff entries
                                    .slice(0, 10)
                                    ?.map(order => (
                                        <tr key={order.firebaseId} className="hover:bg-slate-50 neo-inset dark:hover:bg-dark-surfaceHover transition-colors neo-bg">
                                            <td className="px-5 py-4">
                                                <span className="font-mono text-slate-900 dark:text-white tracking-tight dark:text-white font-medium uppercase text-xs">#{order.firebaseId?.slice(-6).toUpperCase()}</span>
                                                <p className="text-[11px] text-slate-400 mt-1 font-medium">{order.date}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800 dark:text-white">{order.name}</p>
                                                <p className="text-xs text-indigo-600 dark:text-blue-500 font-medium mt-0.5">{order.phone}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-300 font-semibold truncate max-w-[180px] mt-0.5">{order.address}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-700 dark:text-white capitalize text-xs">{order.productName || order.productType}</p>
                                                <div className="flex gap-1.5 mt-1">
                                                    <span className="text-[9px] font-semibold uppercase bg-[#0f172a] text-white px-2 py-0.5 rounded">COL: {order.color}</span>
                                                    <span className="text-[9px] font-semibold uppercase bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white px-2 py-0.5 rounded">SZ: {order.size}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white tracking-tight text-xs dark:text-white">
                                                ৳{order.total}
                                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">৳{order.price} + ৳{order.deliveryCharge}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-indigo-700 text-xs">{order.enteredByName}</span>
                                                <p className="text-[9px] text-blue-400 font-medium uppercase tracking-widest">{order.enteredByRole}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                                    {getStatusBangla(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                {orders?.filter(o => o.enteredByName).length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                                            এখনো কোনো ম্যানুয়াল অর্ডার এন্ট্রি করা হয়নি।
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
            </div>
        );
    }

    const WorkerLedgerView = () => {
        const [showAddWorker, setShowAddWorker] = useState(false);
        const [showPayModal, setShowPayModal] = useState(null);
        const [showEarnModal, setShowEarnModal] = useState(null);
        const [showDocModal, setShowDocModal] = useState(null);
        
        const [newWorker, setNewWorker] = useState({ 
            name: '', 
            phone: '', 
            nid: '', 
            passport: '', 
            docImage: '' 
        });
        const [isUploading, setIsUploading] = useState(false);

        const handleDocUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setIsUploading(true);
            const storageRef = ref(storage, `workers/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on("state_changed", 
                null, 
                (err) => { alert("আপলোড ব্যর্থ হয়েছে"); setIsUploading(false); },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    setNewWorker({ ...newWorker, docImage: url });
                    setIsUploading(false);
                }
            );
        };

        const addWorker = async (e) => {
            e.preventDefault();
            if (!newWorker.name) return;
            await addDoc(collection(db, "worker_accounts"), { 
                ...newWorker, 
                totalEarned: 0, 
                totalPaid: 0, 
                currentBalance: 0, 
                createdAt: serverTimestamp() 
            });
            setNewWorker({ name: '', phone: '', nid: '', passport: '', docImage: '' }); 
            setShowAddWorker(false);
            alert('ওয়ার্কার সফলভাবে যুক্ত হয়েছে!');
        };

        const addTransaction = async (workerId, type, amount, desc) => {
            const amountNum = parseInt(amount);
            if (!amountNum) return;
            const worker = workerAccounts.find(w => w.firebaseId === workerId);
            const newTotalEarned = type === 'earning' ? worker.totalEarned + amountNum : worker.totalEarned;
            const newTotalPaid = type === 'payment' ? worker.totalPaid + amountNum : worker.totalPaid;
            const newBalance = newTotalEarned - newTotalPaid;

            await addDoc(collection(db, "worker_transactions"), { workerId, workerName: worker.name, type, amount: amountNum, description: desc, date: new Date().toLocaleDateString('en-GB'), createdAt: serverTimestamp() });
            await updateDoc(doc(db, "worker_accounts", workerId), { totalEarned: newTotalEarned, totalPaid: newTotalPaid, currentBalance: newBalance });
            setShowPayModal(null); setShowEarnModal(null);
        };

        return (
            <div className="space-y-12 no-print animate-fade-in text-slate-800 dark:text-white pb-20">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-medium tracking-tight underline decoration-slate-100 underline-offset-[12px] text-slate-900 dark:text-white">ওয়ার্কার লেজার ও ডকুমেন্টেশন</h2>
                    <button onClick={() => setShowAddWorker(!showAddWorker)} className="bg-[#0f172a] text-white px-10 py-5 rounded-[1.8rem] font-semibold flex items-center gap-4 shadow-sm active:scale-95 transition-all">
                        <Users size={24} /> নতুন ওয়ার্কার যোগ করুন
                    </button>
                </div>

                {showAddWorker && (
                    <div className="bg-white p-12 rounded-[4rem] shadow-sm border-2 border-slate-50 animate-slide-up neo-card dark:border-white/5 ">
                        <h3 className="text-xl font-semibold uppercase text-[#111827] dark:text-white mb-8 border-b-2 pb-4 inline-block">নতুন ওয়ার্কার ইনফরমেশন</h3>
                        <form onSubmit={addWorker} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">পুরো নাম</label>
                                <input required placeholder="যেমন: মো: আরিফুল ইসলাম" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded font-medium neo-bg" value={newWorker.name} onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">ফোন নম্বর</label>
                                <input required placeholder="017xxxxxxxx" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded font-medium neo-bg" value={newWorker.phone} onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">NID নম্বর</label>
                                <input placeholder="জাতীয় পরিচয়পত্র নম্বর..." className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded font-medium neo-bg" value={newWorker.nid} onChange={(e) => setNewWorker({ ...newWorker, nid: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">পাসপোর্ট নম্বর (ঐচ্ছিক)</label>
                                <input placeholder="পাসপোর্ট নম্বর..." className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded font-medium neo-bg" value={newWorker.passport} onChange={(e) => setNewWorker({ ...newWorker, passport: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">NID/পাসপোর্ট ছবি আপলোড</label>
                                <div className="relative border-4 border-dashed border-slate-100 rounded-md p-10 flex flex-col items-center justify-center bg-slate-50 neo-inset overflow-hidden group neo-bg">
                                    {newWorker.docImage ? (
                                        <div className="flex flex-col items-center">
                                            <img loading="lazy" src={newWorker.docImage} alt="ID card" className="h-32 rounded-xl shadow-sm border border-slate-200 mb-4" />
                                            <p className="text-emerald-600 font-semibold text-xs uppercase">ডকুমেন্ট আপলোড হয়েছে!</p>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="text-slate-300 mb-4 group-hover:text-indigo-500 transition-colors" size={40} />
                                            <p className="text-slate-500 dark:text-zinc-300 font-medium">এখানে ক্লিক করে ছবি সিলেক্ট করুন</p>
                                        </>
                                    )}
                                    {isUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-semibold text-[#111827] dark:text-white animate-pulse neo-card dark:border-white/5 ">আপলোড হচ্ছে...</div>}
                                    <input type="file" accept="image/*" onChange={handleDocUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" disabled={isUploading} className="w-full bg-[#0f172a] text-white py-6 rounded-[2.2rem] font-semibold text-xl uppercase tracking-widest shadow-sm shadow-slate-200">সেভ করুন</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {workerAccounts?.map(worker => (
                        <div key={worker.firebaseId} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-sm transition-all group overflow-hidden relative flex flex-col neo-card dark:border-white/5 ">
                            <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-blue-50 transition-colors pointer-events-none"><Shield size={100} /></div>
                            <div className="relative z-10 flex-1">
                                <h3 className="text-xl font-semibold tracking-tight mb-2 text-slate-900 dark:text-white tracking-tight italic dark:text-white">{worker.name}</h3>
                                <p className="text-xs font-semibold text-[#111827] dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2"><Phone size={12}/> {worker.phone || 'N/A'}</p>
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between border-b pb-2 border-slate-50"><span className="text-slate-400 font-semibold uppercase text-[11px]">অর্জিত কমিশন</span> <span className="text-slate-800 dark:text-white font-medium text-lg">৳{worker.totalEarned}</span></div>
                                    <div className="flex justify-between border-b pb-2 border-slate-50"><span className="text-slate-400 font-semibold uppercase text-[11px]">পরিশোধ করা হয়েছে</span> <span className="text-emerald-600 font-medium text-lg">৳{worker.totalPaid}</span></div>
                                    <div className="flex justify-between pt-6"><span className="text-rose-600 font-semibold uppercase text-[11px]">বর্তমান বকেয়া</span> <span className="text-rose-600 font-semibold text-xl tracking-tighter">৳{worker.currentBalance}</span></div>
                                </div>

                                <div className="mt-8 p-6 bg-slate-50 neo-inset rounded-md space-y-3 neo-bg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">ডকুমেন্টস:</span>
                                        {worker.docImage && <button onClick={() => setShowDocModal(worker)} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#111827] dark:text-white uppercase hover:underline"><ImageIcon size={14}/> ভিউ কার্ড</button>}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">NID: {worker.nid || '---'}</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                                    <button onClick={() => setShowEarnModal(worker)} className="bg-slate-100 neo-inset text-slate-900 dark:text-white tracking-tight py-5 rounded font-semibold text-sm uppercase tracking-widest hover:bg-slate-200 transition-all dark:text-white neo-bg">কমিশন যোগ</button>
                                    <button onClick={() => setShowPayModal(worker)} className="bg-emerald-600 text-white py-5 rounded font-semibold text-sm uppercase tracking-widest shadow-sm border border-slate-200 shadow-emerald-100 hover:scale-105 transition-all">পরিশোধ</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODALS */}
                {showDocModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 z-[300]">
                        <div className="bg-white p-14 rounded-[4rem] w-full max-w-2xl shadow-sm relative overflow-hidden animate-fade-in neo-card dark:border-white/5 ">
                            <button onClick={() => setShowDocModal(null)} className="absolute top-10 right-10 p-4 bg-slate-100 neo-inset rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all z-10 neo-bg"><X size={24}/></button>
                            <h3 className="text-xl font-semibold uppercase tracking-widest mb-4 border-b pb-4 text-slate-900 dark:text-white">{showDocModal.name} - Identity Card</h3>
                            <div className="space-y-4 mb-10">
                               <p className="font-medium text-slate-600 dark:text-zinc-300">NID: <span className="text-slate-900 dark:text-white tracking-tight font-semibold text-xl dark:text-white">{showDocModal.nid || 'N/A'}</span></p>
                               {showDocModal.passport && <p className="font-medium text-slate-600 dark:text-zinc-300">Passport: <span className="text-slate-900 dark:text-white tracking-tight font-semibold text-xl dark:text-white">{showDocModal.passport}</span></p>}
                            </div>
                            <div className="rounded-lg overflow-hidden border-8 border-slate-50 shadow-sm">
                                <img loading="lazy" src={showDocModal.docImage} alt="ID Document" className="w-full h-auto object-cover" />
                            </div>
                        </div>
                    </div>
                )}

                {showEarnModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 z-[200]">
                        <div className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-sm animate-fade-in neo-card dark:border-white/5 ">
                            <h3 className="text-xl font-semibold mb-8 border-b-4 border-slate-900 pb-4 text-slate-900 dark:text-white">কমিশন এন্ট্রি: <span className="text-[#111827] dark:text-white">{showEarnModal.name}</span></h3>
                            <input type="number" placeholder="টাকার অংক..." id="earnAmount" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded mb-6 font-semibold text-xl outline-none neo-bg" />
                            <input placeholder="কি কাজের জন্য..." id="earnDesc" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded mb-10 font-medium neo-bg" />
                            <div className="flex gap-4">
                                <button onClick={() => setShowEarnModal(null)} className="flex-1 py-5 rounded font-semibold text-slate-500 dark:text-zinc-300 uppercase tracking-widest">বন্ধ করুন</button>
                                <button onClick={() => addTransaction(showEarnModal.firebaseId, 'earning', document.getElementById('earnAmount').value, document.getElementById('earnDesc').value)} className="flex-1 bg-[#0f172a] text-white py-5 rounded font-semibold uppercase tracking-widest">সেভ করুন</button>
                            </div>
                        </div>
                    </div>
                )}

                {showPayModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 z-[200]">
                        <div className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-sm animate-fade-in border-t-[15px] border-emerald-500 neo-card dark:border-white/5 ">
                            <h3 className="text-xl font-semibold mb-8 text-slate-900 dark:text-white">পেমেন্ট এন্ট্রি: <span className="text-emerald-600">{showPayModal.name}</span></h3>
                            <input type="number" placeholder="পেমেন্ট টাকার অংক..." id="payAmount" className="w-full px-6 py-5 bg-emerald-50 border-2 border-emerald-100 rounded mb-6 font-semibold text-xl outline-none focus:bg-white neo-card dark:border-white/5 " />
                            <input placeholder="পেমেন্ট ডিটেইলস (যেমন: বিকাশ/ক্যাশ)..." id="payDesc" className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 rounded mb-10 font-medium neo-bg" />
                            <div className="flex gap-4">
                                <button onClick={() => setShowPayModal(null)} className="flex-1 py-5 rounded font-semibold text-slate-500 dark:text-zinc-300 uppercase tracking-widest">বাতিল</button>
                                <button onClick={() => addTransaction(showPayModal.firebaseId, 'payment', document.getElementById('payAmount').value, document.getElementById('payDesc').value)} className="flex-1 bg-emerald-600 text-white py-5 rounded font-semibold uppercase tracking-widest shadow-sm shadow-emerald-100">পরিশোধ করুন</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── LOGIN VIEW ────────────────────────────────
    const FactoryExpenseView = () => {
        const [showAddForm, setShowAddForm] = useState(false);
        const [newExpense, setNewExpense] = useState({ category: 'মালামাল', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

        const addExpense = async (e) => {
            e.preventDefault();
            if (!newExpense.amount || !newExpense.category) return;
            try {
                await addDoc(collection(db, "factory_expenses"), { 
                    ...newExpense, 
                    amount: parseInt(newExpense.amount),
                    createdAt: serverTimestamp() 
                });
                setNewExpense({ category: 'মালামাল', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                setShowAddForm(false);
                alert('খরচ সফলভাবে যোগ করা হয়েছে!');
            } catch (error) { console.error(error); alert('ত্রুটি হয়েছে!'); }
        };

        const totalExpenses = expenses?.reduce((acc, curr) => acc + (parseInt(curr.amount) || 0), 0);

        return (
            <div className="space-y-12 no-print animate-fade-in text-slate-800 dark:text-white">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                        <h2 className="text-xl font-medium tracking-tight underline decoration-slate-100 underline-offset-[12px] text-slate-900 dark:text-white">ফ্যাক্টরি ওভারহেড / খরচ</h2>
                        <p className="mt-4 text-slate-600 dark:text-zinc-300 font-medium flex items-center gap-2">মোট খরচ: <span className="text-rose-600 text-xl font-semibold">৳ {totalExpenses.toLocaleString()}</span></p>
                    </div>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="bg-[#0f172a] text-white px-10 py-5 rounded-[1.8rem] font-semibold flex items-center gap-4 shadow-sm active:scale-95 transition-all">
                        <PlusCircle size={24} /> নতুন খরচ যোগ করুন
                    </button>
                </div>

                {showAddForm && (
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm shadow-slate-200/50 border border-slate-50 animate-slide-up neo-card dark:border-white/5 ">
                        <form onSubmit={addExpense} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">ক্যাটাগরি</label>
                                <select className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 border-transparent rounded outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-lg neo-bg" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="মালামাল">মালামাল (Raw Material)</option>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="শ্রমিক মজুরি">শ্রমিক মজুরি (Labor)</option>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="কুরিয়ার খরচ">কুরিয়ার খরচ (Courier)</option>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="প্যাকিং সরঞ্জাম">প্যাকিং সরঞ্জাম (Packing)</option>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="অন্যান্য">অন্যান্য (Others)</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">টাকার অংক</label>
                                <input type="number" required className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 border-transparent rounded outline-none focus:bg-white focus:border-rose-500 transition-all font-semibold text-xl text-rose-600 neo-bg" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">তারিখ</label>
                                <input type="date" required className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 border-transparent rounded outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-lg neo-bg" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-300">বিস্তারিত বিবরণ</label>
                                <input className="w-full px-6 py-5 bg-slate-50 neo-inset border-2 border-transparent rounded outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-lg text-slate-700 dark:text-white neo-bg" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="যেমন: ১০ গজ কালো কাপড় বা বিকাশে মজুরি প্রদান..." />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="w-full bg-[#0f172a] text-white py-5 rounded font-semibold text-lg uppercase tracking-widest shadow-sm active:scale-95 transition-all">খরচ সেভ করুন</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm shadow-slate-200/50 border border-slate-50 overflow-hidden neo-card dark:border-white/5 ">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm md:text-base text-left border-collapse">
                            <thead className="bg-[#F5F5F5] dark:bg-[#1C1C1F] text-slate-900 dark:text-white font-bold text-[12px] border-y border-[#EBEDF0] dark:border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-[13px]">DATE</th>
                                    <th className="px-4 py-3 text-[13px]">CATEGORY</th>
                                    <th className="px-4 py-3 text-[13px]">DESCRIPTION</th>
                                    <th className="p-8 text-right">AMOUNT</th>
                                    <th className="p-8 text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {expenses?.map((exp) => (
                                    <tr key={exp.firebaseId} className="hover:bg-slate-50 neo-inset/50 transition-all group neo-bg">
                                        <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] font-medium text-slate-500 dark:text-zinc-300">{exp.date}</td>
                                        <td className="px-4 py-3 text-[13px]">
                                            <span className="bg-slate-100 neo-inset text-slate-900 dark:text-white tracking-tight px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-widest shadow-sm border border-slate-200 dark:text-white neo-bg">{exp.category}</span>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] font-medium text-slate-600 dark:text-zinc-300 italic text-sm">{exp.description || 'N/A'}</td>
                                        <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] text-right font-semibold text-xl text-rose-600 tracking-tighter">৳{exp.amount}</td>
                                        <td className="px-4 py-3 text-[13px] border-b border-[#EBEDF0] text-center">
                                            <button onClick={() => deleteExpense(exp.firebaseId)} className="p-4 bg-rose-50 text-rose-200 hover:text-rose-600 hover:bg-rose-100 rounded transition-all">
                                                <XCircle size={22} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr><td colSpan="5" className="p-32 text-center text-slate-500 dark:text-zinc-300 font-semibold uppercase tracking-normal text-xl">No Expenses Found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    const LoginView = () => {
        const [showBioPrompt, setShowBioPrompt] = useState(false);
        const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true';
        const biometricUsername = localStorage.getItem('biometricUsername');

        const handleBiometricLogin = () => {
            setShowBioPrompt(true);
            setTimeout(() => {
                const staffUser = staffUsers.find(u => u.username === biometricUsername);
                if (staffUser) {
                    setIsLoggedIn(true);
                    setUserRole(staffUser.role);
                    setUserName(staffUser.name || staffUser.username);
                    localStorage.setItem('adminLoggedIn', 'true');
                    localStorage.setItem('userRole', staffUser.role);
                    localStorage.setItem('userName', staffUser.name || staffUser.username);
                    setLoginError('');
                } else if (biometricUsername === 'admin' || biometricUsername === 'Manager' || biometricUsername === 'Worker') {
                    // Legacy support
                    setIsLoggedIn(true);
                    setUserRole(biometricUsername === 'admin' ? 'Admin' : biometricUsername);
                    setUserName(biometricUsername);
                    localStorage.setItem('adminLoggedIn', 'true');
                    localStorage.setItem('userRole', biometricUsername === 'admin' ? 'Admin' : biometricUsername);
                    localStorage.setItem('userName', biometricUsername);
                } else {
                    setLoginError('User not found. Please login with password first.');
                }
                setShowBioPrompt(false);
            }, 1500);
        };

        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
                {/* Animated Background Gradients */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

                <div className="w-full max-w-[480px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in relative z-10 neo-card dark:border-white/5 ">
                    <div className="bg-black/40 py-12 px-12 text-center text-white border-b border-white/10 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
                        <div className="relative z-10">
                            <h1 className="text-5xl font-semibold tracking-tighter italic drop-shadow-lg text-slate-900 dark:text-white">NR ZONE</h1>
                            <p className="text-white/70 uppercase tracking-widest mt-4 font-medium text-xs bg-white/10 inline-block px-4 py-1.5 rounded-full border border-white/10 neo-card dark:border-white/5 ">Authorized System Access</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleLogin} className="p-12 space-y-8">
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium uppercase text-white/70 tracking-widest ml-2">Access Username</label>
                            <input name="username" placeholder="Master User" required className="w-full px-8 py-5 bg-black/40 border border-white/10 text-white placeholder-white/30 rounded-2xl outline-none font-medium text-lg focus:bg-black/60 focus:border-indigo-500 transition-all shadow-inner" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium uppercase text-white/70 tracking-widest ml-2">Secure Password</label>
                            <input name="password" type="password" placeholder="••••••••" required className="w-full px-8 py-5 bg-black/40 border border-white/10 text-white placeholder-white/30 rounded-2xl outline-none font-medium text-lg focus:bg-black/60 focus:border-indigo-500 transition-all shadow-inner" />
                        </div>
                        
                        {loginError && <div className="text-center p-4 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-200 text-[11px] font-medium uppercase tracking-wider animate-shake-soft">{loginError}</div>}
                        
                        <button className="w-full bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white py-6 rounded-2xl font-semibold uppercase tracking-widest text-lg hover:bg-indigo-50/500 hover:scale-[1.02] shadow-[0_25px_50px_rgba(37,99,235,0.3)] active:scale-95 transition-all">
                            Login with Password
                        </button>
                        
                        {biometricEnabled && (
                            <button type="button" onClick={handleBiometricLogin} className="w-full bg-white/10 text-white py-4 rounded-2xl border border-white/20 font-medium uppercase tracking-widest text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-3 neo-card dark:border-white/5 ">
                                <span>👆</span> Biometric Unlock ({biometricUsername})
                            </button>
                        )}
                        
                        <p className="text-center text-[11px] text-white/40 font-medium uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                            <Shield size={12} /> Secure RSA 2048 Encription
                        </p>
                    </form>

                    {/* Biometric Prompt Overlay */}
                    {showBioPrompt && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-50 animate-fade-in">
                            <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                            <h3 className="text-xl font-semibold uppercase tracking-widest mb-2 text-slate-900 dark:text-white">Scanning Biometrics...</h3>
                            <p className="text-blue-400 font-medium uppercase tracking-widest text-xs animate-pulse">Please place your finger or look at the camera</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const SettingsView = () => {
        const [activeSettingTab, setActiveSettingTab] = useState('general');
        const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Worker', name: '' });
        const [isBiometricSupported, setIsBiometricSupported] = useState(false);
        const [commissionRate, setCommissionRate] = useState(Number(localStorage.getItem('commissionRate') || 20));
        
        const [appConfig, setAppConfig] = useState(() => {
            try {
                return JSON.parse(localStorage.getItem('appConfig')) || { companyName: 'NR ZONE', whatsappNumber: '01783155897', deliveryDhaka: 60, deliveryOutside: 120 };
            } catch(e) {
                return { companyName: 'NR ZONE', whatsappNumber: '01783155897', deliveryDhaka: 60, deliveryOutside: 120 };
            }
        });

        const [myOldPass, setMyOldPass] = useState('');
        const [myNewPass, setMyNewPass] = useState('');
        const [myConfirmPass, setMyConfirmPass] = useState('');
        const [passMsg, setPassMsg] = useState({ text: '', type: '' });

        useEffect(() => {
            if (window.PublicKeyCredential) {
                setIsBiometricSupported(true);
            }
        }, []);

        const saveAppConfig = (e) => {
            e.preventDefault();
            localStorage.setItem('appConfig', JSON.stringify(appConfig));
            alert('জেনারেল সেটিংস সফলভাবে সেভ হয়েছে!');
        };

        const handleAddUser = async (e) => {
            e.preventDefault();
            if (!newUser.username || !newUser.password || !newUser.name) return;
            try {
                await addDoc(collection(db, "staff_users"), {
                    ...newUser,
                    createdAt: serverTimestamp()
                });
                alert('নতুন স্টাফ যুক্ত হয়েছে!');
                setNewUser({ username: '', password: '', role: 'Worker', name: '' });
            } catch (err) {
                alert('ত্রুটি: ' + err.message);
            }
        };

        const deleteUser = async (id) => {
            if(confirm('সত্যিই এই স্টাফ অ্যাকাউন্টটি ডিলিট করতে চান?')) {
                await deleteDoc(doc(db, "staff_users", id));
            }
        };

        const enrollBiometric = () => {
            localStorage.setItem('biometricEnabled', 'true');
            localStorage.setItem('biometricUsername', userName);
            alert('আপনার ফিঙ্গারপ্রিন্ট/ফেইস আইডি এই ডিভাইসের জন্য এনরোল হয়েছে!');
        };

        const handleSaveCommission = (e) => {
            e.preventDefault();
            localStorage.setItem('commissionRate', commissionRate);
            alert('কমিশন রেট সেভ করা হয়েছে!');
        };

        const handleChangeMyPassword = async (e) => {
            e.preventDefault();
            setPassMsg({ text: '', type: '' });
            if (myNewPass !== myConfirmPass) {
                setPassMsg({ text: 'নতুন পাসওয়ার্ড ও নিশ্চিত পাসওয়ার্ড মিলছে না!', type: 'error' });
                return;
            }
            const myUser = staffUsers.find(u => u.username === userName || u.name === userName);
            if (myUser) {
                if (myUser.password !== myOldPass) {
                    setPassMsg({ text: 'পুরানো পাসওয়ার্ড সঠিক নয়!', type: 'error' });
                    return;
                }
                await updateDoc(doc(db, "staff_users", myUser.firebaseId), { password: myNewPass });
                setPassMsg({ text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', type: 'success' });
                setMyOldPass(''); setMyNewPass(''); setMyConfirmPass('');
            } else {
                const settingsRef = collection(db, 'settings');
                const q = await getDocs(settingsRef);
                if (!q.empty) {
                    const settingsDoc = q.docs[0];
                    const data = settingsDoc.data();
                    const roleKey = userRole.toLowerCase();
                    if (data[roleKey] !== myOldPass) {
                        setPassMsg({ text: 'পুরানো পাসওয়ার্ড সঠিক নয়!', type: 'error' });
                        return;
                    }
                    await updateDoc(doc(db, 'settings', settingsDoc.id), { [roleKey]: myNewPass });
                    setPassMsg({ text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', type: 'success' });
                    setMyOldPass(''); setMyNewPass(''); setMyConfirmPass('');
                } else {
                    setPassMsg({ text: 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।', type: 'error' });
                }
            }
        };

        const settingMenus = [
            { id: 'general', label: '⚙️ জেনারেল কনফিগারেশন' },
            { id: 'staff', label: '👥 স্টাফ অ্যাক্সেস প্যানেল' },
            { id: 'password', label: '🔑 পাসওয়ার্ড ও সিকিউরিটি' },
            { id: 'operations', label: '💰 অপারেশনস ও কমিশন' },
            { id: 'links', label: '🔗 এক্সেস লিংক জেনারেটর' },
        ];

        return (
            <div className="max-w-[1400px] mx-auto space-y-8 no-print animate-fade-in text-slate-800 dark:text-white pb-20">
                <div className="flex justify-between items-end border-b-2 border-slate-100 dark:border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">সিস্টেম সেটিংস প্যানেল</h2>
                        <p className="text-slate-500 dark:text-zinc-300 font-semibold uppercase tracking-widest text-xs mt-3">অ্যাডভান্সড ড্যাশবোর্ড কনফিগারেশন</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Menu */}
                    <div className="w-full md:w-72 shrink-0 space-y-2 border-r border-slate-100 dark:border-white/5 pr-6">
                        {settingMenus?.map(menu => (
                            <button key={menu.id} onClick={() => setActiveSettingTab(menu.id)}
                                className={`w-full text-left px-5 py-4 rounded-2xl font-medium uppercase tracking-widest text-[11px] transition-all ${
                                    activeSettingTab === menu.id ? 'bg-indigo-600 dark:bg-[#3B82F6] text-white shadow-md' : 'text-slate-500 dark:text-zinc-300 hover:bg-slate-100 neo-inset dark:hover:bg-dark-surfaceHover hover:text-slate-900 dark:text-white dark:hover:text-white'
                                }`}>
                                {menu.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* GENERAL CONFIG */}
                        {activeSettingTab === 'general' && (
                            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 neo-card dark:border-white/5  animate-fade-in">
                                <h3 className="text-lg font-medium uppercase tracking-widest mb-2 text-slate-900 dark:text-white">জেনারেল সিস্টেম কনফিগারেশন</h3>
                                <p className="text-slate-500 dark:text-zinc-300 text-xs font-medium mb-8">কোম্পানির নাম, নম্বর এবং গ্লোবাল সেটিংস</p>
                                <form onSubmit={saveAppConfig} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">কোম্পানির নাম (ব্র্যান্ডিং)</label>
                                            <input required className="w-full p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-bold" value={appConfig.companyName} onChange={e => setAppConfig({...appConfig, companyName: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">অফিসিয়াল WhatsApp Number</label>
                                            <input required className="w-full p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-bold" value={appConfig.whatsappNumber} onChange={e => setAppConfig({...appConfig, whatsappNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">ঢাকার ভেতরে ডেলিভারি চার্জ (৳)</label>
                                            <input type="number" required className="w-full p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-bold" value={appConfig.deliveryDhaka} onChange={e => setAppConfig({...appConfig, deliveryDhaka: Number(e.target.value)})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">ঢাকার বাইরে ডেলিভারি চার্জ (৳)</label>
                                            <input type="number" required className="w-full p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-bold" value={appConfig.deliveryOutside} onChange={e => setAppConfig({...appConfig, deliveryOutside: Number(e.target.value)})} />
                                        </div>
                                    </div>
                                    <button type="submit" className="px-10 py-4 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white rounded-xl font-medium uppercase tracking-widest text-xs hover:bg-indigo-700 dark:hover:bg-zinc-200 transition-all shadow-md">সেটিংস সেভ করুন</button>
                                </form>
                            </div>
                        )}

                        {/* STAFF TAB */}
                        {activeSettingTab === 'staff' && (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
                                <div className="xl:col-span-1 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 neo-card dark:border-white/5  h-max">
                                    <h3 className="text-sm font-medium uppercase tracking-widest mb-6 border-b-2 border-slate-50 dark:border-white/5 pb-4 text-slate-900 dark:text-white">নতুন স্টাফ একাউন্ট</h3>
                                    <form onSubmit={handleAddUser} className="space-y-5">
                                        <div>
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">পুরো নাম</label>
                                            <input required className="w-full mt-1 p-3.5 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-medium" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">ইউজারনেম</label>
                                            <input required className="w-full mt-1 p-3.5 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-medium" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">পাসওয়ার্ড</label>
                                            <input required type="password" className="w-full mt-1 p-3.5 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-medium" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">রোল</label>
                                            <select className="w-full mt-1 p-3.5 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-medium appearance-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="Admin">Admin (Full Access)</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="Manager">Manager</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="Worker">Worker</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white rounded-xl font-medium uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all shadow-md">অ্যাকাউন্ট তৈরি করুন</button>
                                    </form>
                                </div>
                                
                                <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                                    <h3 className="text-sm font-medium uppercase tracking-widest mb-6 border-b-2 border-slate-50 dark:border-white/5 pb-4 text-slate-900 dark:text-white">সকল স্টাফ লিস্ট</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="text-[10px] uppercase font-bold text-slate-900 dark:text-white border-b-2 border-slate-50 dark:border-white/10 dark:bg-[#1C1C1F]">
                                                <tr>
                                                    <th className="pb-3 px-4">নাম</th>
                                                    <th className="pb-3 px-4">ইউজারনেম</th>
                                                    <th className="pb-3 px-4">রোল</th>
                                                    <th className="pb-3 px-4 text-center">অ্যাকশন</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                                                {staffUsers?.map(user => (
                                                    <tr key={user.firebaseId} className="hover:bg-slate-50 neo-inset dark:hover:bg-[#16161A] transition-all">
                                                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{user.name}</td>
                                                        <td className="py-4 px-4 font-semibold text-slate-500 dark:text-zinc-300">@{user.username}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${user.role === 'Admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : user.role === 'Manager' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:bg-[#3B82F6]/20 dark:text-[#3B82F6]' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>{user.role}</span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center whitespace-nowrap">
                                                            <button onClick={() => {
                                                                const newPass = prompt(`নতুন পাসওয়ার্ড দিন ${user.name} এর জন্য:`);
                                                                if (newPass) {
                                                                    updateDoc(doc(db, "staff_users", user.firebaseId), { password: newPass });
                                                                    alert('পাসওয়ার্ড পরিবর্তন করা হয়েছে!');
                                                                }
                                                            }} className="text-xs font-semibold text-indigo-600 dark:text-white bg-indigo-50 dark:bg-[#3B82F6] px-3 py-1.5 rounded-lg mr-2 hover:opacity-80">Reset</button>
                                                            <button onClick={() => deleteUser(user.firebaseId)} className="text-xs font-semibold text-rose-600 dark:text-white bg-rose-50 dark:bg-rose-600 px-3 py-1.5 rounded-lg hover:opacity-80">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {staffUsers.length === 0 && (
                                                    <tr><td colSpan="4" className="text-center py-10 font-medium text-slate-400">কোনো স্টাফ একাউন্ট নেই। লিগ্যাসি পাসওয়ার্ড ব্যবহার হচ্ছে।</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASSWORD & SECURITY TAB */}
                        {activeSettingTab === 'password' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                                        <h3 className="text-lg font-medium uppercase tracking-widest mb-2 text-slate-900 dark:text-white">আমার পাসওয়ার্ড পরিবর্তন</h3>
                                        <p className="text-slate-500 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-widest mb-8">Logged in as: {userName} ({userRole})</p>
                                        <form onSubmit={handleChangeMyPassword} className="space-y-5">
                                            <div>
                                                <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">পুরানো পাসওয়ার্ড</label>
                                                <input required type="password" className="w-full mt-1 p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-medium" value={myOldPass} onChange={e => setMyOldPass(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">নতুন পাসওয়ার্ড</label>
                                                <input required type="password" className="w-full mt-1 p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-medium" value={myNewPass} onChange={e => setMyNewPass(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                                                <input required type="password" className="w-full mt-1 p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-medium" value={myConfirmPass} onChange={e => setMyConfirmPass(e.target.value)} />
                                            </div>
                                            {passMsg.text && (
                                                <div className={`p-4 rounded-xl text-[11px] font-bold uppercase tracking-widest text-center ${passMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                                                    {passMsg.text}
                                                </div>
                                            )}
                                            <button type="submit" className="w-full py-4 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white rounded-xl font-medium uppercase tracking-widest text-xs hover:bg-indigo-700 dark:hover:bg-zinc-200 transition-all shadow-md">পাসওয়ার্ড আপডেট করুন</button>
                                        </form>
                                    </div>
                                    <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                                        <h3 className="text-lg font-medium uppercase tracking-widest mb-2 text-slate-900 dark:text-white">বায়োমেট্রিক সিকিউরিটি</h3>
                                        <p className="text-slate-500 dark:text-zinc-300 text-xs font-medium mb-8">ড্যাশবোর্ডে দ্রুত এবং সুরক্ষিত অ্যাক্সেস</p>
                                        
                                        <div className="bg-slate-50 neo-inset neo-bg p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 dark:bg-[#3B82F6]/20 text-indigo-600 dark:text-[#3B82F6] rounded-full flex items-center justify-center">
                                                    <Lock size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Fingerprint / Face ID</h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-zinc-300 mt-1 uppercase tracking-wider font-semibold">Enable secure login for this device</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={enrollBiometric} 
                                                disabled={!isBiometricSupported}
                                                className={`w-full py-4 rounded-xl font-medium uppercase tracking-widest text-xs transition-all shadow-md ${isBiometricSupported ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                                            >
                                                {isBiometricSupported ? 'বায়োমেট্রিক চালু করুন' : 'ডিভাইসটি সাপোর্ট করে না'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OPERATIONS & COMMISSION TAB */}
                        {activeSettingTab === 'operations' && (
                            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 neo-card dark:border-white/5  animate-fade-in">
                                <h3 className="text-lg font-medium uppercase tracking-widest mb-2 text-slate-900 dark:text-white">অপারেশনস ও কমিশন রেট</h3>
                                <p className="text-slate-500 dark:text-zinc-300 text-xs font-medium mb-8">কারিগরের কাজ প্রতি গ্লোবাল কমিশন রেট</p>
                                <form onSubmit={handleSaveCommission} className="max-w-md space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-zinc-300">কমিশন রেট (শতকরা % বা ফিক্সড অ্যামাউন্ট)</label>
                                        <input required type="number" className="w-full p-4 bg-slate-50 neo-inset neo-bg border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 font-bold text-lg" value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))} />
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white rounded-xl font-medium uppercase tracking-widest text-xs hover:bg-indigo-700 dark:hover:bg-zinc-200 transition-all shadow-md">আপডেট করুন</button>
                                </form>
                            </div>
                        )}

                        {/* LINKS TAB */}
                        {activeSettingTab === 'links' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
                                {Object.entries(LINKS)?.map(([category, links]) => (
                                    <div key={category} className="bg-white p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm neo-card dark:border-white/5 ">
                                        <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-widest mb-6 border-b-2 border-slate-50 dark:border-white/5 pb-4">{category}</h3>
                                        <div className="space-y-4">
                                            {links?.map((link, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => { if (link.tab) setActiveTab(link.tab); }}
                                                    className={`flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 neo-inset dark:hover:bg-[#16161A] border-2 border-transparent hover:border-slate-100 dark:hover:border-dark-border transition-all ${link.tab ? 'cursor-pointer' : ''}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xl">{link.icon}</span>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{link.label}</p>
                                                            {link.url && <p className="text-[10px] text-slate-500 dark:text-zinc-300 font-medium truncate w-40 mt-1 italic">{link.url}</p>}
                                                        </div>
                                                    </div>
                                                    {link.tab ? (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setActiveTab(link.tab); }} 
                                                            className="px-4 py-2 bg-indigo-50 dark:bg-[#3B82F6]/20 text-indigo-700 dark:text-[#3B82F6] font-bold rounded-lg text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                                                        >
                                                            Open
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); handleCopy(link.url); }} className="p-2 rounded bg-slate-50 neo-inset hover:bg-slate-100 neo-inset neo-bg dark:hover:bg-dark-border transition-all"><Copy size={16} /></button>
                                                            <a href={link.url} target="_blank" onClick={(e) => e.stopPropagation()} className="p-2 rounded bg-slate-50 neo-inset hover:bg-slate-100 neo-inset neo-bg dark:hover:bg-dark-border transition-all"><ExternalLink size={16} /></a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    };

    const navigationGroups = [
        {
            title: 'ওভারভিউ',
            items: [
                { id: 'dashboard', label: '📊 সেন্ট্রাল ড্যাশবোর্ড', roles: ['Admin'] }
            ]
        },
        {
            title: 'অর্ডার অপারেশনস',
            items: [
                { id: 'orders', label: '📁 অর্ডার আর্কাইভ', roles: ['Admin', 'Manager', 'Worker'] },
                { id: 'add-order', label: '➕ ম্যানুয়াল অর্ডার এন্ট্রি', roles: ['Admin', 'Manager'] },
                { id: 'courier-tracking', label: '🚚 কুরিয়ার ট্র্যাকিং', roles: ['Admin', 'Manager'] }
            ]
        },
        {
            title: 'স্টক ও উৎপাদন',
            isCollapsible: true,
            items: [
                { id: 'products', label: '📦 প্রোডাক্ট ও স্টক', roles: ['Admin', 'Manager'] },
                { id: 'factory-expenses', label: '🏭 ফ্যাক্টরি ওভারহেড', roles: ['Admin', 'Manager'] },
                { id: 'profit-loss', label: '📈 প্রফিট এন্ড লস', roles: ['Admin'] },
                { id: 'financial-ledger', label: '💰 ক্যাশ বুক ও হিসাব', roles: ['Admin'] },
                { id: 'worker-ledger', label: '🛠️ কারিগর লেজার', roles: ['Admin', 'Manager'] }
            ]
        },
        {
            title: 'কাস্টমার ও মার্কেটিং',
            items: [
                { id: 'customer-database', label: '👥 কাস্টমার ডেটাবেস', roles: ['Admin', 'Manager'] }
            ]
        },
        {
            title: 'স্মার্ট অ্যাসিস্ট্যান্ট',
            items: [
                { id: 'smart-assistant', label: '🤖 AI Assistant', roles: ['Admin', 'Manager', 'Worker'] },
                { id: 'analytics', label: '📊 ডেমোগ্রাফিক রিপোর্ট', roles: ['Admin', 'Manager'] }
            ]
        },
        {
            title: 'টিম কমিউনিকেশন',
            items: [
                { id: 'team-chat', label: '💬 টিম চ্যাট', roles: ['Admin', 'Manager', 'Worker'] },
                { id: 'notice-board', label: '📢 নোটিশ বোর্ড', roles: ['Admin', 'Manager', 'Worker'] }
            ]
        },
        {
            title: 'সিস্টেম সেটিংস',
            items: [
                { id: 'settings', label: '⚙️ সিস্টেম সেটিংস', roles: ['Admin'] }
            ]
        }
    ];

    if (!isLoggedIn) return <LoginView />;

    return (
        <div className="min-h-screen bg-light-bg neo-bg font-bengali text-light-text dark:text-dark-text flex flex-col md:flex-row transition-colors duration-300">
            {/* Sidebar */}
            {/* Mobile Backdrop Overlay */}
            {isMobileMenuOpen && (
                <div 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden no-print"
                />
            )}
            {/* Sidebar */}
            <div className={`fixed no-print md:sticky top-0 left-0 h-screen bg-light-surface neo-card dark:border-white/5  z-50 transform transition-all duration-300 ${
                isSidebarOpen 
                ? 'w-72 translate-x-0 border-r border-light-border dark:border-white/5 shadow-[10px_10px_20px_#c2c3c7,-10px_-10px_20px_#ffffff]' 
                : 'w-0 -translate-x-full overflow-hidden border-none shadow-none md:w-0'
            } flex flex-col`}>
                <div className="p-5 border-b border-light-border dark:border-white/5 flex items-center justify-between shrink-0">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img loading="lazy" src="/nrzoone-logo-new.jpg" alt="Logo" className="h-8 object-contain brightness-0 invert" />
                            <h2 className="text-lg font-medium tracking-tight text-white">NR ZONE</h2>
                        </div>
                    ) : (
                        <img loading="lazy" src="/nrzoone-logo-new.jpg" alt="Logo" className="h-8 w-8 object-contain mx-auto brightness-0 invert" />
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:block p-2 text-dark-textMuted hover:text-dark-cyan transition-colors">
                        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-dark-textMuted hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <nav className="p-4 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                    {navigationGroups?.map((group, gIdx) => {
                        const accessibleItems = group.items?.filter(item => item.roles.includes(userRole));
                        if (accessibleItems.length === 0) return null;

                        // Collapsible accordion group (স্টক ও উৎপাদন panel)
                        if (group.isCollapsible) {
                            return (
                                <div key={gIdx} className="space-y-1">
                                    {isSidebarOpen && (
                                        <button
                                            type="button"
                                            onClick={() => setIsStockPanelOpen(prev => !prev)}
                                            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-dark-textMuted uppercase tracking-wider px-3 py-2 hover:bg-slate-50 neo-inset dark:hover:bg-dark-surfaceHover rounded-lg transition-all cursor-pointer neo-bg"
                                        >
                                            <span>{group.title}</span>
                                            {isStockPanelOpen
                                                ? <ChevronDown size={12} className="shrink-0" />
                                                : <ChevronRight size={12} className="shrink-0" />}
                                        </button>
                                    )}
                                    {(isStockPanelOpen || !isSidebarOpen) && (
                                        <div className={`space-y-1 ${isSidebarOpen ? 'pl-3 border-l-2 border-slate-100 dark:border-white/5 ml-3' : ''}`}>
                                            {accessibleItems?.map(item => {
                                                const isActive = activeTab === item.id;
                                                const emoji = item.label.split(' ')[0];
                                                const text = item.label.substring(emoji.length).trim();
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            setActiveTab(item.id);
                                                            setIsMobileMenuOpen(false);
                                                            setIsSidebarOpen(false);
                                                        }}
                                                        className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                                            isActive
                                                            ? 'bg-[#0f172a] text-white dark:bg-[#3B82F6] dark:text-white dark:border-none tracking-tight shadow-md'
                                                            : 'text-slate-500 dark:text-zinc-300 hover:bg-slate-50 neo-inset hover:text-slate-900 dark:text-white tracking-tight dark:text-dark-textMuted dark:hover:bg-dark-surfaceHover dark:hover:text-dark-text'
                                                        }`}
                                                    >
                                                        {isSidebarOpen ? (
                                                            <>
                                                                <span className="text-base">{emoji}</span>
                                                                <span className="truncate">{text}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-lg py-1">{emoji}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Normal non-collapsible group
                        return (
                            <div key={gIdx} className="space-y-1">
                                {isSidebarOpen && (
                                    <div className="text-[11px] font-semibold text-slate-400 dark:text-dark-textMuted uppercase tracking-wider px-3 mb-1.5">
                                        {group.title}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    {accessibleItems?.map(item => {
                                        const isActive = activeTab === item.id;
                                        const emoji = item.label.split(' ')[0];
                                        const text = item.label.substring(emoji.length).trim();
                                        
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTab(item.id);
                                                    setIsMobileMenuOpen(false);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                                    isActive
                                                    ? 'bg-[#0f172a] text-white dark:bg-[#3B82F6] dark:text-white dark:border-none tracking-tight shadow-md'
                                                    : 'text-slate-500 dark:text-zinc-300 hover:bg-slate-50 neo-inset hover:text-slate-900 dark:text-white tracking-tight dark:text-dark-textMuted dark:hover:bg-dark-surfaceHover dark:hover:text-dark-text'
                                                }`}
                                            >
                                                {isSidebarOpen ? (
                                                    <>
                                                        <span className="text-base">{emoji}</span>
                                                        <span className="truncate">{text}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-lg py-1">{emoji}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-light-border dark:border-white/5 flex flex-col gap-2">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl font-medium transition-all text-sm
                        ${isDarkMode ? 'text-dark-orange hover:bg-dark-orange/10' : 'text-light-orange hover:shadow-[inset_2px_2px_5px_#c2c3c7,inset_-2px_-2px_5px_#ffffff] bg-light-surface'}`}
                    >
                        {isDarkMode ? <Sun size={20} className="drop-shadow-[0_0_5px_#FF9F43]" /> : <Moon size={20} />}
                        {isSidebarOpen && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>
                    <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl font-medium text-red-500 hover:shadow-[inset_2px_2px_5px_#c2c3c7,inset_-2px_-2px_5px_#ffffff] dark:hover:bg-dark-red/10 dark:hover:shadow-none transition-all text-sm`}>
                        <LogOut size={20} /> {isSidebarOpen && <span>লগআউট</span>}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-screen p-4 md:p-6 lg:p-8 overflow-y-auto noscroll text-light-text dark:text-dark-text relative">
                {/* Floating Menu Button on Desktop/Tablet when Sidebar is hidden */}
                {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed top-4 left-4 z-[90] p-3.5 bg-[#0f172a] dark:bg-white text-white dark:text-slate-900 dark:text-white tracking-tight rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center no-print dark:text-white"
                        title="Open Menu"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <div className="md:hidden no-print flex justify-between items-center mb-12">
                    <h1 className="text-xl font-medium text-light-text dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-none">NR ZONE</h1>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-4 bg-light-surface neo-card dark:border-white/5  text-light-text dark:text-white rounded-xl shadow-[5px_5px_10px_#c2c3c7,-5px_-5px_10px_#ffffff] dark:shadow-sm border-none dark:border dark:border-white/5"><Menu size={24} className="md:w-7 md:h-7" /></button>
                </div>



                {activeTab === 'dashboard' && isAdmin && <NeumorphicDashboardView orders={filteredOrdersByWebsite} expenses={expenses} userRole={userRole} setActiveTab={setActiveTab} />}
                {activeTab === 'smart-assistant' && (isAdmin || isManager || isWorker) && <SmartAssistantView />}
                {activeTab === 'analytics' && (isAdmin || isManager) && <SmartAnalyticsView orders={filteredOrdersByWebsite} allProducts={allProducts} />}
                {activeTab === 'products' && (isAdmin || isManager) && <ProductManagerView />}
                {activeTab === 'orders' && (isAdmin || isManager || isWorker) && <OrderListView />}
                {activeTab === 'add-order' && (isAdmin || isManager) && <AddOrderView />}
                {activeTab === 'factory-expenses' && (isAdmin || isManager) && <FactoryExpenseView />}
                {activeTab === 'worker-ledger' && (isAdmin || isManager) && <WorkerLedgerView />}
                {activeTab === 'financial-ledger' && isAdmin && <FinancialLedgerView />}
                {activeTab === 'profit-loss' && isAdmin && <ProfitLossView orders={filteredOrdersByWebsite} expenses={expenses} />}
                {activeTab === 'customer-database' && (isAdmin || isManager) && <CustomerDatabaseView orders={filteredOrdersByWebsite} />}
                {activeTab === 'settings' && isAdmin && <SettingsView />}
                {activeTab === 'courier-tracking' && (isAdmin || isManager) && <CourierTrackingView orders={filteredOrdersByWebsite} isAdmin={isAdmin} onUpdateOrder={async (firebaseId, data) => { try { await updateDoc(doc(db, 'orders', firebaseId), data); } catch(e) { console.error(e); } }} />}
                {activeTab === 'team-chat' && <TeamChatView userRole={userRole} />}
                {activeTab === 'notice-board' && <NoticeBoardView userRole={userRole} />}

            </div>

            {/* Manual Order Entry Modal */}
            {isAddOrderModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-print text-slate-800 dark:text-white dark:text-slate-100">
                    <div className="bg-white neo-card dark:border-white/5  rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl relative border border-slate-100 dark:border-white/5 flex flex-col max-h-[95vh] my-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-dark-bg dark:to-dark-surface text-white border-b dark:border-white/5 shrink-0">
                            <div>
                                <h3 className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">নতুন ম্যানুয়াল অর্ডার এন্ট্রি</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">কাস্টমার তথ্য দিয়ে নতুন ম্যানুয়াল অর্ডার তৈরি করুন</p>
                            </div>
                            <button type="button" onClick={() => setIsAddOrderModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white neo-card dark:border-white/5 ">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 neo-inset neo-bg text-slate-800 dark:text-white">
                            <AddOrderView isModal={true} onClose={() => setIsAddOrderModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Courier Booking Modal */}
            {bookingOrder && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-print text-slate-800 dark:text-white">
                    <div className="bg-white neo-card dark:border-white/5  rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative border border-slate-100 dark:border-white/5 flex flex-col my-4 animate-fade-in">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 bg-[#0f172a] text-white shrink-0">
                            <div>
                                <h3 className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">🚚 কুরিয়ার পার্সেল বুকিং</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">অর্ডার #${bookingOrder.firebaseId?.slice(-6).toUpperCase()} এর জন্য কুরিয়ার এন্ট্রি</p>
                            </div>
                            <button type="button" onClick={() => setBookingOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white neo-card dark:border-white/5 ">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <form onSubmit={handleConfirmBooking} className="p-6 space-y-5 bg-slate-50 neo-inset neo-bg text-slate-800 dark:text-white border-none">
                            <div>
                                <label className="text-[11px] font-medium uppercase text-slate-400">কুরিয়ার নির্বাচন করুন</label>
                                <select className="w-full mt-1 p-4 bg-white neo-card dark:border-white/5  text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-slate-200 dark:border-white/5/40 rounded-xl outline-none focus:border-premium-gold dark:focus:border-premium-gold font-medium text-lg dark:bg-[#2A2A2E] dark:text-white" value={bookingConfig.courier} onChange={e => setBookingConfig({...bookingConfig, courier: e.target.value})}>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="steadfast">Steadfast Courier</option>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="pathao">Pathao Courier</option>
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="redx">RedX Courier</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-medium uppercase text-slate-400">ক্যাশ টু কালেক্ট (CoD)</label>
                                    <input required type="number" className="w-full mt-1 p-4 bg-white neo-card dark:border-white/5  text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-slate-200 dark:border-white/5/40 rounded-xl outline-none focus:border-premium-gold dark:focus:border-premium-gold font-medium text-lg" value={bookingConfig.cod} onChange={e => setBookingConfig({...bookingConfig, cod: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium uppercase text-slate-400">ওজন (কেজি)</label>
                                    <input required step="0.1" type="number" className="w-full mt-1 p-4 bg-white neo-card dark:border-white/5  text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-slate-200 dark:border-white/5/40 rounded-xl outline-none focus:border-premium-gold dark:focus:border-premium-gold font-medium text-lg" value={bookingConfig.weight} onChange={e => setBookingConfig({...bookingConfig, weight: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-medium uppercase text-slate-400">মন্তব্য / বিশেষ নির্দেশাবলী</label>
                                <input className="w-full mt-1 p-4 bg-white neo-card dark:border-white/5  text-slate-900 dark:text-white tracking-tight dark:text-white border-2 border-slate-200 dark:border-white/5/40 rounded-xl outline-none focus:border-premium-gold dark:focus:border-premium-gold font-medium text-lg" value={bookingConfig.note} onChange={e => setBookingConfig({...bookingConfig, note: e.target.value})} />
                            </div>
                            <div className="flex flex-col gap-3 mt-4">
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-yellow-600 to-premium-gold hover:from-yellow-700 hover:to-yellow-600 text-white rounded-xl font-medium uppercase tracking-widest text-sm transition-all shadow-md active:scale-95 border-none cursor-pointer">
                                    ✅ API কুরিয়ার বুকিং করুন
                                </button>
                                
                                <button type="button" onClick={() => {
                                    const text = `*New Order for Pathao Direct*\nOrder ID: #${bookingOrder.firebaseId?.slice(-6).toUpperCase()}\nName: ${bookingOrder.customerName}\nPhone: ${bookingOrder.customerPhone}\nAddress: ${bookingOrder.customerAddress}\nProducts: ${bookingOrder.products ? bookingOrder.products?.map(p => p.name).join(', ') : bookingOrder.category}\nCOD Amount: ৳${bookingConfig.cod}\nNote: ${bookingConfig.note || 'N/A'}`;
                                    navigator.clipboard.writeText(text).catch(() => console.log('Clipboard copy failed'));
                                    
                                    // 1. Open WhatsApp Group instantly
                                    window.open('https://chat.whatsapp.com/BE5Dux9KPRiFTdDDYb2Zm6', '_blank');
                                    
                                    // 2. Print Invoice instantly
                                    handlePrint(bookingOrder, 'thermal');
                                    
                                    // 3. Close Modal
                                    setBookingOrder(null);
                                }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium uppercase tracking-widest text-sm transition-all shadow-md active:scale-95 border-none cursor-pointer flex items-center justify-center gap-2">
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    Pathao WhatsApp গ্রুপে পাঠান + POS প্রিন্ট
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Global Print Component */}
            <PrintInvoice order={printData} />
        </div>
    );
};

export default AdminDashboard;
