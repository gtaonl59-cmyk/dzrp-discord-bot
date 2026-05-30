import mongoose, { Schema, Document } from "mongoose";

export interface IProperty extends Document {
  propertyId: string;
  guildId: string;
  ownerId: string | null;
  name: string;
  type: "house" | "apartment" | "villa" | "warehouse";
  tier: string;
  price: number;
  rentPrice: number;
  isForRent: boolean;
  isForSale: boolean;
  isVip: boolean;
  tenants: string[];
  keys: string[];
  storage: { itemId: string; name: string; quantity: number }[];
  upgrades: string[];
  logs: { action: string; userId: string; timestamp: Date }[];
  stats: {
    rooms: number;
    garage: boolean;
    pool: boolean;
  };
}

const PropertySchema = new Schema<IProperty>(
  {
    propertyId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    ownerId: { type: String, default: null },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["house", "apartment", "villa", "warehouse"],
      default: "house",
    },
    tier: { type: String, default: "basic" },
    price: { type: Number, required: true },
    rentPrice: { type: Number, default: 0 },
    isForRent: { type: Boolean, default: false },
    isForSale: { type: Boolean, default: true },
    isVip: { type: Boolean, default: false },
    tenants: [String],
    keys: [String],
    storage: [{ itemId: String, name: String, quantity: Number }],
    upgrades: [String],
    logs: [{ action: String, userId: String, timestamp: { type: Date, default: Date.now } }],
    stats: {
      rooms: { type: Number, default: 2 },
      garage: { type: Boolean, default: false },
      pool: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProperty>("Property", PropertySchema);
