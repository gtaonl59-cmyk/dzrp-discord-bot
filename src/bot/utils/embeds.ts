import { EmbedBuilder, ColorResolvable } from "discord.js";

export const Colors = {
  primary: 0x5865f2,
  success: 0x57f287,
  error: 0xed4245,
  warning: 0xfee75c,
  info: 0x5865f2,
  gold: 0xffd700,
  silver: 0xc0c0c0,
  bronze: 0xcd7f32,
  platinum: 0xe5e4e2,
  diamond: 0xb9f2ff,
  economy: 0x2ecc71,
  rp: 0x9b59b6,
  prison: 0x95a5a6,
  court: 0x34495e,
  gang: 0xe74c3c,
  vehicle: 0x3498db,
  property: 0x1abc9c,
};

export function successEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.error)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.info)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function warningEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.warning)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function economyEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.economy)
    .setTitle(`💰 ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function rpEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.rp)
    .setTitle(`🎭 ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function prisonEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.prison)
    .setTitle(`🔒 ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function gangEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.gang)
    .setTitle(`💀 ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function vehicleEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.vehicle)
    .setTitle(`🚗 ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function propertyEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.property)
    .setTitle(`🏠 ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function customEmbed(
  title: string,
  description: string,
  color: ColorResolvable,
  emoji = ""
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(emoji ? `${emoji} ${title}` : title)
    .setDescription(description)
    .setTimestamp();
}
