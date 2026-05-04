import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Comprehensive Jewellery database with 5 products per category...');

  // 1. Create a Vendor
  const hashedPassword = await bcrypt.hash('password123', 10);
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      name: 'Elite Jewellery Merchant',
      email: 'vendor@example.com',
      password: hashedPassword,
      role: Role.VENDOR,
      isActive: true,
    },
  });

  console.log(`Vendor created/found: ${vendor.email}`);

  // Curated list of high-quality, verified Unsplash Jewellery Photo IDs
  const jewelleryPhotoIds = [
    '1515562141207-7a88fb7ce338',
    '1573408339371-c96645b272ec',
    '1535632066927-ab7c9ab60908',
    '1599643478518-a784e5dc4c8f',
    '1601121141461-9d6647bca1ed',
    '1602173574767-37ac01994b2a',
    '1605100804763-247f67b3557e',
    '1617038220319-276d3cfab638',
    '1589128777073-263566ae5e4d',
    '1509190500511-30df5c16a74c',
    '1611085583191-a3b1f18a5941',
    '1611591437281-460bfbe1220a',
    '1598560917505-59a3ad559071',
    '1596944210900-30523196cff6',
    '1506630448388-4e683c67ddb0',
    '1635767798638-3e2827bead9c',
    '1590548784585-64f627cf7532',
    '1626784215021-2e39ac50b550',
    '1588891823055-6c7f1e042222',
    '1603561591413-abb620301f60',
    '1512163143273-bde0e3cc7407',
    '1590548784585-64f627cf7532',
    '1608042314453-ae338d80c427',
    '1596649299486-4cdea572685d'
  ];

  const getUnsplashUrl = (id: string, width = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;

  // 2. Define 22 Jewellery-focused Categories
  const categoriesData = [
    { name: 'Rings', slug: 'rings' },
    { name: 'Necklaces', slug: 'necklaces' },
    { name: 'Earrings', slug: 'earrings' },
    { name: 'Bracelets', slug: 'bracelets' },
    { name: 'Anklets', slug: 'anklets' },
    { name: 'Pendants', slug: 'pendants' },
    { name: 'Brooches', slug: 'brooches' },
    { name: 'Watches', slug: 'watches' },
    { name: 'Jewellery Sets', slug: 'jewellery-sets' },
    { name: 'Luxury Collections', slug: 'luxury-collections' },
    { name: 'Engagement Rings', slug: 'engagement-rings' },
    { name: 'Wedding Bands', slug: 'wedding-bands' },
    { name: 'Gold Jewellery', slug: 'gold-jewellery' },
    { name: 'Silver Jewellery', slug: 'silver-jewellery' },
    { name: 'Diamond Jewellery', slug: 'diamond-jewellery' },
    { name: 'Gemstone Jewellery', slug: 'gemstone-jewellery' },
    { name: 'Pearl Jewellery', slug: 'pearl-jewellery' },
    { name: 'Vintage Jewellery', slug: 'vintage-jewellery' },
    { name: 'Minimalist Jewellery', slug: 'minimalist-jewellery' },
    { name: 'Custom Pieces', slug: 'custom-pieces' },
    { name: 'Men\'s Jewellery', slug: 'mens-jewellery' },
    { name: 'Children\'s Jewellery', slug: 'childrens-jewellery' },
  ];

  const categories: any[] = [];
  for (let idx = 0; idx < categoriesData.length; idx++) {
    const cat = categoriesData[idx];
    const photoId = jewelleryPhotoIds[idx % jewelleryPhotoIds.length];
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        imageUrl: getUnsplashUrl(photoId, 600),
      },
      create: {
        ...cat,
        imageUrl: getUnsplashUrl(photoId, 600),
      },
    });
    categories.push(category);
  }
  console.log(`${categoriesData.length} Jewellery Categories created/found.`);

  // 3. Create 5 products per category (Total 110 products)
  const jewelTypes = ['Gold', 'Silver', 'Diamond', 'Platinum', 'Rose Gold', 'Pearl', 'Emerald', 'Sapphire', 'Ruby', 'Topaz'];
  const jewelAdjectives = ['Elegant', 'Classic', 'Modern', 'Vintage', 'Minimalist', 'Luxurious', 'Handcrafted', 'Sparkling', 'Royal', 'Exquisite'];

  let productCount = 0;
  for (const category of categories) {
    for (let i = 1; i <= 5; i++) {
      const typeIdx = (productCount + i) % jewelTypes.length;
      const adjIdx = (productCount + i) % jewelAdjectives.length;
      const photoIdx1 = (productCount) % jewelleryPhotoIds.length;
      const photoIdx2 = (productCount + 3) % jewelleryPhotoIds.length;

      const type = jewelTypes[typeIdx];
      const adjective = jewelAdjectives[adjIdx];
      
      const productName = `${adjective} ${type} ${category.name.slice(0, -1) || category.name} ${i}`;
      const productSlug = `jewel-${category.slug}-item-${i}`;

      await prisma.product.upsert({
        where: { slug: productSlug },
        update: {
          name: productName,
          images: [getUnsplashUrl(jewelleryPhotoIds[photoIdx1]), getUnsplashUrl(jewelleryPhotoIds[photoIdx2])],
        },
        create: {
          name: productName,
          slug: productSlug,
          description: `This ${productName} is a masterpiece from our ${category.name} collection. Featuring a ${adjective.toLowerCase()} design and crafted from premium ${type.toLowerCase()}, it offers unparalleled elegance and sophistication.`,
          price: Math.floor(Math.random() * 8000) + 300,
          stock: Math.floor(Math.random() * 25) + 5,
          images: [getUnsplashUrl(jewelleryPhotoIds[photoIdx1]), getUnsplashUrl(jewelleryPhotoIds[photoIdx2])],
          categoryId: category.id,
          vendorId: vendor.id,
          isPublished: true,
        },
      });
      productCount++;
    }
  }

  console.log(`${productCount} Jewellery Products created (5 per category).`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
