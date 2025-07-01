// Mock Prisma client for build compatibility
// This provides sample data for development and avoids database connection issues during build
const mockPrisma = {
  $queryRaw: async (query: any, ...params: any[]) => {
    // Mock product data for product insights
    if (query.toString().includes('Product') && query.toString().includes('total_revenue')) {
      return [
        {
          id: '1',
          name: 'Premium Wireless Headphones',
          sku: 'PWH-001',
          category: 'Electronics',
          total_revenue: 15000,
          units_sold: 50,
          avg_price: 300,
          profit_margin: 25,
          performance_score: 85
        },
        {
          id: '2',
          name: 'Organic Cotton T-Shirt',
          sku: 'OCT-002',
          category: 'Apparel',
          total_revenue: 8000,
          units_sold: 200,
          avg_price: 40,
          profit_margin: 35,
          performance_score: 75
        },
        {
          id: '3',
          name: 'Smart Water Bottle',
          sku: 'SWB-003',
          category: 'Lifestyle',
          total_revenue: 5000,
          units_sold: 100,
          avg_price: 50,
          profit_margin: 30,
          performance_score: 65
        }
      ]
    }
    
    // Mock trend data
    if (query.toString().includes('DATE(o.created_at)')) {
      const dates = []
      const today = new Date()
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        dates.push({
          date: date,
          revenue: Math.floor(Math.random() * 1000) + 500,
          units: Math.floor(Math.random() * 20) + 5
        })
      }
      return dates
    }
    
    // Mock previous period data
    if (query.toString().includes('previous')) {
      return [
        { id: '1', total_revenue: 12000, units_sold: 40 },
        { id: '2', total_revenue: 6000, units_sold: 150 },
        { id: '3', total_revenue: 3000, units_sold: 60 }
      ]
    }
    
    return []
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
};

const prisma = mockPrisma;

export default prisma;