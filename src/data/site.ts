import type { NavLink } from "@/types";

export const SITE = {
  name: "Sillhouete",
  title: "Shop Pakistani Designer Dresses for Women Online",
  description:
    "Shop Pakistan designer dresses for women at Sillhouete. Explore bridal dresses, luxury formals, and elegant ready-to-wear outfits with worldwide delivery.",
  logo: "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png?v=1744702089",
  whatsapp: "923310397865",
  email: "info@sillhouete.com",
};

export const ANNOUNCEMENTS = [
  "FREE SHIPPING ALL OVER WORLD ON $500 AND ABOVE ORDERS",
  "WE OFFER WORLDWIDE SHIPPING.",
  "FOR BOOKINGS: 03154204981 / 03310397865",
];

export const NAV: NavLink[] = [
  { label: "Sale", href: "/collections/sale-1", sale: true, blink: true },
  { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
  {
    label: "New Arrivals",
    href: "/collections/new-arrivals",
    children: [
      { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
      { label: "Silk Solids'26", href: "/collections/silk-solids26" },
      { label: "Raha Eid Pret'26", href: "/collections/raha-eid-pret26", highlight: true },
      { label: "Lumiere Luxury Formals'26", href: "/collections/lumiere-luxury-formals26" },
    ],
  },
  {
    label: "Bridals",
    href: "/collections/bridal-dresses",
    children: [
      { label: "Husan ara - Birdal '25", href: "/collections/husan-ara-birdal-25" },
      { label: "Anarkali - Birdal '24", href: "/collections/anarkali-birdal-24" },
      { label: "Noor Jahn Bridal '23", href: "/collections/noor-jahn-bridal-23" },
      { label: "Roshanara Bridal '22", href: "/collections/roshanara-bridal-22" },
    ],
  },
  {
    label: "Formal",
    href: "/collections/formal-dresses",
    children: [
      { label: "Lumiere Luxury Formals'26", href: "/collections/lumiere-luxury-formals26" },
      { label: "Meeras", href: "/collections/meeras", blink: true },
      { label: "Zarqaa", href: "/collections/zarqaa" },
      { label: "Riwaj Formals", href: "/collections/riwaj-formals" },
      { label: "Rang e Bahar", href: "/collections/rang-e-bahar" },
      { label: "Tosha Kinari", href: "/collections/tosha-kinari" },
      { label: "Shawl Collection", href: "/collections/luxury-shawl" },
      { label: "View All", href: "/collections/formal-dresses" },
    ],
  },
  {
    label: "Luxury Pret",
    href: "/collections/luxury-pret",
    children: [
      { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
      { label: "Silk Solids'26", href: "/collections/silk-solids26" },
      { label: "Maahi Luxury Pret'25", href: "/collections/maahi-luxury-pret25" },
      { label: "Luxe", href: "/collections/luxe" },
      { label: "Opal", href: "/collections/opal" },
      { label: "Riwaj Luxury Pret", href: "/collections/riwaj-luxury-pret" },
    ],
  },
  {
    label: "Pret",
    href: "/collections/pret",
    children: [{ label: "Raha Eid Pret'26", href: "/collections/raha-eid-pret26", highlight: true }],
  },
  {
    label: "Shop By Events",
    href: "#",
    children: [
      { label: "Engagement", href: "/collections/engagement-dresses" },
      { label: "Mehndi", href: "/collections/mehndi-dresses" },
      { label: "Nikkah", href: "/collections/nikkah-dresses" },
      { label: "Barat", href: "/collections/barat-dresses" },
      { label: "Walima", href: "/collections/walima-dresses" },
    ],
  },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Spotted", href: "/pages/spot" },
  {
    label: "Accessories",
    href: "/collections/accessories",
    children: [{ label: "Pouches & Clutches", href: "/collections/pouches-clutches" }],
  },
];

export const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "PRIVACY POLICY", href: "/pages/privacy-policy" },
  { label: "MADE-TO-ORDER POLICY", href: "/pages/policies" },
  { label: "EXCHANGE, REFUND & CANCELATION POLICY", href: "/pages/policies" },
  { label: "TERMS AND CONDITIONS", href: "/pages/terms-and-conditions" },
  { label: "BRAND STORY", href: "/pages/brand-story" },
  { label: "SHIPPING POLICY", href: "/pages/shipping-policy" },
  { label: "BLOG", href: "/blogs/news" },
  { label: "Contact Us.", href: "/pages/contact-us" },
  { label: "FAQS.", href: "/pages/faqs" },
];

export const SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/sillhouete.official" },
  { name: "Facebook", href: "https://www.facebook.com/share/171Gb4SL8y/" },
  { name: "YouTube", href: "https://www.youtube.com/@sillhouete.official" },
  { name: "Pinterest", href: "https://www.pinterest.com/sillhoueteofficial" },
  { name: "TikTok", href: "https://www.tiktok.com/@sillhoueteofficial" },
] as const;

