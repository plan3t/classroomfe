import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const items = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    order: 1,
    translations: {
      DE: { label: 'Apfel', alternatives: ['Äpfel'] },
      EN: { label: 'Apple', alternatives: ['Apples'] },
      FR: { label: 'Pomme', alternatives: ['Pommes'] },
      ES: { label: 'Manzana', alternatives: ['Manzanas'] },
    },
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1576186726115-4d51596775d1?auto=format&fit=crop&w=600&q=80',
    order: 2,
    translations: {
      DE: { label: 'Brot', alternatives: ['Laib Brot'] },
      EN: { label: 'Bread', alternatives: ['Loaf of bread'] },
      FR: { label: 'Pain', alternatives: ['Baguette'] },
      ES: { label: 'Pan', alternatives: ['Barra de pan'] },
    },
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    order: 3,
    translations: {
      DE: { label: 'Milch', alternatives: [] },
      EN: { label: 'Milk', alternatives: [] },
      FR: { label: 'Lait', alternatives: [] },
      ES: { label: 'Leche', alternatives: [] },
    },
  },
];

async function main() {
  for (const item of items) {
    await prisma.item.upsert({
      where: { topic_order: { topic: 'SUPERMARKET', order: item.order } },
      update: {
        imageUrl: item.imageUrl,
        translations: {
          deleteMany: {},
          create: Object.entries(item.translations).map(([language, value]) => ({
            language: language as 'DE' | 'EN' | 'FR' | 'ES',
            label: value.label,
            alternatives: value.alternatives,
          })),
        },
      },
      create: {
        topic: 'SUPERMARKET',
        imageUrl: item.imageUrl,
        order: item.order,
        translations: {
          create: Object.entries(item.translations).map(([language, value]) => ({
            language: language as 'DE' | 'EN' | 'FR' | 'ES',
            label: value.label,
            alternatives: value.alternatives,
          })),
        },
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
