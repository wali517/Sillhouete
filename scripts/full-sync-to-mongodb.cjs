const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function run() {
  console.log('🚀 Starting Full Data Migration to MongoDB Atlas...');

  // 1. Read MongoDB connection URI
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (!match) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  const uri = match[1].trim().replace(/^['"]|['"]$/g, '');

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas successfully.');

  const db = mongoose.connection.db;

  // 2. Load products and COLLECTION_HANDLES from src/data/products.ts
  console.log('Loading products from src/data/products.ts...');
  let prodCode = fs.readFileSync('src/data/products.ts', 'utf8');
  prodCode = prodCode.replace(/import\s+type\s+[^;]+;/g, '');
  prodCode = prodCode.replace(/:\s*Product\[\]/g, '');
  prodCode = prodCode.replace(/:\s*Record<string,\s*string\[\]>/g, '');
  prodCode = prodCode.replace(/export\s+const\s+/g, 'exports.');
  prodCode = prodCode.replace(/export\s+const\s+getProduct\s*=[^;]+;/g, '');
  prodCode = prodCode.replace(/const\s+byHandle\s*=[^;]+;[\s\S]*$/g, '');

  const prodSandbox = { exports: {}, console };
  vm.createContext(prodSandbox);
  vm.runInContext(prodCode, prodSandbox);

  const allProducts = prodSandbox.exports.allProducts || [];
  const collectionHandles = prodSandbox.exports.COLLECTION_HANDLES || {};

  console.log(`Loaded ${allProducts.length} products and ${Object.keys(collectionHandles).length} collections.`);

  // Build product-to-collections reverse map
  const productCollectionsMap = new Map();
  for (const [colSlug, handles] of Object.entries(collectionHandles)) {
    for (const h of handles) {
      if (!productCollectionsMap.has(h)) {
        productCollectionsMap.set(h, new Set());
      }
      productCollectionsMap.get(h).add(colSlug);
    }
  }

  // Ensure primary category collections are also added
  for (const p of allProducts) {
    if (!productCollectionsMap.has(p.handle)) {
      productCollectionsMap.set(p.handle, new Set());
    }
    const cat = (p.category || '').toLowerCase();
    if (cat.includes('formal')) {
      productCollectionsMap.get(p.handle).add('formal-dresses');
    }
    if (cat.includes('pret') || cat.includes('luxury')) {
      productCollectionsMap.get(p.handle).add('luxury-pret');
    }
  }

  // 3. Upsert products into MongoDB
  console.log('Upserting all 159 products into MongoDB products collection...');
  let prodCount = 0;
  for (const p of allProducts) {
    const colSet = productCollectionsMap.get(p.handle) || new Set();
    const collections = Array.from(colSet);

    const fullDoc = {
      id: String(p.id || p.handle),
      handle: p.handle,
      title: p.title,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      priceFrom: Boolean(p.priceFrom),
      image: p.image || '',
      hoverImage: p.hoverImage || p.image || '',
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image, p.hoverImage].filter(Boolean),
      alt: p.alt || p.title,
      ratio: p.ratio || 1.5,
      isNew: Boolean(p.isNew),
      isSale: Boolean(p.isSale),
      isBestSeller: Boolean(p.isBestSeller || collections.includes('best-sellers')),
      category: p.category || (p.handle.includes('formal') || p.handle.includes('rm') ? 'Formal' : 'Luxury Pret'),
      description: p.description || `${p.alt || p.title}. Crafted from premium fabrics with bespoke hand embroidery, fine zardozi detailing, and artisanal tailoring.`,
      inStock: p.inStock !== false,
      sizes: p.sizes || ['XS', 'S', 'M', 'L', 'XL'],
      fabric: p.fabric || 'Pure Silk / Chiffon',
      sku: p.sku || `SLH-${p.handle.toUpperCase()}`,
      color: p.color || '',
      dupattaOptions: p.dupattaOptions || [],
      adOnOptions: p.adOnOptions || [],
      variants: p.variants || [],
      collections: collections,
      updatedAt: new Date(),
    };

    await db.collection('products').updateOne(
      { handle: p.handle },
      { $set: fullDoc },
      { upsert: true }
    );
    prodCount++;
  }
  console.log(`✅ Upserted ${prodCount} products with full descriptions, images, variants, and collection tags.`);

  // 4. Load & Upsert blogs from src/data/seed-blogs.ts
  console.log('Loading blogs from src/data/seed-blogs.ts...');
  let blogCode = fs.readFileSync('src/data/seed-blogs.ts', 'utf8');
  blogCode = blogCode.replace(/import\s+type\s+[^;]+;/g, '');
  blogCode = blogCode.replace(/:\s*BlogPost\[\]/g, '');
  blogCode = blogCode.replace(/export\s+const\s+SEED_BLOGS/g, 'exports.SEED_BLOGS');

  const blogSandbox = { exports: {}, console };
  vm.createContext(blogSandbox);
  vm.runInContext(blogCode, blogSandbox);

  const blogs = blogSandbox.exports.SEED_BLOGS || [];
  console.log(`Loaded ${blogs.length} blog posts. Upserting into MongoDB blogposts collection...`);

  for (const b of blogs) {
    const blogDoc = {
      id: b.id || `blog-${b.slug}`,
      slug: b.slug,
      title: b.title,
      excerpt: b.excerpt || '',
      content: b.content || '',
      coverImage: b.coverImage || '',
      author: b.author || 'Sillhouete Editorial',
      publishedAt: b.publishedAt || new Date().toISOString().split('T')[0],
      category: b.category || 'Fashion & Style',
      tags: b.tags || ['Pakistani Fashion', 'Designer Wear', 'Bridal', 'Luxury'],
      readTime: b.readTime || '5 min read',
      updatedAt: new Date(),
    };

    await db.collection('blogposts').updateOne(
      { slug: b.slug },
      { $set: blogDoc },
      { upsert: true }
    );
  }
  console.log(`✅ Upserted ${blogs.length} blog posts into blogposts collection.`);

  // 5. Load & Upsert collection descriptions into collections collection
  console.log('Loading collection descriptions from src/data/collection-descriptions.ts...');
  let colCode = fs.readFileSync('src/data/collection-descriptions.ts', 'utf8');
  colCode = colCode.replace(/export\s+const\s+COLLECTION_DESCRIPTIONS\s*:\s*Record<string,\s*string>\s*=/g, 'exports.COLLECTION_DESCRIPTIONS =');

  const colSandbox = { exports: {}, console };
  vm.createContext(colSandbox);
  vm.runInContext(colCode, colSandbox);

  const collectionDescriptions = colSandbox.exports.COLLECTION_DESCRIPTIONS || {};
  const allCollectionSlugs = new Set([
    ...Object.keys(collectionHandles),
    ...Object.keys(collectionDescriptions)
  ]);

  console.log(`Found ${allCollectionSlugs.size} unique collection slugs. Upserting into collections collection...`);
  for (const slug of allCollectionSlugs) {
    const title = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace(/(\d+)/g, "'$1");

    const desc = collectionDescriptions[slug] || '';
    const handles = collectionHandles[slug] || [];

    await db.collection('collections').updateOne(
      { handle: slug },
      {
        $set: {
          handle: slug,
          title: title,
          description: desc,
          productCount: handles.length,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );
  }
  console.log(`✅ Upserted ${allCollectionSlugs.size} collections into collections collection.`);

  // 6. Update sitesettings with store information
  console.log('Updating sitesettings in MongoDB...');
  await db.collection('sitesettings').updateOne(
    {},
    {
      $set: {
        storeName: 'Sillhouete',
        title: 'Shop Pakistani Designer Dresses for Women Online – Sillhouete',
        description: 'Shop Pakistan designer dresses for women at Sillhouete. Explore bridal dresses, luxury formals, and elegant ready-to-wear outfits with worldwide delivery.',
        email: 'info@sillhouete.com',
        phone: '+92 331 0397865',
        whatsapp: '+923310397865',
        studioAddress: 'Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore',
        officeAddress: '327-B, Street 7, Lane 15, Cavalry Ground, Lahore',
        usaOfficeAddress: 'ADVENT BUSINESS CONSULTAX LLC, 18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181',
        logo: 'https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png?v=1744702089',
        announcements: [
          'FREE SHIPPING ALL OVER WORLD ON $500 AND ABOVE ORDERS',
          'WE OFFER WORLDWIDE SHIPPING.',
          'FOR BOOKINGS: 03154204981 / 03310397865',
        ],
        freeShippingThreshold: 140000,
        standardShippingFee: 250,
        currency: 'PKR',
        adminEmail: 'admin@sillhouete.com',
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log('✅ Site settings updated in MongoDB.');

  // Verify counts
  const finalProducts = await db.collection('products').countDocuments();
  const finalBlogs = await db.collection('blogposts').countDocuments();
  const finalCollections = await db.collection('collections').countDocuments();
  const finalSettings = await db.collection('sitesettings').countDocuments();

  console.log('\n==========================================');
  console.log('🎉 MONGODB DATA MIGRATION SUMMARY:');
  console.log(` - Products in MongoDB: ${finalProducts}`);
  console.log(` - Blog Posts in MongoDB: ${finalBlogs}`);
  console.log(` - Collections in MongoDB: ${finalCollections}`);
  console.log(` - Site Settings in MongoDB: ${finalSettings}`);
  console.log('==========================================\n');

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
