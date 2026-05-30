import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  businessId: string;
  guildId: string;
  ownerId: string;
  name: string;
  type: string;
  tier: string;
  price: number;
  isVip: boolean;
  employees: { userId: string; role: string; salary: number; hiredAt: Date }[];
  balance: number;
  dailyProfit: number;
  taxRate: number;
  storage: { itemId: string; name: string; quantity: number }[];
  upgrades: string[];
  stats: {
    totalEarned: number;
    totalTaxPaid: number;
    employeeCount: number;
  };
  isOpen: boolean;
  lastPayout: Date | null;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    ownerId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "general" },
    tier: { type: String, default: "basic" },
    price: { type: Number, required: true },
    isVip: { type: Boolean, default: false },
    employees: [
      {
        userId: String,
        role: { type: String, default: "Employee" },
        salary: { type: Number, default: 500 },
        hiredAt: { type: Date, default: Date.now },
      },
    ],
    balance: { type: Number, default: 0 },
    dailyProfit: { type: Number, default: 1000 },
    taxRate: { type: Number, default: 0.1 },
    storage: [{ itemId: String, name: String, quantity: Number }],
    upgrades: [String],
    stats: {
      totalEarned: { type: Number, default: 0 },
      totalTaxPaid: { type: Number, default: 0 },
      employeeCount: { type: Number, default: 0 },
    },
    isOpen: { type: Boolean, default: true },
    lastPayout: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IBusiness>("Business", BusinessSchema);
