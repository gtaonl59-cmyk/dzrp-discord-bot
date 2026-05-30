import mongoose, { Schema, Document } from "mongoose";

export interface ICharacter extends Document {
  userId: string;
  guildId: string;
  name: string;
  age: number;
  gender: string;
  biography: string;
  photo: string;
  isActive: boolean;
  isDead: boolean;
  deathReason: string;
  stats: {
    strength: number;
    intelligence: number;
    charisma: number;
    agility: number;
    luck: number;
  };
  skills: { name: string; level: number }[];
  reputation: number;
  licenses: string[];
  inventory: { itemId: string; name: string; quantity: number; category: string }[];
  history: { event: string; timestamp: Date }[];
  job: string;
  criminalRecord: { crime: string; sentence: number; timestamp: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    age: { type: Number, default: 18 },
    gender: { type: String, default: "Not specified" },
    biography: { type: String, default: "" },
    photo: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isDead: { type: Boolean, default: false },
    deathReason: { type: String, default: "" },
    stats: {
      strength: { type: Number, default: 10 },
      intelligence: { type: Number, default: 10 },
      charisma: { type: Number, default: 10 },
      agility: { type: Number, default: 10 },
      luck: { type: Number, default: 10 },
    },
    skills: [{ name: String, level: { type: Number, default: 1 } }],
    reputation: { type: Number, default: 0 },
    licenses: [String],
    inventory: [
      {
        itemId: String,
        name: String,
        quantity: { type: Number, default: 1 },
        category: { type: String, default: "General" },
      },
    ],
    history: [{ event: String, timestamp: { type: Date, default: Date.now } }],
    job: { type: String, default: "Unemployed" },
    criminalRecord: [
      {
        crime: String,
        sentence: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ICharacter>("Character", CharacterSchema);
