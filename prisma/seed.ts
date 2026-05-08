import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Fresh Jewellery Seed (Verified Images) ---');

  // 1. CLEANUP: Delete everything in correct order to avoid relation errors
  console.log('Cleaning up existing data...');
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  console.log('Cleanup complete.');

  // 2. Create/Find a Vendor
  const hashedPassword = await bcrypt.hash('password123', 10);
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      name: 'Shoukhin Jewellery House',
      email: 'vendor@example.com',
      password: hashedPassword,
      role: Role.VENDOR,
      isActive: true,
    },
  });

  // These are high-stability jewellery-specific photo IDs from Unsplash
  const verifiedJewelleryIds = [
    '1617038220319-276d3cfab638', '1605100804763-247f67b3557e', '1573408339371-c96645b272ec',
    '1611085583191-a3b1f18a5941', '1599643478518-a784e5dc4c8f', '1602173574767-37ac01994b2a',
    '1635767798638-3e2827bead9c', '1601121141461-9d6647bca1ed', '1515562141207-7a88fb7ce338',
    '1608042314453-ae338d80c427', '1596649299486-4cdea572685d', '1512163143273-bde0e3cc7407',
    '1603561591413-abb620301f60', '1590548784585-64f627cf7532', '1535632066927-ab7c9ab60908',
    '1626784215021-2e39ac50b550', '1589128777073-263566ae5e4d', '1509190500511-30df5c16a74c',
    '1588891823055-6c7f1e042222', '1506630448388-4e683c67ddb0'
  ];

  const getUnsplashUrl = (id: string, width = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;

  // 3. Define 10 Premium Jewellery Categories
  const categoriesData = [
    { name: 'Diamond Rings', slug: 'diamond-rings' },
    { name: 'Luxury Necklaces', slug: 'luxury-necklaces' },
    { name: 'Statement Earrings', slug: 'statement-earrings' },
    { name: 'Gold Bracelets', slug: 'gold-bracelets' },
    { name: 'Wedding Bands', slug: 'wedding-bands' },
    { name: 'Fine Pendants', slug: 'fine-pendants' },
    { name: 'Bridal Sets', slug: 'bridal-sets' },
    { name: 'Pearl Collection', slug: 'pearl-collection' },
    { name: 'Gemstone Treasures', slug: 'gemstone-treasures' },
    { name: 'Vintage Brooches', slug: 'vintage-brooches' },
  ];

  const categories: any[] = [];
  for (let i = 0; i < categoriesData.length; i++) {
    const photoId = verifiedJewelleryIds[i % verifiedJewelleryIds.length];
    const category = await prisma.category.create({
      data: {
        ...categoriesData[i],
        imageUrl: getUnsplashUrl(photoId, 600),
      },
    });
    categories.push(category);
  }
  console.log('10 Jewellery Categories created.');

  // 4. Create 100 Products (10 per category)
  const adjectives = ['Imperial', 'Majestic', 'Timeless', 'Celestial', 'Radiant', 'Opulent', 'Grand', 'Eternal', 'Divine', 'Royal'];
  const materials = ['22K Gold', 'Solid Platinum', 'White Gold', 'Pure Silver', 'Rose Gold', 'Italian Gold', 'Premium Pearl', 'Natural Diamond', 'Hand-polished', 'Gem-encrusted'];

  let totalProducts = 0;
  for (const category of categories) {
    for (let j = 1; j <= 10; j++) {
      const adj = adjectives[(totalProducts + j) % adjectives.length];
      const mat = materials[(totalProducts + j) % materials.length];
      
      const productName = `${adj} ${mat} ${category.name.replace('s', '')} ${j}`;
      const productSlug = `${category.slug}-item-${totalProducts + j}`;

      // Cycle through verified IDs to ensure all images are valid
      const productImages = [
        getUnsplashUrl(verifiedJewelleryIds[(totalProducts * 4) % verifiedJewelleryIds.length]),
        getUnsplashUrl(verifiedJewelleryIds[(totalProducts * 4 + 1) % verifiedJewelleryIds.length]),
        getUnsplashUrl(verifiedJewelleryIds[(totalProducts * 4 + 2) % verifiedJewelleryIds.length]),
        getUnsplashUrl(verifiedJewelleryIds[(totalProducts * 4 + 3) % verifiedJewelleryIds.length]),
      ];

      await prisma.product.create({
        data: {
          name: productName,
          slug: productSlug,
          description: `Experience the allure of the ${productName}. This exquisite piece from our ${category.name} collection features ${mat.toLowerCase()} craftsmanship and a ${adj.toLowerCase()} finish, designed for the most discerning connoisseurs of fine jewellery.`,
          price: Math.floor(Math.random() * 15000) + 1200,
          stock: Math.floor(Math.random() * 50) + 10,
          images: productImages,
          categoryId: category.id,
          vendorId: vendor.id,
          isPublished: true,
        },
      });
      totalProducts++;
    }
  }

  console.log(`${totalProducts} Jewellery Products created successfully (10 per category).`);
  console.log('--- Seeding Process Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
