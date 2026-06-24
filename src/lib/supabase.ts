import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'https://your-project.supabase.co' && 
                      !supabaseUrl.includes('placeholder');

if (!isConfigured) {
  console.warn('Supabase credentials missing or invalid. Using robust local mock database client to prevent network fetch failures.');
}

const createMockSupabase = () => {
  const makeChainedProxy = (isSingle = false): any => {
    const dummyPromise = Promise.resolve({ data: isSingle ? null : [], error: null });
    const target = () => {};
    (target as any).then = (onfulfilled: any) => dummyPromise.then(onfulfilled);
    (target as any).catch = (onrejected: any) => dummyPromise.catch(onrejected);
    
    return new Proxy(target, {
      get(t, prop) {
        if (prop === 'then' || prop === 'catch') {
          return (target as any)[prop as any];
        }
        if (prop === 'subscribe') {
          return () => ({ unsubscribe: () => {} });
        }
        if (prop === 'on') {
          return () => makeChainedProxy(isSingle);
        }
        const nextIsSingle = isSingle || prop === 'maybeSingle' || prop === 'single';
        return makeChainedProxy(nextIsSingle);
      },
      apply() {
        return makeChainedProxy(isSingle);
      }
    });
  };

  const mockAuth = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => callback('SIGNED_OUT', null), 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: () => Promise.resolve({ error: null })
  };

  const mockStorage = {
    from: () => ({
      download: () => Promise.resolve({ data: null, error: new Error("Supabase is not configured.") }),
      upload: () => Promise.resolve({ data: null, error: new Error("Supabase is not configured.") }),
      getPublicUrl: () => ({ data: { publicUrl: "" } })
    })
  };

  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'auth') return mockAuth;
      if (prop === 'storage') return mockStorage;
      if (prop === 'channel') {
        return () => ({
          on: () => ({
            subscribe: () => ({ unsubscribe: () => {} })
          }),
          subscribe: () => ({ unsubscribe: () => {} })
        });
      }
      if (prop === 'from') {
        return () => makeChainedProxy(false);
      }
      return makeChainedProxy(false);
    }
  }) as any;
};

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    })
  : createMockSupabase();

