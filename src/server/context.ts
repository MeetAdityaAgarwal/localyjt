import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { generateToken, verifyToken } from '../lib/auth';
import { prisma } from '../lib/prisma';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.split(' ')[1];
  console.log("🔹 Received Token:", token); // Debugging log
  const user = token ? await verifyToken(token) : null;

  // console.log("🔹 Decoded User:", user); // Check if this is null

  return {
    req,
    res,
    prisma,
    user,
  };
}
export function createTestContext(userId: string) {

  // Generate a valid token for the test user
  const token = generateToken(userId);

  // Mock the request and response objects
  const req = {
    headers: {
      authorization: `Bearer ${token}`, // Simulate a valid token for authentication
    },
    // ip: '127.0.0.1', // Simulate an IP address for audit logs
  } as any;

  const res = {} as any;

  // Call the actual createContext function with mocked req and res
  return createContext({ req, res } as CreateExpressContextOptions);
}

export type Context = inferAsyncReturnType<typeof createContext>;
export type ContextOptions = CreateExpressContextOptions
