import mongoose, { Schema, Document } from "mongoose";

export interface IVehicle extends Document {
  vehicleId: string;
  guildId: string;
  ownerId: string | null;
  name: string;
  model: string;
  brand: string;
  type: string;
  tier: string;
  price: number;
  isVip: boolean;
  isLuxury: boolean;
  licensePlate: string;
  isRegistered: boolean;
  isInsured: boolean;
  insuranceExpiry: Date | null;
  inGarage: boolean;
  storage: { itemId: string; name: string; quantity: number }[];
  upgrades: string[];
  stats: {
    speed: number;
    handling: number;
    durability: number;
  };
  tradeHistory: { fromUser: string; toUser: string; price: number; timestamp: Date }[];
}

const VehicleSchema = new Schema<IVehicle>(
  {
    vehicleId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    ownerId: { type: String, default: null },
    name: { type: String, required: true },
    model: { type: String, required: true },
    brand: { type: String, required: true },
    type: { type: String, default: "car" },
    tier: { type: String, default: "standard" },
    price: { type: Number, required: true },
    isVip: { type: Boolean, default: false },
    isLuxury: { type: Boolean, default: false },
    licensePlate: { type: String, default: "" },
    isRegistered: { type: Boolean, default: false },
    isInsured: { type: Boolean, default: false },
    insuranceExpiry: { type: Date, default: null },
    inGarage: { type: Boolean, default: true },
    storage: [{ itemId: String, name: String, quantity: Number }],
    upgrades: [String],
    stats: {
      speed: { type: Number, default: 50 },
      handling: { type: Number, default: 50 },
      durability: { type: Number, default: 50 },
    },
    tradeHistory: [
      {
        fromUser: String,
        toUser: String,
        price: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IVehicle>("Vehicle", VehicleSchema);
