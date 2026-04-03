import { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedChannels(prisma: PrismaClient) {
  const channels = [
    {
      name: 'Feeti Music',
      slug: 'feeti-music',
      description: 'La chaîne dédiée à la musique africaine — concerts, showcases, sessions acoustiques.',
      category: 'Musique',
      isActive: true,
      subscriberCount: 12400,
      eventCount: 38,
      country: 'CG',
    },
    {
      name: 'Feeti Sport',
      slug: 'feeti-sport',
      description: 'Matchs en direct, analyses tactiques et talk-shows sportifs.',
      category: 'Sport',
      isActive: true,
      subscriberCount: 28700,
      eventCount: 95,
      country: 'CI',
    },
    {
      name: 'Feeti Cinéma',
      slug: 'feeti-cinema',
      description: 'Films africains, documentaires et courts-métrages primés.',
      category: 'Cinema',
      isActive: true,
      subscriberCount: 8600,
      eventCount: 52,
      country: 'CD',
    },
    {
      name: 'Feeti Business',
      slug: 'feeti-business',
      description: 'Conférences, webinaires et formations professionnelles.',
      category: 'Business',
      isActive: true,
      subscriberCount: 5300,
      eventCount: 24,
      country: 'GA',
    },
    {
      name: 'Feeti Art',
      slug: 'feeti-art',
      description: 'Expositions virtuelles, performances artistiques et ateliers créatifs.',
      category: 'Art',
      isActive: true,
      subscriberCount: 3100,
      eventCount: 17,
      country: 'CG',
    },
  ];

  const created: Record<string, { id: string }> = {};

  for (const channel of channels) {
    const result = await prisma.channel.upsert({
      where: { slug: channel.slug },
      update: { subscriberCount: channel.subscriberCount, eventCount: channel.eventCount },
      create: channel,
    });
    created[channel.slug] = result;
  }

  console.log('✅ Chaînes seedées :', channels.length);
  return created;
}
