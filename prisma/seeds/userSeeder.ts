import { PrismaClient } from '../../src/generated/prisma/client.js';
import bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  const users = [
    {
      name: 'Kouassi Jean',
      email: 'viewer@feetiplay.com',
      password: 'Viewer@123',
      role: 'viewer' as const,
      subscriptionPlan: 'free' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
    },
    {
      name: 'Aminata Diallo',
      email: 'premium@feetiplay.com',
      password: 'Premium@123',
      role: 'premium' as const,
      subscriptionPlan: 'premium' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=premium',
    },
    {
      name: 'Thierry Nguema',
      email: 'streamer@feetiplay.com',
      password: 'Streamer@123',
      role: 'streamer' as const,
      subscriptionPlan: 'vip' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=streamer',
    },
  ];

  for (const { password, ...data } of users) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: { ...data, passwordHash },
    });
  }

  console.log('✅ Utilisateurs seedés :', users.length);
  console.log('   viewer@feetiplay.com   / Viewer@123   (free)');
  console.log('   premium@feetiplay.com  / Premium@123  (premium)');
  console.log('   streamer@feetiplay.com / Streamer@123 (vip)');
}
