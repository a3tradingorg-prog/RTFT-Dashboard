import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Journal from './pages/Journal';
import Strategy from './pages/Strategy';
import AISummary from './pages/AISummary';
import Learning from './pages/Learning';
import Fundamental from './pages/Fundamental';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const isConfigured = (import.meta as any).env.VITE_SUPABASE_URL && (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-[#141414] border border-[#262626] rounded-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Configuration Required</h2>
          <p className="text-neutral-400">
            Please set your Supabase credentials in the <strong>Secrets</strong> panel to continue.
          </p>
          <div className="space-y-2 text-left bg-[#0a0a0a] p-4 rounded-xl border border-[#262626]">
            <p className="text-xs font-mono text-neutral-500">VITE_SUPABASE_URL</p>
            <p className="text-xs font-mono text-neutral-500">VITE_SUPABASE_ANON_KEY</p>
          </div>
          <p className="text-xs text-neutral-500 italic">
            Once set, the application will automatically reload.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/accounts" element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
          } />
          
          <Route path="/journal" element={
            <ProtectedRoute>
              <Journal />
            </ProtectedRoute>
          } />
          
          <Route path="/strategy" element={
            <ProtectedRoute>
              <Strategy />
            </ProtectedRoute>
          } />
          
          <Route path="/ai-summary" element={
            <ProtectedRoute>
              <AISummary />
            </ProtectedRoute>
          } />
          
          <Route path="/learning" element={
            <ProtectedRoute>
              <Learning />
            </ProtectedRoute>
          } />
          
          <Route path="/fundamental" element={
            <ProtectedRoute>
              <Fundamental />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
