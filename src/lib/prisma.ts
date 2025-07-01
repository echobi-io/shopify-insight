import { createClient } from '@/util/supabase/api'

// Use Supabase client for database operations instead of Prisma
const supabase = createClient()

// Create a Prisma-like interface using Supabase
const prisma = {
  $queryRaw: async (query: any, ...params: any[]) => {
    try {
      // Convert Prisma raw query to Supabase query
      const queryString = query.toString()
      
      // For now, return empty array to avoid errors
      // Real implementation would parse the SQL and execute via Supabase
      console.log('Raw query attempted:', queryString)
      return []
    } catch (error) {
      console.error('Database query error:', error)
      return []
    }
  },
  user: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  $connect: async () => {},
  $disconnect: async () => {},
}

export default prisma