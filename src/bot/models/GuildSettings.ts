import mongoose, { Schema, Document } from "mongoose";

export interface IGuildSettings extends Document {
  guildId: string;
  prefix: string;
  language: string;
  welcomeChannel: string | null;
  leaveChannel: string | null;
  logChannel: string | null;
  modLogChannel: string | null;
  ticketCategory: string | null;
  staffRoles: string[];
  modRoles: string[];
  judgeRoles: string[];
  lawyerRoles: string[];
  policeRoles: string[];
  emsRoles: string[];
  autoRoles: string[];
  welcomeMessage: string;
  leaveMessage: string;
  economyEnabled: boolean;
  rpEnabled: boolean;
  xpEnabled: boolean;
  antiRaid: boolean;
  antiSpam: boolean;
  antiLink: boolean;
  antiNuke: boolean;
  taxRate: number;
  inflation: number;
  jailChannel: string | null;
  courtChannel: string | null;
  prisonRole: string | null;
  xpMultiplier: number;
  vipRoles: {
    bronze: string | null;
    silver: string | null;
    gold: string | null;
    platinum: string | null;
    diamond: string | null;
  };
  suggestionChannel: string | null;
  announcementChannel: string | null;
  verificationChannel: string | null;
  verificationRole: string | null;
}

const GuildSettingsSchema = new Schema<IGuildSettings>(
  {
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: "/" },
    language: { type: String, default: "en" },
    welcomeChannel: { type: String, default: null },
    leaveChannel: { type: String, default: null },
    logChannel: { type: String, default: null },
    modLogChannel: { type: String, default: null },
    ticketCategory: { type: String, default: null },
    staffRoles: [String],
    modRoles: [String],
    judgeRoles: [String],
    lawyerRoles: [String],
    policeRoles: [String],
    emsRoles: [String],
    autoRoles: [String],
    welcomeMessage: { type: String, default: "Welcome {user} to {server}! You are member #{count}." },
    leaveMessage: { type: String, default: "{user} has left the server. We now have {count} members." },
    economyEnabled: { type: Boolean, default: true },
    rpEnabled: { type: Boolean, default: true },
    xpEnabled: { type: Boolean, default: true },
    antiRaid: { type: Boolean, default: false },
    antiSpam: { type: Boolean, default: false },
    antiLink: { type: Boolean, default: false },
    antiNuke: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0.05 },
    inflation: { type: Number, default: 1.0 },
    jailChannel: { type: String, default: null },
    courtChannel: { type: String, default: null },
    prisonRole: { type: String, default: null },
    xpMultiplier: { type: Number, default: 1.0 },
    vipRoles: {
      bronze: { type: String, default: null },
      silver: { type: String, default: null },
      gold: { type: String, default: null },
      platinum: { type: String, default: null },
      diamond: { type: String, default: null },
    },
    suggestionChannel: { type: String, default: null },
    announcementChannel: { type: String, default: null },
    verificationChannel: { type: String, default: null },
    verificationRole: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IGuildSettings>("GuildSettings", GuildSettingsSchema);
