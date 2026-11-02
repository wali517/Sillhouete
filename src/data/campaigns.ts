import type { EventCategory, HeroSlide, InstagramPost } from "@/types";

const F = "https://sillhouete.com/cdn/shop/files/";

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "lumiere",
    desktop: `${F}web-banner_jpg.jpg?v=1778078549`,
    mobile: `${F}wb-mbl.jpg_1.jpg?v=1778078547`,
    alt: "Free international delivery - Lumiere Luxury Formals '26",
    mobileAlt: "Lumiere Luxury Formals '26",
    href: "/collections/lumiere-luxury-formals26",
  },
  {
    id: "sale",
    desktop: `${F}wb-1.jpg?v=1777274033`,
    mobile: `${F}wb-mbl.jpg-1.jpg?v=1777274033`,
    alt: "Sale up to 70% off banner",
    mobileAlt: "Sale up to 70% off banner",
    href: "/collections/sale-1",
  },
  {
    id: "red",
    desktop: `${F}wb-3_bd931670-6ab7-4d15-ad52-a5ee3d462be7.jpg?v=1777274033`,
    mobile: `${F}wb-mbl-3_4d28cc37-ba9d-4515-be45-f208efe0942b.jpg?v=1777274033`,
    alt: "Buy 4 Dress Get 1 Free - Festive Collection",
    mobileAlt: "Buy 4 Dress Get 1 Free",
    href: "/collections/formal-dresses",
  },
  {
    id: "maahi",
    desktop: `${F}IMG_4249_JPG.jpg?v=1776413159`,
    mobile: `${F}IMG_4250.JPG_1.jpg?v=1776413159`,
    alt: "Maahi II Luxury Eid Pret - Shop now",
    mobileAlt: "Maahi II Luxury Eid Pret",
    href: "/collections/maahi-ii-luxury-eid-pret",
  },
];

export const VIDEO_URL = "https://cdn.shopify.com/videos/c/o/v/061ca40eef70464293b2a672d62f7b0a.mp4";
export const MEDIA_IMAGE = `${F}05.png?v=1758725288`;

export const EVENTS: EventCategory[] = [
  {
    label: "Engagement",
    href: "/collections/engagement-dresses",
    image: `${F}5_e07033cd-99f1-4016-8c06-d710e27a5b60.png?v=1771918660`,
    alt: "Engagement dress",
  },
  {
    label: "Mehndi",
    href: "/collections/mehndi-dresses",
    image: "https://sillhouete.com/cdn/shop/collections/1_225c24ca-8c8d-47d9-a81c-9a24cf5f10ac.webp?v=1775131757",
    alt: "Mehndi",
  },
  {
    label: "Nikkah",
    href: "/collections/nikkah-dresses",
    image: `${F}1000x1500_0006_052A6061.jpg?v=1758177457`,
    alt: "Gold embroidered bridal gown with sheer sleeves, matching dupatta, and detailed embellishments",
  },
  {
    label: "Barat",
    href: "/collections/barat-dresses",
    image: `${F}1000x1500_0012_052A5865.jpg?v=1756903506`,
    alt: "Red bridal lehenga with heavy gold embroidery, full-sleeve embellished blouse, and matching ornate dupatta",
  },
  {
    label: "Walima",
    href: "/collections/walima-dresses",
    image: `${F}05.png?v=1758725288`,
    alt: "Blush pink bridal lehenga with heavy silver embroidery, sheer embellished blouse, and matching dupatta with scalloped border",
  },
];

export const POPUP_IMAGE = `${F}webimages_0049_DSC07653_c5437d24-1c1e-4f8b-9646-80f0757ba6e5.jpg?v=1767332212`;

const TAIL = "Shop Now: https://sillhouete.com/collections/raha-eid-pret26\n\n#Sillhouete #luxurypret #formals #festive #livenow";
const MINT =
  "Pret | RSP-03\n\nAn ode to graceful tradition, this mint green ensemble features a front-open short shirt with delicate embroidery, paired with a regal farshi shalwar and a sheer organza dupatta for an ethereal finish.\n\n" + TAIL;
const EMERALD =
  "Pret | RSP-02\n\nA vision of modern regality, this emerald green outfit showcases a front-open short shirt delicately embroidered, paired with flowing sharara pants and a matching dupatta for a refined, graceful finish.\n\n" + TAIL;

/**
 * The Instagram CDN links on the live page are signed and expire, so each post
 * uses the matching product photography instead.
 */
export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 1,
    kind: "video",
    date: "October 18",
    image: `${F}sillhouete-formal-dress-nisa-black-Refined-embroidery.jpg?v=1768978207`,
    caption:
      "Raha Pret | RSP-03\n\nA timeless black ensemble featuring a long A-line shirt adorned with refined embroidery. Paired with tailored culottes and a coordinating dupatta, this look embodies modern elegance and effortless sophistication.\n\n" + TAIL,
  },
  { id: 2, kind: "carousel", date: "October 14", image: `${F}sillhouete-formal-dress-erza-mint-green-delicate-embroidery-model.jpg?v=1768978680`, caption: MINT },
  { id: 3, kind: "carousel", date: "October 13", image: `${F}sillhouete-formal-dress-erza-mint-green-delicate-embroidery-front-closeup.jpg?v=1768978836`, caption: MINT },
  { id: 4, kind: "video", date: "October 12", image: `${F}sillhouete-formal-dress-erza-mint-green-delicate-embroidery-model.jpg?v=1768978680`, caption: MINT },
  { id: 5, kind: "video", date: "October 11", image: `${F}sillhouete-formal-dress-amavi-bottle-green-delicate-embroidery-front.jpg?v=1768978581`, caption: EMERALD },
  { id: 6, kind: "carousel", date: "October 11", image: `${F}sillhouete-formal-dress-amavi-bottle-green-delicate-embroidery-front-closeup.jpg?v=1768978581`, caption: EMERALD },
];
