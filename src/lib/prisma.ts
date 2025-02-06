import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaOptions = {
  datasources: {
    db: {
      url: process.env.NODE_ENV === 'test'
        ? process.env.TEST_DATABASE_URL
        : process.env.DATABASE_URL,
    },
  },
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (!process.env.TEST_DATABASE_URL || !process.env.DATABASE_URL) {
  throw new Error('Database URL is not set in the environment variables.');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
