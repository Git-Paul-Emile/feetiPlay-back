import { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedEvents(prisma: PrismaClient, channelIds: Record<string, { id: string }>) {
  const music   = channelIds['feeti-music']!.id;
  const sport   = channelIds['feeti-sport']!.id;
  const cinema  = channelIds['feeti-cinema']!.id;
  const business = channelIds['feeti-business']!.id;
  const art     = channelIds['feeti-art']!.id;

  const events = [
    {
      title: 'AFRO JEMBE JAIYE',
      description: 'Grand concert de musique afro live depuis Brazzaville. Une soirée inoubliable avec les meilleurs artistes.',
      date: '2025-09-15',
      time: '20:00',
      duration: '3h00',
      image: '',
      channelId: music,
      channelName: 'Feeti Music',
      category: 'Concert',
      tags: JSON.stringify(['afro', 'live', 'musique']),
      isLive: true,
      isReplay: false,
      isFeatured: true,
      isFree: false,
      price: 12000,
      currency: 'FCFA',
      viewerCount: 1240,
    },
    {
      title: 'Champions League Live',
      description: 'Suivez le match en direct PSG vs Real Madrid depuis Paris. Commentaires en français.',
      date: '2025-09-20',
      time: '21:00',
      duration: '2h00',
      image: '',
      channelId: sport,
      channelName: 'Feeti Sport',
      category: 'Sport',
      tags: JSON.stringify(['football', 'ligue des champions', 'live']),
      isLive: false,
      isReplay: false,
      isFeatured: true,
      isFree: true,
      currency: 'FCFA',
      viewerCount: 5800,
    },
    {
      title: 'Festival Cinéma Africain',
      description: "Projection des meilleurs films africains de l'année. Séance de questions-réponses avec les réalisateurs.",
      date: '2025-08-30',
      time: '18:00',
      duration: '4h00',
      image: '',
      channelId: cinema,
      channelName: 'Feeti Cinéma',
      category: 'Cinema',
      tags: JSON.stringify(['cinéma', 'africa', 'culture']),
      isLive: false,
      isReplay: true,
      isFeatured: false,
      isFree: false,
      price: 5000,
      currency: 'FCFA',
      viewerCount: 340,
    },
    {
      title: 'Conférence Tech Africa 2025',
      description: 'Les innovations technologiques en Afrique. Intervenants de 12 pays.',
      date: '2025-10-05',
      time: '09:00',
      duration: '8h00',
      image: '',
      channelId: business,
      channelName: 'Feeti Business',
      category: 'Conférence',
      tags: JSON.stringify(['tech', 'innovation', 'business']),
      isLive: false,
      isReplay: false,
      isFeatured: false,
      isFree: false,
      price: 15000,
      currency: 'FCFA',
      viewerCount: 0,
    },
    {
      title: 'Art Show Kinshasa',
      description: 'Exposition virtuelle des artistes plasticiens de Kinshasa.',
      date: '2025-09-10',
      time: '15:00',
      duration: '2h00',
      image: '',
      channelId: art,
      channelName: 'Feeti Art',
      category: 'Art',
      tags: JSON.stringify(['art', 'exposition', 'culture']),
      isLive: false,
      isReplay: true,
      isFeatured: false,
      isFree: true,
      currency: 'FCFA',
      viewerCount: 220,
    },
  ];

  for (const event of events) {
    await prisma.streamingEvent.upsert({
      where: { id: (await prisma.streamingEvent.findFirst({ where: { title: event.title } }))?.id ?? 'none' },
      update: { viewerCount: event.viewerCount },
      create: event,
    });
  }

  console.log('✅ Événements seedés :', events.length);
}
