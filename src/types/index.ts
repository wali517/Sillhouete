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
  collections?: string[];
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
  blink?: boolean;
  highlight?: boolean;
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
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "paid"
  | "failed"
  | "cancelled"
  | "partially_refunded"
  | "refunded";
export type RefundStatus =
  | "none"
  | "pending"
  | "processing"
  | "partially_refunded"
  | "refunded"
  | "refund_failed";
export type PaymentMethod = "stripe" | "credit_card" | "cod" | "bank_transfer" | "bank_deposit";

export interface StripePaymentDetails {
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  funding?: string;
}

export interface OrderTimelineEvent {
  title: string;
  date: string;
  details?: string;
  amount?: number;
  refundId?: string;
}

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
  billingAddress?: OrderShippingAddress;
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
  trackingUrl?: string;
  shippingDate?: string;
  estimatedDeliveryDate?: string;

  // Stripe Payment Details
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  stripeEventIds?: string[];
  amountPaid?: number;
  paidAt?: string;
  paymentDetails?: StripePaymentDetails;
  failureReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  remainingRefundable?: number;
  refundStatus?: RefundStatus;
  refundId?: string;
  refundedAt?: string;
  refundFailureReason?: string;
  paymentTimeline?: OrderTimelineEvent[];
  refundTimeline?: OrderTimelineEvent[];
}

export interface NotificationRecord {
  id: string;
  orderId?: string;
  orderNumber?: string;
  type: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "simulated" | "queued";
  messageId?: string;
  attempts: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
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
  adminEmail?: string;
  adminPasswordHash?: string;
  bankName?: string;
  bankAccountTitle?: string;
  bankIban?: string;
  discountCodes?: Array<{ code: string; percent: number; active: boolean }>;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}
