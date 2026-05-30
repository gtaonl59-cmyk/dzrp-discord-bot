import mongoose, { Schema, Document } from "mongoose";

export interface IEconomy extends Document {
  userId: string;
  guildId: string;
  wallet: number;
  bank: number;
  bankLimit: number;
  totalEarned: number;
  totalSpent: number;
  debt: number;
  lastDaily: Date | null;
  lastWeekly: Date | null;
  lastMonthly: Date | null;
  lastVipDaily: Date | null;
  lastVipWeekly: Date | null;
  lastVipMonthly: Date | null;
  transactions: {
    type: string;
    amount: number;
    description: string;
    timestamp: Date;
  }[];
  fines: { reason: string; amount: number; paid: boolean; timestamp: Date }[];
  loans: { amount: number; interest: number; dueDate: Date; paid: boolean }[];
}

const EconomySchema = new Schema<IEconomy>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    wallet: { type: Number, default: 500 },
    bank: { type: Number, default: 0 },
    bankLimit: { type: Number, default: 50000 },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    debt: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    lastWeekly: { type: Date, default: null },
    lastMonthly: { type: Date, default: null },
    lastVipDaily: { type: Date, default: null },
    lastVipWeekly: { type: Date, default: null },
    lastVipMonthly: { type: Date, default: null },
    transactions: [
      {
        type: String,
        amount: Number,
        description: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    fines: [
      {
        reason: String,
        amount: Number,
        paid: { type: Boolean, default: false },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    loans: [
      {
        amount: Number,
        interest: Number,
        dueDate: Date,
        paid: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

EconomySchema.index({ userId: 1, guildId: 1 }, { unique: true });

export default mongoose.model<IEconomy>("Economy", EconomySchema);
