import { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedChannels(prisma: PrismaClient) {
  const channels = [
    {
      name: 'Feeti Music',
      slug: 'feeti-music',
      description: 'La chaine dediee a la musique africaine avec concerts, showcases et sessions acoustiques.',
      logo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
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
      logo: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
      category: 'Sport',
      isActive: true,
      subscriberCount: 28700,
      eventCount: 95,
      country: 'CI',
    },
    {
      name: 'Feeti Cinema',
      slug: 'feeti-cinema',
      description: 'Films africains, documentaires et courts-metrages primes.',
      logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema',
      isActive: true,
      subscriberCount: 8600,
      eventCount: 52,
      country: 'CD',
    },
    {
      name: 'Feeti Business',
      slug: 'feeti-business',
      description: 'Conferences, webinaires et formations professionnelles.',
      logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      category: 'Business',
      isActive: true,
      subscriberCount: 5300,
      eventCount: 24,
      country: 'GA',
    },
    {
      name: 'Feeti Art',
      slug: 'feeti-art',
      description: 'Expositions virtuelles, performances artistiques et ateliers creatifs.',
      logo: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
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
      update: {
        name: channel.name,
        description: channel.description,
        logo: channel.logo,
        coverImage: channel.coverImage,
        category: channel.category,
        isActive: channel.isActive,
        subscriberCount: channel.subscriberCount,
        eventCount: channel.eventCount,
        country: channel.country,
      },
      create: channel,
    });
    created[channel.slug] = result;
  }

  console.log('Channels seeded:', channels.length);
  return created;
}
