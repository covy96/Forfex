import { supabase } from '@/lib/supabaseClient';

// Mappa nomi entità base44 → nomi tabelle Supabase
const TABLE_MAP = {
  UserProfile: 'user_profile',
  Income: 'income',
  Expense: 'expense',
  FiscalSettings: 'fiscal_settings',
  PaymentDeadline: 'payment_deadline',
};

function getTable(entityName) {
  return TABLE_MAP[entityName] || entityName.toLowerCase();
}

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

const makeEntityAdapter = (entityName) => {
  const table = getTable(entityName);
  return {
    filter: async (filters) => {
      let query = supabase.from(table).select('*');
      if (filters) {
        // Rimappa created_by email → created_by uuid se necessario
        const mappedFilters = { ...filters };
        if (mappedFilters.created_by && mappedFilters.created_by.includes('@')) {
          // è una email, la ignoriamo e usiamo RLS
          delete mappedFilters.created_by;
        }
        Object.entries(mappedFilters).forEach(([k, v]) => {
          query = query.eq(k, v);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    list: async () => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return data ?? [];
    },
    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (data) => {
      const userId = await getCurrentUserId();
      // Rimuovi created_by se è una email (eredità base44), usa UUID
      const { created_by, ...rest } = data;
      const { data: created, error } = await supabase
        .from(table)
        .insert([{ ...rest, created_by: userId }])
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    update: async (id, data) => {
      const { created_by, ...rest } = data;
      const { data: updated, error } = await supabase
        .from(table)
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
};

// auth.me viene aggiornato da AuthContext dopo il login
export const base44 = {
  auth: {
    me: null,
    redirectToLogin: () => {
      window.location.href = '/login';
    },
    logout: async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
    },
  },
  entities: new Proxy({}, {
    get: (_, entityName) => makeEntityAdapter(entityName),
  }),
};
