
import { main as seedData } from '../prisma/seed';
import { execSync } from 'child_process';

export default async function setup() {
  // Reset the database
  // await prisma.$executeRaw`TRUNCATE TABLE "User", "Customer", "Collection", "Invoice", "Transfer" CASCADE`;
  execSync('NODE_ENV=test npx prisma migrate reset --force', { stdio: 'inherit' });


  // Seed the database
  await seedData(); // Call your seed function here
}
