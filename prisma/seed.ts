import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedChannels } from './seeds/channelSeeder.js';
import { seedEvents } from './seeds/eventSeeder.js';
import { seedUsers } from './seeds/userSeeder.js';
import { seedAdminUsers } from './seeds/adminUserSeeder.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding FeetiPlay...\n');

  await seedUsers(prisma);
  await seedAdminUsers(prisma);
  const channelIds = await seedChannels(prisma);
  await seedEvents(prisma, channelIds);

  console.log('\n🎉 Seeding FeetiPlay terminé !');
  console.log('\nAPI démarrée sur : http://localhost:8001');
  console.log('Health check    : http://localhost:8001/api/health');
}

main()
  .catch(e => { console.error('❌ Erreur seeding:', e); throw e; })
  .finally(async () => { await prisma.$disconnect(); });
