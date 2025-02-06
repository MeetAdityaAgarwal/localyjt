
// import { execSync } from 'child_process';
import { execSync } from 'child_process';
import { prisma } from './lib/prisma';
// import dotenv from 'dotenv';
import { beforeAll, afterAll, afterEach } from 'vitest';

// dotenv.config({ path: '.env.test' });  // Load test environment variables

beforeAll(async () => {

  console.log('Inside BeforeAll...');
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' });


  // console.log('Running migrations...');
  // execSync('npx prisma migrate dev', { stdio: 'inherit' });
  //
  console.log('Seeding the database...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

});

afterEach(async () => {
  console.log('Inside afterEach()....')
  // console.log('Cleaning up database...');
  // const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
  //   `SELECT tablename FROM pg_tables WHERE schemaname='public';`
  // );
  //
  // for (const { tablename } of tables) {
  //   if (tablename !== '_prisma_migrations') {
  //     await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
  //   }
  // }
});

afterAll(async () => {
  console.log('Disconnecting Prisma...');
  await prisma.$disconnect();
});
