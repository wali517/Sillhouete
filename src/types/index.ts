export interface Product {
  id: string;
  handle: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  priceFrom: boolean;
  image: string;
  hoverImage: string;
  images?: string[];
  alt: string;
  /** height / width of the product image */
  ratio: number;
  isNew?: boolean;
  isSale?: boolean;
  isBestSeller?: boolean;
  category?: string;
  description?: string;
  inStock?: boolean;
  sizes?: string[];
  fabric?: string;
  sku?: string;
  color?: string;
  fabricDetail?: {
    shirt?: string;
    trousers?: string;
    dupatta?: string;
  };
  priceIncludes?: string[];
  customization?: {
    sizeCustomization?: string;
    colourCustomization?: string;
  };
  rating?: number;
  reviewCount?: number;
  dupattaOptions?: string[];
  adOnOptions?: string[];
  videoId?: string;
  videoUrl?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    sku?: string | null;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
  }>;
}

export interface CartItem {
  key: string;
  product: Product;
  size: string;
  dupatta?: string;
  adOn?: string;
  expedite?: boolean;
  slip?: string;
  unitPrice?: number;
  quantity: number;
}

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
  sale?: boolean;
}

export interface HeroSlide {
  id: string;
  desktop: string;
  mobile: string;
  alt: string;
  mobileAlt: string;
  href?: string;
}

export interface EventCategory {
  label: string;
  href: string;
  image: string;
  alt: string;
}

export interface InstagramPost {
  id: number;
  kind: "video" | "carousel";
  date: string;
  image: string;
  caption: string;
}

export interface OrderItem {
  id: string;
  handle: string;
  title: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
  /** Optional product customization selections saved with the order. */
  dupatta?: string;
  adOn?: string;
}

export interface OrderShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "stripe" | "cod" | "bank_transfer";

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: OrderShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  trackingNumber?: string;
  courier?: string;
  stripePaymentIntentId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  addresses?: OrderShippingAddress[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
  status: "unread" | "read" | "replied";
  replyNotes?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  readTime: string;
}

export interface SiteSettings {
  storeName: string;
  title: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  studioAddress: string;
  officeAddress: string;
  usaOfficeAddress: string;
  announcements: string[];
  freeShippingThreshold: number; // in PKR
  standardShippingFee: number; // in PKR
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeEnabled: boolean;
  currency: string;
  adminPasswordHash?: string;
}
