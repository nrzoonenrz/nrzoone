import React from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("System Crash Caught:", error, errorInfo);
    }

    handleHardReset = async () => {
        // Clear all storages
        localStorage.clear();
        sessionStorage.clear();
        
        // Unregister service workers (PWA)
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            } catch(e) { console.error("SW Unregister failed", e); }
        }

        // Clear Caches API
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                for (let key of keys) {
                    await caches.delete(key);
                }
            } catch(e) { console.error("Cache clear failed", e); }
        }

        // Hard reload the page without cache
        window.location.href = window.location.pathname + '?reset=' + Date.now();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden relative">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[150px] animate-pulse"></div>
                    
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-[3rem] shadow-[0_50px_100px_rgba(255,0,0,0.1)] max-w-2xl w-full z-10 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-shake-soft">
                            <ShieldAlert size={48} />
                        </div>
                        
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-4 text-red-100 text-slate-900 dark:text-white">System Overload</h1>
                        <p className="text-white/60 font-semibold mb-8">
                            A critical error occurred while processing data. The application has halted to prevent data corruption. 
                            Junk files or corrupted cache might be the cause.
                        </p>

                        <div className="bg-black/50 p-6 rounded-2xl border border-white/5 mb-8 text-left overflow-auto max-h-40">
                            <code className="text-red-300 text-xs font-mono">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>

                        <button 
                            onClick={this.handleHardReset}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-6 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(220,38,38,0.3)]"
                        >
                            <Trash2 size={24} /> 
                            <span>Hard Reset System & Clear Junk</span>
                        </button>
                        
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-6">
                            This will clear all caches, local data, and restart the app securely.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
