// Mock Prisma client for build compatibility
const mockPrisma = {
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

// Use mock for now to avoid database connection issues during build
const prisma = mockPrisma;

export default prisma;