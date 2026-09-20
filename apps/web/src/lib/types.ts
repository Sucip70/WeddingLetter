// Bentuk data dari API (lihat apps/api). Hanya field yang dipakai UI.

export type FieldType = 'text' | 'textarea' | 'datetime' | 'url' | 'image' | 'gallery' | 'videos' | 'song';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  maxLength?: number;
  placeholder?: string;
}

export interface SectionDef {
  id: string;
  title: string;
  fields: FieldDef[];
}

export interface Theme {
  preset: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  headingFont: 'script' | 'serif' | 'sans';
  bodyFont: 'serif' | 'sans';
}

export interface Layout {
  theme: Theme;
  sections: SectionDef[];
  galeri: { maxPhotos: number; maxVideos: number };
  musik: { allowed: boolean; presets: { name: string; url: string }[] };
}

export type Tier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface Template {
  id: string;
  name: string;
  category: string;
  tier: Tier;
  price: number;
  includedWeeks: number;
  status: string;
  thumbnailUrl: string | null;
  layout: Layout;
}

export interface TemplateDetail extends Template {
  addOnSections: Record<string, SectionDef>;
}

export interface AddOn {
  id?: string;
  code: string;
  name: string;
  type: 'FLAT' | 'PER_UNIT';
  price: number;
  unit: string | null;
}

export type InvitationData = Record<string, Record<string, string | string[]>>;

export interface InvitationFeatures {
  rsvp?: boolean;
  envelope?: boolean;
  english?: boolean;
}

export interface MediaRef {
  url: string;
  type: string;
}

// Tampilan undangan (publik & pratinjau pemilik).
export interface InvitationViewData {
  id?: string;
  slug: string;
  status?: string;
  templateName?: string;
  layout: { theme: Theme; sections: SectionDef[]; musik: { presets: { name: string; url: string }[] } };
  features: InvitationFeatures;
  data: InvitationData;
  media: Record<string, MediaRef>;
  rsvpEnabled: boolean;
  guestbook: { name: string; message: string; attending: boolean | null; createdAt: string }[];
}

export interface QuoteLine {
  code: string;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface MediaCharge {
  clientId: string;
  included: boolean;
  rentedWeeks: number;
  billableMb: number;
  price: number;
  reason: 'field' | 'quota' | 'pack' | 'rental' | 'song';
}

export type CouponCheck = { code: string; valid: true; couponId: string; discount: number } | { code: string; valid: false; reason: string };

export interface Quote {
  weeks: number;
  includedWeeks: number;
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  total: number;
  coupon: CouponCheck | null;
  media: MediaCharge[];
}

export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
export type InvitationStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED_GRACE' | 'DELETED';

export interface OrderSummary {
  id: string;
  kind: 'NEW' | 'EXTENSION';
  status: OrderStatus;
  templateName: string;
  activeWeeks: number;
  subtotal: number;
  addOnTotal: number;
  couponDiscount: number;
  totalAmount: number;
  paymentProvider: string | null;
  paidAt: string | null;
  createdAt: string;
  invitation: { id: string; slug: string; status?: string } | null;
}

export interface OrderDetail extends OrderSummary {
  coupon: string | null;
  lines: QuoteLine[];
  media: { id: string; type: string; status: string; sizeBytes: number }[];
}

export interface Upload {
  clientId: string;
  mediaId: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface InvitationListItem {
  id: string;
  slug: string;
  status: InvitationStatus;
  templateName: string;
  orderId: string;
  orderStatus: OrderStatus;
  publishedAt: string | null;
  expiresAt: string | null;
  remainingDays: number | null;
  viewCount: number;
  rsvpCount: number;
  createdAt: string;
}

export interface InvitationMedia {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'SONG';
  url: string;
  status: string;
  sizeBytes: number;
  included: boolean;
  rentedWeeks: number;
  expiresAt: string | null;
  remainingDays: number | null;
}

export interface InvitationDetail {
  id: string;
  slug: string;
  status: InvitationStatus;
  templateName: string;
  data: InvitationData;
  features: InvitationFeatures;
  layout: Layout;
  publishedAt: string | null;
  expiresAt: string | null;
  pausedAt: string | null;
  remainingDays: number | null;
  viewCount: number;
  order: { id: string; status: OrderStatus; paidAt: string | null; activeWeeks: number; totalAmount: number };
  refundEligible: boolean;
  media: InvitationMedia[];
}

export interface RsvpSummary {
  total: number;
  attendingCount: number;
  attendingPeople: number;
  declinedCount: number;
  guests: { id: string; name: string; attending: boolean | null; guestCount: number; message: string | null; createdAt: string }[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
}
