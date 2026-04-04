import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  FileText, 
  Download, 
  Loader2, 
  Search, 
  Book, 
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from './ScrollReveal';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface PDFFile {
  name: string;
  path: string;
  size?: string;
  category: string;
}

const PDF_FILES: PDFFile[] = [
  { name: 'Trading Psychology 2.0', path: 'Trading_Psychology_2_0_From_Best.pdf', category: 'Psychology' },
  { name: 'Trading Order Flow eBook', path: 'Trading_Order_Flow_ebook.pdf', category: 'Order Flow' },
  { name: 'The PlayBook', path: 'The_PlayBook__An_Inside_Look_at_How_to_Think_Like_a_Professional_Trader_.pdf', category: 'Strategy' },
  { name: 'Alchemist SnR', path: 'Alchemist SnR.pdf', category: 'Technical Analysis' },
  { name: 'Trading For A Living', path: 'Elder Alexander - Trading For A Living.pdf', category: 'Psychology' },
  { name: 'Long-Term Secrets to Short-Term Trading', path: 'larry-williams-long-term-secrets-to-short-term-trading.pdf', category: 'Strategy' },
  { name: 'Malaysian SNR Emperor', path: 'Malaysian SNR Emperor.pdf', category: 'Technical Analysis' },
  { name: 'Malaysian SNR Theory', path: 'malaysian-snr-theory.pdf', category: 'Technical Analysis' },
  { name: 'MSNR SL 10 PIPS', path: 'MSNR SL 10 PIPS-1.pdf', category: 'Technical Analysis' },
  { name: 'MSNR Trendliniya', path: 'msnr-Trendliniya.pdf', category: 'Technical Analysis' },
  { name: 'MSNR x SMC x ICT The Alchemist', path: 'msnr-x-smc-x-ict-the-alchemist-yanu-emmanuel_compress.pdf', category: 'Technical Analysis' },
  { name: 'My Rare SNR Course', path: 'My Rare SNR Course.pdf', category: 'Technical Analysis' },
  { name: 'Psychology of Trading', path: 'Psychology of trading.pdf', category: 'Psychology' },
  { name: 'Quarterly Theory', path: 'Quarterly Theory.pdf', category: 'Time & Price' },
  { name: 'The Trading Game', path: 'ryan-jones-the-trading-gamepdf.pdf', category: 'Strategy' },
  { name: 'Secret Of 411', path: 'Secret Of 411.pdf', category: 'Technical Analysis' },
  { name: 'SNR Malaysia', path: 'SNR Malaysia.pdf', category: 'Technical Analysis' },
  { name: 'The Handbook of Portfolio Mathematics', path: 'The handbook of portfolio mathematics.pdf', category: 'Risk Management' }
];

export default function PDFLibrary() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(PDF_FILES.map(f => f.category)))];

  const filteredFiles = PDF_FILES.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = async (file: PDFFile) => {
    if (!user) {
      toast.error('Authentication required', {
        description: 'Please sign in to download educational resources.'
      });
      return;
    }

    setDownloading(file.path);
    const toastId = toast.loading(`Preparing ${file.name}...`);

    try {
      // Use Supabase Storage download method
      // This ensures that the request is authenticated with the user's session
      const { data, error } = await supabase.storage
        .from('pdf')
        .download(file.path);

      if (error) {
        console.error('Download error:', error);
        throw error;
      }

      if (!data) throw new Error('No data received');

      // Create a blob URL and trigger download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name.endsWith('.pdf') ? file.name : `${file.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download started!', { id: toastId });
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error('Download failed', {
        id: toastId,
        description: error.message || 'An error occurred while fetching the file. Please check if the file exists in the "pdf" bucket.'
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Book className="w-32 h-32 text-sky-500" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-sky-500" />
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">PDF Library</h2>
              </div>
              <p className="text-sm text-neutral-500 font-medium">Download exclusive trading books and educational guides.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 bg-[#0a0a0a] border border-[#262626] rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-8 relative z-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                  selectedCategory === cat 
                    ? "bg-sky-500 text-black border-sky-500 shadow-lg shadow-sky-500/20" 
                    : "bg-black/40 text-neutral-500 border-[#262626] hover:text-white hover:border-neutral-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {!user && (
        <ScrollReveal delay={0.1}>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-500">Authentication Required</h4>
              <p className="text-xs text-neutral-500">You must be logged in to access and download these resources.</p>
            </div>
          </div>
        </ScrollReveal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredFiles.map((file, index) => (
            <ScrollReveal key={file.path} delay={0.1 + (index * 0.05)}>
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col gap-6 hover:border-sky-500/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-sky-500/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-black transition-all duration-500">
                    <Book className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                    {file.category}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-sky-400 transition-colors">{file.name}</h3>
                  <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">PDF Document</p>
                </div>

                <button
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.path || !user}
                  className={cn(
                    "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    !user 
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : "bg-[#0a0a0a] border border-[#262626] text-white hover:bg-sky-500 hover:text-black hover:border-sky-500"
                  )}
                >
                  {downloading === file.path ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>
              </motion.div>
            </ScrollReveal>
          ))}
        </AnimatePresence>
      </div>

      {filteredFiles.length === 0 && (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#141414] mb-4">
            <Search className="w-8 h-8 text-neutral-700" />
          </div>
          <p className="text-neutral-500 italic">No books found matching your search.</p>
        </div>
      )}
    </div>
  );
}
