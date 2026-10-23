/** Plain-English articles shown under a collection's products. */
export type Article = { heading: string; paragraphs: string[]; sub?: { heading: string; paragraphs: string[] }[] };

const SILK: Article[] = [
  {
    heading: "Silk Solids 26 luxury pret | shop online USA, UK, Canada",
    paragraphs: [
      "Tissue silk pret carries a quiet kind of luxury that heavily embellished outfits often miss. In the Silk Solids 26 collection, every outfit is fully stitched and finished in a solid colour with fine hand-set sequins. Each piece is made in Lahore and shipped to women across the USA, UK, Canada and beyond.",
      "Every outfit arrives ready to wear. No tailoring, no waiting and no guesswork on fit. Choose your colour and have it delivered straight to your door.",
    ],
  },
  {
    heading: "Tissue silk in Pakistani formal wear",
    paragraphs: [
      "Tissue silk is thin, slightly sheer and catches light from every angle. It drapes cleanly, does not feel stiff and stays comfortable across hours of wear. It is one of the most loved fabrics in Pakistani luxury pret because it looks as good in photographs as it does in person.",
    ],
  },
  {
    heading: "Hand-set sequins and surface detailing",
    paragraphs: [
      "Every shirt in Silk Solids 26 carries sequins set directly onto the silk. They sit flat, hold their position and do not catch on fabrics. Up close the detail is crisp. From across a room it reads as a clean, even shimmer.",
    ],
  },
  {
    heading: "Colours and styles in Silk Solids 26",
    paragraphs: ["Colour sets the tone of a formal evening before a single word is spoken. Before choosing a luxury pret suit on price alone, it helps to know which shade suits the occasion and which fabric holds up through a long evening."],
    sub: [
      { heading: "Light and cool tones for daytime and soft evenings", paragraphs: ["Mint green, light pink, light grey and aqua ombre sit in the cooler end of the palette. They work well for daytime functions, walima receptions and formal dinners. Noah in mint green and Zephyr in light pink are good choices for spring and summer events."] },
    ],
  },
  {
    heading: "Buying Silk Solids 26 online from USA, UK and Canada",
    paragraphs: [
      "Sillhouete ships Silk Solids 26 worldwide from Lahore. Orders above $500 qualify for free shipping. Our office in Illinois helps customers in America with local contact, and dispatch happens faster than for made-to-order collections.",
      "Buyers in the UK and Canada should check import duty rules before placing an order, as local customs may add charges on delivery. For bridal outfits, see our bridal dresses collection or browse Lumiere Luxury Formals 26 for heavier embellished options.",
    ],
  },
];

const BARAT: Article[] = [
  {
    heading: "Barat dresses for brides - the decisions that actually matter",
    paragraphs: [
      "Most brides spend three months choosing a barat dress and still feel uncertain on the day. Not because the options were bad, but because nobody told them what they were actually deciding between.",
      "A barat dress involves at least four separate trade-offs: colour, weight, silhouette and embroidery density. Sillhouete's barat collection is built around resolving those trade-offs, with traditional red and gold lehengas alongside softer, contemporary shades. Our collection suits a wide range of preferences, whether you want a classic wedding look or a modern one.",
    ],
  },
  {
    heading: "Why bridal wear is so popular abroad",
    paragraphs: [
      "Bridal wear has won clients in other countries, thereby increasing the number of women who value the fine craftsmanship of the designers. The ever-changing trend in fashion means the best fabric, material and embroidery are used. In addition, ready-to-wear bridal dresses are comfortable and easier to coordinate for destination weddings and events abroad.",
    ],
  },
];

const MEHNDI: Article[] = [
  {
    heading: "Mehndi dresses for brides - why this function deserves more",
    paragraphs: [
      "The mehndi is the one wedding function where the colour palette does the talking. Unlike the barat, there is no weight of formality, but that freedom is exactly what makes the mehndi dress decision harder than it looks. Most brides default to green or yellow because those are the expected colours.",
      "Another thing often overlooked is that the mehndi also has the most natural daylight, the most movement and the most candid photography of any wedding event. Our mehndi collection is chosen with that in mind: lighter fabrics, easy movement and colours that photograph well.",
    ],
  },
];

const NIKKAH: Article[] = [
  {
    heading: "Nikkah dresses for brides - what to look for",
    paragraphs: [
      "The nikkah is the most personal part of a wedding, and the outfit should feel calm and graceful rather than heavy. Ivory, gold, blush and soft pastel shades are the most popular choices, usually in layered organza, net or raw silk with fine hand embroidery.",
      "When choosing a nikkah dress, think about how long you will be seated, how the dupatta will sit, and how the outfit looks in photographs taken indoors. Every piece in our nikkah collection can be made to your measurements.",
    ],
  },
];

