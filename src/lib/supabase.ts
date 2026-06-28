import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = !!(supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'https://your-project.supabase.co' && 
                      supabaseUrl !== 'YOUR_SUPABASE_URL' &&
                      supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
                      !supabaseUrl.includes('placeholder'));

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

export async function wakeUpSupabase(retries = 3, delayMs = 2000): Promise<{ success: boolean; error?: any }> {
  if (!isConfigured) {
    return { success: true };
  }
  
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Supabase ping attempt ${attempt} of ${retries}...`);
      const pingUrl = `${supabaseUrl}/rest/v1/`;
      const headers: Record<string, string> = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      };
      
      const res = await fetch(pingUrl, { method: 'GET', headers });
      if (res.ok) {
        console.log(`Supabase keep-alive ping success on attempt ${attempt} via REST endpoint`);
        return { success: true };
      }
    } catch (err) {
      console.warn(`REST ping attempt ${attempt} failed:`, err);
      lastError = err;
    }

    try {
      const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      if (!error) {
        console.log(`Supabase keep-alive ping success on attempt ${attempt} via profiles query`);
        return { success: true };
      }
      console.warn(`Select query attempt ${attempt} returned error:`, error);
      lastError = error;
    } catch (err) {
      console.warn(`Select query attempt ${attempt} failed:`, err);
      lastError = err;
    }

    if (attempt < retries) {
      console.log(`Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { success: false, error: lastError || new Error("All ping attempts failed. Supabase is likely asleep or paused.") };
}

