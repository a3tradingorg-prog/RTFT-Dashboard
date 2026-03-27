import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Resource } from '../types';
import { 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink, 
  Search,
  PlayCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import TradeReference from '../components/TradeReference';

export default function Learning() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setResources(data);
      }
      setLoading(false);
    };

    fetchResources();
  }, []);

  const categories = ['All', 'Basics', 'Strategy', 'Psychology', 'Technical Analysis'];
  
  const filteredResources = filter === 'All' 
    ? resources 
    : resources.filter(r => r.category === filter);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-white">Learning Center</h1>
        <p className="text-neutral-500 mt-2 font-medium">Curated resources to help you master the markets.</p>
      </header>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
              filter === cat 
                ? "bg-sky-500 text-black shadow-lg shadow-sky-500/20" 
                : "bg-[#141414] text-neutral-500 hover:text-white border border-[#262626]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Conditional Rendering */}
      {filter === 'Technical Analysis' ? (
        <TradeReference />
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="group bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden hover:border-sky-500/30 transition-all flex flex-col shadow-sm">
                  <div className="relative aspect-video bg-[#0a0a0a] overflow-hidden">
                    {resource.thumbnail_url ? (
                      <img 
                        src={resource.thumbnail_url} 
                        alt={resource.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-800">
                        <PlayCircle className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-sky-400 border border-sky-500/20">
                        {resource.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-sky-400 transition-colors">{resource.title}</h3>
                    <p className="text-sm text-neutral-500 line-clamp-2 mb-8 flex-1 leading-relaxed">{resource.description}</p>
                    
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 w-full py-4 bg-[#0a0a0a] border border-[#262626] hover:bg-sky-500 hover:text-black hover:border-sky-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                      View Resource
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}

              {filteredResources.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#141414] mb-4">
                    <BookOpen className="w-8 h-8 text-neutral-600" />
                  </div>
                  <p className="text-neutral-500 italic">No resources found in this category yet.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
