import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSettings extends Document {
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
  freeShippingThreshold: number;
  standardShippingFee: number;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeEnabled: boolean;
  currency: string;
  adminPasswordHash?: string;
  bankName?: string;
  bankAccountTitle?: string;
  bankIban?: string;
  discountCodes?: Array<{ code: string; percent: number; active: boolean }>;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    storeName: { type: String, default: "Sillhouete" },
    title: { type: String, default: "Shop Pakistani Designer Dresses for Women Online – Sillhouete" },
    description: { type: String, default: "Shop Pakistan designer dresses for women at Sillhouete." },
    email: { type: String, default: "info@sillhouete.com" },
    phone: { type: String, default: "+92 331 0397865" },
    whatsapp: { type: String, default: "+923310397865" },
    studioAddress: { type: String, default: "Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore" },
    officeAddress: { type: String, default: "327-B, Street 7, Lane 15, Cavalry Ground, Lahore" },
    usaOfficeAddress: { type: String, default: "ADVENT BUSINESS CONSULTAX LLC, 18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181" },
    announcements: [{ type: String }],
    freeShippingThreshold: { type: Number, default: 140000 },
    standardShippingFee: { type: Number, default: 250 },
    stripePublishableKey: { type: String, default: "" },
    stripeSecretKey: { type: String, default: "" },
    stripeEnabled: { type: Boolean, default: true },
    currency: { type: String, default: "PKR" },
    adminPasswordHash: { type: String, default: "admin123" },
    bankName: { type: String, default: "Meezan Bank" },
    bankAccountTitle: { type: String, default: "SILLHOUETE" },
    bankIban: { type: String, default: "PK80MEZN0002160109517881" },
    discountCodes: [
      {
        code: { type: String },
        percent: { type: Number },
        active: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

export const SiteSettingsModel: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
