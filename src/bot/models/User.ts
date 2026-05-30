import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  userId: string;
  guildId: string;
  xp: number;
  level: number;
  voiceXp: number;
  textXp: number;
  totalMessages: number;
  totalVoiceMinutes: number;
  vip: {
    tier: string;
    expiresAt: Date | null;
  };
  badges: string[];
  achievements: { id: string; name: string; unlockedAt: Date }[];
  warnings: { reason: string; moderator: string; timestamp: Date }[];
  isPrisoned: boolean;
  prisonSentence: number;
  prisonEnd: Date | null;
  prisonReason: string;
  isBanned: boolean;
  isMuted: boolean;
  muteEnd: Date | null;
  profileBackground: string;
  joinedAt: Date;
  reputation: number;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    voiceXp: { type: Number, default: 0 },
    textXp: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalVoiceMinutes: { type: Number, default: 0 },
    vip: {
      tier: { type: String, default: "none" },
      expiresAt: { type: Date, default: null },
    },
    badges: [String],
    achievements: [
      {
        id: String,
        name: String,
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    warnings: [
      {
        reason: String,
        moderator: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isPrisoned: { type: Boolean, default: false },
    prisonSentence: { type: Number, default: 0 },
    prisonEnd: { type: Date, default: null },
    prisonReason: { type: String, default: "" },
    isBanned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    muteEnd: { type: Date, default: null },
    profileBackground: { type: String, default: "default" },
    joinedAt: { type: Date, default: Date.now },
    reputation: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export default mongoose.model<IUser>("User", UserSchema);
