import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    // Return a mock client for build time
    if (typeof window === 'undefined') {
      return {
        from: () => ({
          select: () => ({ 
            eq: () => ({ 
              single: () => Promise.resolve({ data: null, error: null }),
              order: () => Promise.resolve({ data: [], error: null })
            }) 
          }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        })
      };
    }
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};

// Create a proxy object that delegates to getSupabaseClient()
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop];
  }
});