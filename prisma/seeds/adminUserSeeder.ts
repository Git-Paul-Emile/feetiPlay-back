import { PrismaClient } from '../../src/generated/prisma/client.js';
import bcrypt from 'bcrypt';

export async function seedAdminUsers(prisma: PrismaClient) {
  const admins = [
    {
      name: 'Super Administrateur',
      email: 'superadmin@feetiplay.com',
      password: 'Super@123',
      role: 'super_admin' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
    },
    {
      name: 'Administrateur',
      email: 'admin@feetiplay.com',
      password: 'Admin@123',
      role: 'admin' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
    {
      name: 'Modérateur',
      email: 'moderator@feetiplay.com',
      password: 'Mod@123',
      role: 'moderator' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator',
    },
    {
      name: 'Responsable Finance',
      email: 'finance@feetiplay.com',
      password: 'Finance@123',
      role: 'finance' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=finance',
    },
    {
      name: 'Responsable Marketing',
      email: 'marketing@feetiplay.com',
      password: 'Marketing@123',
      role: 'marketing' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marketing',
    },
  ];

  for (const { password, ...data } of admins) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.adminUser.upsert({
      where: { email: data.email },
      update: {},
      create: { ...data, passwordHash },
    });
  }

  console.log('✅ Admins seedés :', admins.length);
  console.log('   superadmin@feetiplay.com / Super@123');
  console.log('   admin@feetiplay.com      / Admin@123');
  console.log('   moderator@feetiplay.com  / Mod@123');
  console.log('   finance@feetiplay.com    / Finance@123');
  console.log('   marketing@feetiplay.com  / Marketing@123');
}
