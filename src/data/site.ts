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
  { label: "Sale", href: "/collections/sale-1", sale: true },
  { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
  {
    label: "New Arrivals",
    href: "/collections/new-arrivals",
    children: [
      { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
      { label: "Silk Solids'26", href: "/collections/silk-solids26" },
      { label: "Raha Eid Pret'26", href: "/collections/raha-eid-pret26" },
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
      { label: "Meeras", href: "/collections/meeras" },
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
      { label: "Luxe", href: "/collections/luxe-1" },
      { label: "Opal", href: "/collections/opal" },
      { label: "Riwaj Luxury Pret", href: "/collections/riwaj-luxury-pret" },
    ],
  },
  {
    label: "Pret",
    href: "/collections/pret",
    children: [{ label: "Raha Eid Pret'26", href: "/collections/raha-eid-pret26" }],
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

export const PAYMENT_IMAGES = [
  { src: "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/mastercard.png?v=1742200774", alt: "master-card" },
  { src: "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/visa_484e9393-90e0-4d52-8eae-51193a00143d.png?v=1742200775", alt: "visa-card" },
];

export const ABOUT_TEXT =
  "Sillhouete is a Pakistan-based designer brand offering luxury bridal, formal, and ready-to-wear outfits to customers worldwide. Our collections are made for weddings and special occasions, with easy online shopping available globally.";

/** flat lookup used for collection page titles */
export const COLLECTION_TITLES: Record<string, string> = (() => {
  const map: Record<string, string> = {
    "1": "Shop All",
    "best-sellers": "Best Sellers",
    "sale-1": "Sale",
    "new-arrivals": "New Arrivals",
    "bridal-dresses": "Bridals",
    "formal-dresses": "Formal",
    "luxury-pret": "Luxury Pret",
    pret: "Pret",
    accessories: "Accessories",
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