const WALIMA: Article[] = [
  {
    heading: "Walima dresses - elegant looks for the reception",
    paragraphs: [
      "The walima is the final celebration and the outfit usually leans softer than the barat. Pastel pinks, silvers, greys and champagne tones with fine silver or pearl work are popular because they feel light and festive.",
      "Our walima collection includes lehengas, gowns and long shirts with sharara or farshi trousers, all available in custom sizes with worldwide delivery.",
    ],
  },
];

const ENGAGEMENT: Article[] = [
  {
    heading: "Engagement dresses - a first look worth planning",
    paragraphs: [
      "An engagement outfit sits between formal and bridal. It should feel special without competing with the wedding functions that follow. Soft pastels, ivory and blush shades with delicate embroidery work well, and a flowing dupatta adds a graceful finish.",
    ],
  },
];

const SHAWL: Article[] = [
  {
    heading: "Shop luxury Pakistani shawls in USA - best for every occasion",
    paragraphs: [
      "A luxury Pakistani shawl carries hours of handcrafted work, warmth and quiet elegance in one piece. Sillhouete brings shawls from Lahore to customers in the USA, UK and Canada, and they suit winter weddings, formal dinners and festive gatherings.",
      "Shoppers looking for a Pakistani shawl usually want two things: real artisanal detail and a smooth delivery. This collection offers both, with statement pieces designed for formal events, weddings and cooler evenings.",
    ],
  },
  {
    heading: "Pakistani luxury shawls in velvet and jamawar",
    paragraphs: ["Fabric decides how a shawl feels, falls and photographs. These are the luxury styles in the Sillhouete range, each chosen for rich texture, elegant drape and finishes that survive repeated wear."],
    sub: [{ heading: "Velvet shawls for winter", paragraphs: ["Velvet shawls bring a soft texture and rich depth that suits snowy evenings perfectly. The black velvet shawl layers easily over embroidered suits, keeping you comfortable while dinner conversation continues."] }],
  },
];

const FORMAL: Article[] = [
  {
    heading: "Luxury formal dresses for women",
    paragraphs: [
      "Every woman has her own way of showing the world who she is, and for many, it starts with what she wears. At Sillhouete we pour that belief into every piece we create. Our Pakistani luxury formal dresses for women are inspired by South Asian heritage but designed with the modern woman in mind: someone who carries herself with pride and still wants to feel confident and comfortable.",
      "Each outfit is made to order in Lahore, with hand embroidery, fine fabrics and sizing that can be customised to your measurements. We ship worldwide.",
    ],
  },
];

const MEERAS: Article[] = [
  {
    heading: "Which Meeras piece works for an evening wedding reception?",
    paragraphs: [
      "Embroidered formal lehengas with straight trousers or full lehenga sets in navy, emerald or gold suit evening wedding receptions well. Adaa (RLF-04) and Resham (RLF-08) both carry the right level of embellishment for a formal festive occasion.",
    ],
  },
];

const MAAHI: Article[] = [
  {
    heading: "Maahi II luxury Eid pret - dressing well for Eid",
    paragraphs: [
      "Maahi II is our luxury Eid pret collection: fully stitched outfits in soft, festive shades with fine hand embellishment. Each piece is ready to wear, so you can spend the days before Eid on family and preparation instead of fittings.",
    ],
  },
];

const RAHA: Article[] = [
  {
    heading: "Raha Eid pret 26 - light, graceful festive wear",
    paragraphs: [
      "Raha Eid Pret brings refined embroidery to shorter, easy-to-wear silhouettes: front-open shirts, culottes, farshi shalwars and sheer organza dupattas. The shades run from black and ivory to mint, emerald and pastel pink, all suited to daytime Eid gatherings and relaxed evenings.",
    ],
  },
];

const LUMIERE: Article[] = [
  {
    heading: "Lumiere luxury formals 26",
    paragraphs: [
      "Lumiere is our heavier formal edit for weddings and evening events. Long front-open gowns, gold and silver embroidery, net and organza layers and statement dupattas make each piece one to remember. All outfits are made to order and can be adjusted to your size.",
    ],
  },
];

export const COLLECTION_ARTICLES: Record<string, Article[]> = {
  "silk-solids26": SILK,
  "barat-dresses": BARAT,
  "mehndi-dresses": MEHNDI,
  "nikkah-dresses": NIKKAH,
  "walima-dresses": WALIMA,
  "engagement-dresses": ENGAGEMENT,
  "luxury-shawl": SHAWL,
  "formal-dresses": FORMAL,
  meeras: MEERAS,
  "maahi-ii-luxury-eid-pret": MAAHI,
  "raha-eid-pret26": RAHA,
  "lumiere-luxury-formals26": LUMIERE,
};

export const DEFAULT_ARTICLE = (title: string): Article[] => [
  {
    heading: `About ${title}`,
    paragraphs: [
      `${title} brings together Sillhouete's designer outfits, made in Lahore with fine fabrics and detailed hand embroidery. Every piece can be adjusted to your measurements, and we deliver worldwide.`,
      "If you need help choosing a size, colour or delivery option, contact us on WhatsApp or by email and our team will help you.",
    ],
  },
];
