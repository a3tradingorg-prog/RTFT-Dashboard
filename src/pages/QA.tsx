import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  HelpCircle, 
  ChevronDown, 
  BookOpen, 
  MessageSquare,
  Languages,
  ArrowRight
} from 'lucide-react';
import { QA_TRANSLATIONS, UI_TRANSLATIONS, Language } from '../lib/translations';
import { cn } from '../lib/utils';
import { ScrollReveal } from '../components/ScrollReveal';
import { Ripple } from '../components/Ripple';

export default function QA() {
  const [lang, setLang] = useState<Language>('mm');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredQA = useMemo(() => {
    return QA_TRANSLATIONS.filter(item => 
      item.question[lang].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer[lang].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category[lang].toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lang, searchQuery]);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'mm' : 'en');
  };

  return (
    <div className="space-y-10 pb-20">
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
              <MessageSquare className="w-10 h-10 text-sky-500" />
              {UI_TRANSLATIONS.qaTitle[lang]}
            </h1>
            <p className="text-neutral-500 mt-2 font-bold tracking-wide uppercase text-xs">
              Knowledge base and frequently asked questions
            </p>
          </div>

          <button
            onClick={toggleLang}
            className="flex items-center gap-4 px-5 py-3 bg-[#141414] border border-[#262626] rounded-2xl hover:border-sky-500/50 transition-all group shrink-0 relative overflow-hidden"
          >
            <Ripple />
            <div className="flex items-center gap-2 relative z-10 pointer-events-none">
              <span className={cn(
                "text-xs font-black transition-colors px-1.5 py-0.5 rounded",
                lang === 'en' ? "text-sky-500 bg-sky-500/10" : "text-neutral-600"
              )}>EN</span>
              <div className="w-[1px] h-3 bg-[#262626]" />
              <span className={cn(
                "text-xs font-black transition-colors px-1.5 py-0.5 rounded",
                lang === 'mm' ? "text-sky-500 bg-sky-500/10" : "text-neutral-600"
              )}>MM</span>
            </div>
            <Languages className="w-4 h-4 text-neutral-500 group-hover:text-sky-500 transition-colors" />
          </button>
        </div>
      </ScrollReveal>

      {/* Search Bar */}
      <ScrollReveal delay={0.1}>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-600" />
          <input
            type="text"
            placeholder={UI_TRANSLATIONS.searchPlaceholder[lang]}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#262626] rounded-[24px] pl-16 pr-8 py-6 text-white focus:outline-none focus:border-sky-500/50 transition-all text-lg font-bold placeholder:text-neutral-700"
          />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-4">
          {filteredQA.length > 0 ? (
            filteredQA.map((item, index) => (
              <ScrollReveal key={item.id} delay={0.1 + index * 0.05}>
                <div 
                  className={cn(
                    "group bg-[#141414] border border-[#262626] rounded-[24px] overflow-hidden transition-all duration-300 relative",
                    openId === item.id ? "border-sky-500/30 ring-1 ring-sky-500/10" : "hover:border-[#363636]"
                  )}
                >
                  <button
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                    className="w-full px-8 py-7 flex items-center justify-between text-left group relative overflow-hidden"
                  >
                    <Ripple />
                    <div className="flex items-center gap-6 relative z-10 pointer-events-none">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                        openId === item.id ? "bg-sky-500/10 text-sky-500" : "bg-[#1a1a1a] text-neutral-600 group-hover:text-neutral-400"
                      )}>
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-1 block">
                          {item.category[lang]}
                        </span>
                        <h3 className="text-xl font-bold text-white leading-tight">
                          {item.question[lang]}
                        </h3>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "w-6 h-6 text-neutral-700 transition-transform duration-500 shrink-0 ml-4",
                      openId === item.id && "rotate-180 text-sky-500"
                    )} />
                  </button>

                  <AnimatePresence>
                    {openId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <div className="px-8 pb-8 pt-2">
                          <div className="h-[1px] w-full bg-[#262626] mb-6" />
                          <p className="text-neutral-400 text-lg leading-relaxed font-medium">
                            {item.answer[lang]}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            ))
          ) : (
            <div className="text-center py-20 bg-[#141414] border border-[#262626] border-dashed rounded-[32px]">
              <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-neutral-700" />
              </div>
              <h3 className="text-xl font-bold text-white">No results found</h3>
              <p className="text-neutral-500 mt-2">Try searching for something else or check your spelling.</p>
            </div>
          )}
        </div>

        {/* Sidebar / Stats */}
        <div className="lg:col-span-4 space-y-6">
          <ScrollReveal delay={0.4}>
            <div className="bg-sky-500 rounded-[32px] p-8 text-black relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              
              <BookOpen className="w-10 h-10 mb-6" />
              <h4 className="text-2xl font-black leading-tight mb-4">
                {lang === 'en' ? 'Need more advanced training?' : 'ပိုမိုအဆင့်မြင့်သော သင်ကြားမှုများ လိုအပ်ပါသလား?'}
              </h4>
              <p className="text-black/70 font-bold mb-8">
                {lang === 'en' 
                  ? 'Join our private mentorship to master market mechanics and boost your funded account performance.' 
                  : 'Market mechanics များကို ကျွမ်းကျင်ပိုင်နိုင်စေရန်နှင့် သင်၏ funded account စွမ်းဆောင်ရည်ကို မြှင့်တင်ရန် ကျွန်ုပ်တို့၏ mentorship တွင် ပါဝင်လိုက်ပါ။'}
              </p>
              
              <Link to="/campus" className="inline-flex items-center gap-3 px-6 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-900 transition-all group/btn relative overflow-hidden">
                <Ripple color="rgba(255, 255, 255, 0.2)" />
                <span className="relative z-10 flex items-center gap-3">
                  {lang === 'en' ? 'Access Campus' : 'Campus သို့သွားရန်'}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.5}>
            <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">
                {lang === 'en' ? 'Knowledge Statistics' : 'ဗဟုသုတစာရင်းဇယား'}
              </h4>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{lang === 'en' ? 'Total Lessons' : 'စုစုပေါင်း သင်ခန်းစာ'}</span>
                  <span className="text-sky-500 font-black">{QA_TRANSLATIONS.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{lang === 'en' ? 'Active Mentors' : 'တက်ကြွသော ဆရာများ'}</span>
                  <span className="text-sky-500 font-black">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{lang === 'en' ? 'Languages' : 'ဘာသာစကား'}</span>
                  <span className="text-sky-500 font-black">Eng / MM</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