export const ABOUT_TEXT =
  "Sillhouete is a Pakistan-based designer brand offering luxury bridal, formal, and ready-to-wear outfits to customers worldwide. Our collections are made for weddings and special occasions, with easy online shopping available globally.";

/** flat lookup used for collection page titles */
export const COLLECTION_TITLES: Record<string, string> = (() => {
  const map: Record<string, string> = {
    "1": "Shop All",
    "accessories": "Accessories",
    "anarkali-birdal-24": "Anarkali - Birdal '24",
    "barat-dresses": "Barat",
    "best-sellers": "Best Sellers",
    "bridal-indian-dresses": "Bridal Indian Dresses",
    "bridal-dresses": "BRIDALS",
    "collection-2023": "Collection 2023",
    "collection-2024": "Collection 2024",
    "engagement-dresses": "Engagement",
    "formal-dresses": "FORMALS",
    "husan-ara-birdal-25": "Husan ara - Birdal '25",
    "indian-wedding-dresses": "Indian Wedding Dresses",
    "lumiere-luxury-formals26": "Lumiere Luxury Formals'26",
    "luxe": "Luxe",
    "luxe-1": "Luxe",
    "luxury-pret": "Luxury Pret Dresses for Women - Shop Pakistani Ready-to-Wear Online",
    "luxury-shawl": "Luxury Shawl",
    "maahi-ii-luxury-eid-pret": "Maahi II Luxury Eid Pret",
    "maahi-luxury-pret25": "Maahi Luxury Pret'25",
    "meeras": "Meeras - Formal Collection '25",
    "mehndi-dresses": "Mehndi",
    "new-arrivals": "New Arrivals",
    "nikkah-dresses": "Nikkah",
    "noor-jahan": "Noor Jahan",
    "noor-jahn-bridal-23": "Noor Jahn Bridal '23",
    "opal": "Opal",
    "pakistani-bridal-dresses": "Pakistani Bridal Dresses",
    "pakistani-formal-wear": "Pakistani Formal Wear",
    "pakistani-mehndi-dresses": "Pakistani Mehndi Dresses",
    "pakistani-wedding-dresses": "Pakistani Wedding Dresses",
    "pakistani-dresses-in-canada": "Pakistani Wedding Dresses In Canada",
    "pakistani-dresses-in-uk": "Pakistani Wedding Dresses In UK",
    "wedding-dress-in-usa": "Pakistani Wedding Dresses In USA",
    "party-wear-dresses": "Party Wear",
    "pouches-clutches": "Pouches & Clutches",
    "raha-eid-pret26": "Raha Eid Pret'26",
    "rang-e-bahar": "Rang e Bahar",
    "ready-to-wear": "READY TO WEAR",
    "riwaj-formals": "Riwaj Formals",
    "riwaj-luxury-pret": "Riwaj Luxury Pret",
    "roshanara-bridal-22": "Roshanara Bridal '22",
    "sale": "Sillhouete Sale",
    "sale-1": "Sillhouete Sale",
    "pret": "Shop Pakistani Pret Dresses Online - Ready-To-Wear Options For Women",
    "silk-solids26": "Silk Solids'26",
    "tosha-kinari": "Tosha Kinari",
    "walima-dresses": "Walima",
    "zarqaa": "Zarqaa",
  };
  const walk = (links: NavLink[]) =>
    links.forEach((l) => {
      const m = l.href.match(/^\/collections\/(.+)$/);
      if (m && !map[m[1]]) map[m[1]] = l.label;
      if (l.children) walk(l.children);
    });
  walk(NAV);
  return map;
})();
