/**
 * Mock Supabase client for development
 * In production, this would be replaced with actual Supabase integration
 */

// Mock Supabase client
export const supabase = {
  auth: {
    getUser: async () => ({ 
      data: { user: null }, 
      error: null 
    }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({
      data: { session: null },
      error: null
    })
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({
          limit: () => ({
            data: [],
            error: null
          })
        })
      })
    }),
    insert: () => ({
      data: null,
      error: null
    }),
    update: () => ({
      eq: () => ({
        data: null,
        error: null
      })
    })
  })
}; 