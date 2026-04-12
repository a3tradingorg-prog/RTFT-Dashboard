import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Institutional Error Boundary caught an exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full p-8 bg-[#141414] border border-[#262626] rounded-[32px] text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">System Fault Detected</h2>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  A critical script error has occurred. This may be due to a transient network issue or a component failure.
                </p>
              </div>
              
              <div className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-left overflow-hidden mb-8">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Error Signature</p>
                <p className="text-xs font-mono text-red-400 break-all leading-relaxed">
                  {this.state.error?.name}: {this.state.error?.message || 'Unknown Script Error'}
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-sky-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-sky-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-500/20 active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Reboot System
              </button>
              
              <p className="mt-6 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                Error logged to institutional feed • ID: {Math.random().toString(36).substring(7).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
