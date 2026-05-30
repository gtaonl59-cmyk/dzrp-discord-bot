import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  ticketId: string;
  guildId: string;
  userId: string;
  channelId: string;
  type: "support" | "staff" | "purchase" | "report";
  subject: string;
  status: "open" | "closed" | "pending";
  assignedTo: string | null;
  messages: { userId: string; content: string; timestamp: Date }[];
  transcript: string;
  closedBy: string | null;
  closedAt: Date | null;
  priority: "low" | "medium" | "high";
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    type: {
      type: String,
      enum: ["support", "staff", "purchase", "report"],
      default: "support",
    },
    subject: { type: String, required: true },
    status: { type: String, enum: ["open", "closed", "pending"], default: "open" },
    assignedTo: { type: String, default: null },
    messages: [
      {
        userId: String,
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    transcript: { type: String, default: "" },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true }
);

export default mongoose.model<ITicket>("Ticket", TicketSchema);
