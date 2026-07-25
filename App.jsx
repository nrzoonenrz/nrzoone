import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import LandingPage from './LandingPage';
import ClassicCollection from './ClassicCollection';

import KidsCollection from './KidsCollection';
import ChotoMeyeCollection from './ChotoMeyeCollection';
import ComboCollection from './ComboCollection';
import BoroBonCollection from './BoroBonCollection';
import MaCollection from './MaCollection';
import MaBoroMeyeCollection from './MaBoroMeyeCollection';
import AdminDashboard from './AdminDashboard';
import HijabCollection from './HijabCollection';
import OrderTracking from './OrderTracking';
import QuickOrder from './QuickOrder';

import { CartProvider } from './CartContext';
import CartSidebar from './CartSidebar';
import CartIcon from './CartIcon';
import ScrollToTop from './ScrollToTop';

import ErrorBoundary from './ErrorBoundary';

function App() {
    useEffect(() => {
        // 1. Domain Lock (Anti-Clone Protection)
        const allowedHosts = [
            'localhost',
            '127.0.0.1',
            'nrzoone.com',
            'www.nrzoone.com',
            'page-85f6e.web.app',
            'page-85f6e.firebaseapp.com',
            'nrzoone-com.web.app',
            'nrzoone-com.firebaseapp.com'
        ];
        const currentHost = window.location.hostname;
        if (!import.meta.env.DEV && !allowedHosts.includes(currentHost) && !currentHost.endsWith('.vercel.app')) {
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) {}
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-weight:bold;color:red;font-size:24px;text-align:center;">Unauthorized Domain Clone Detected. Redirecting to official nrzoone.com...</div>';
            setTimeout(() => {
                window.location.href = 'https://nrzoone.com';
            }, 1500);
            return;
        }

        // 2. DevTools & Copying Protection (Disable Right-click, F12, Ctrl+U, etc.)
        const preventDefault = (e) => e.preventDefault();
        
        // Disable Right-Click
        document.addEventListener('contextmenu', preventDefault);

        // Disable keyboard shortcuts for developer tools
        const handleKeyDown = (e) => {
            // F12 key
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I (inspect), Ctrl+Shift+J (console), Ctrl+U (source code), Ctrl+S (save)
            if (e.ctrlKey && (e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j') || e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's')) {
                e.preventDefault();
                return false;
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // 3. Anti-Debugger Loop (Only in Production)
        // If someone manages to open DevTools, this loop will freeze the browser tab
        // by constantly triggering the debugger. We only run this in production so 
        // it doesn't block you during local development.
        let antiDebugLoop;
        if (import.meta.env.PROD) {
            antiDebugLoop = setInterval(() => {
                const before = new Date().getTime();
                // eslint-disable-next-line no-debugger
                debugger; 
                const after = new Date().getTime();
                if (after - before > 100) {
                    // If it takes more than 100ms, the debugger was open and paused the execution.
                    document.body.innerHTML = "Security Violation: Developer Tools Detected.";
                    window.location.reload();
                }
            }, 1000);
        }

        // Cleanup listeners
        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('keydown', handleKeyDown);
            if (antiDebugLoop) clearInterval(antiDebugLoop);
        };
    }, []);

    return (
        <CartProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/classic" element={<ClassicCollection />} />

                    <Route path="/kids" element={<KidsCollection />} />
                    <Route path="/mejomeye" element={<KidsCollection />} />
                    <Route path="/chotomeye" element={<ChotoMeyeCollection />} />
                    <Route path="/combo" element={<ComboCollection />} />
                    <Route path="/borobon" element={<BoroBonCollection />} />
                    <Route path="/ma" element={<MaCollection />} />
                    <Route path="/maboromeye" element={<MaBoroMeyeCollection />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/hijab" element={<HijabCollection />} />
                    <Route path="/track" element={<OrderTracking />} />
                    <Route path="/order" element={<QuickOrder />} />
                    <Route path="*" element={<Home />} />
                </Routes>
                <CartSidebar />
                <CartIcon />
            </Router>
        </CartProvider>
    );
}

export default App;
