import mongoose, { Schema, Document } from "mongoose";

export interface IGang extends Document {
  gangId: string;
  guildId: string;
  name: string;
  type: "gang" | "mafia";
  leaderId: string;
  members: { userId: string; rank: string; joinedAt: Date }[];
  balance: number;
  storage: { itemId: string; name: string; quantity: number }[];
  territory: string[];
  income: number;
  wars: { targetGangId: string; status: string; startedAt: Date }[];
  ranking: number;
  description: string;
  logo: string;
  isRecruiting: boolean;
}

const GangSchema = new Schema<IGang>(
  {
    gangId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["gang", "mafia"], default: "gang" },
    leaderId: { type: String, required: true },
    members: [
      {
        userId: String,
        rank: { type: String, default: "Member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    balance: { type: Number, default: 0 },
    storage: [{ itemId: String, name: String, quantity: Number }],
    territory: [String],
    income: { type: Number, default: 0 },
    wars: [
      {
        targetGangId: String,
        status: { type: String, default: "active" },
        startedAt: { type: Date, default: Date.now },
      },
    ],
    ranking: { type: Number, default: 0 },
    description: { type: String, default: "" },
    logo: { type: String, default: "" },
    isRecruiting: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IGang>("Gang", GangSchema);
