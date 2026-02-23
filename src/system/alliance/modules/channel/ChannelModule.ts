// src/system/alliance/ChannelModule/ChannelModule.ts

import { Guild, TextChannel, PermissionFlagsBits } from "discord.js";
import { AllianceService } from "../AllianceService";
import { RoleModule } from "../RoleModule/RoleModule";

export class ChannelModule {
  private static announceChannels: Record<string, string> = {};
  private static privateChannels: Record<string, string> = {};
  private static modChannels: Record<string, string> = {};

  // ----------------- CREATE CHANNELS -----------------
  static async createChannels(guild: Guild, allianceId: string, tag: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles; // AllianceRoles

    const announce = await guild.channels.create({
      name: `${tag}-announce`,
      type: 0, // GUILD_TEXT
      permissionOverwrites: [
        { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
        { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
        { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      ],
    });

    const privateCh = await guild.channels.create({
      name: `${tag}-private`,
      type: 0,
      permissionOverwrites: [
        { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
        { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
        { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      ],
    });

    const modCh = await guild.channels.create({
      name: `${tag}-mod`,
      type: 0,
      permissionOverwrites: [
        { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
        { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      ],
    });

    this.announceChannels[allianceId] = announce.id;
    this.privateChannels[allianceId] = privateCh.id;
    this.modChannels[allianceId] = modCh.id;

    return {
      announceId: announce.id,
      privateId: privateCh.id,
      modId: modCh.id,
    };
  }

  // ----------------- UPDATE VISIBILITY -----------------
  static async updateChannelVisibility(allianceId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;

    const announceId = this.announceChannels[allianceId];
    const privateId = this.privateChannels[allianceId];
    const modId = this.modChannels[allianceId];

    if (!announceId || !privateId || !modId) return;

    // tutaj możesz synchronizować widoczność w zależności od ról
    // np. iterując nad członkami i przydzielając uprawnienia do kanałów
  }

  // ----------------- DELETE CHANNELS -----------------
  static async deleteChannels(allianceId: string) {
    // pobierz kanały i usuń
    const announceId = this.announceChannels[allianceId];
    const privateId = this.privateChannels[allianceId];
    const modId = this.modChannels[allianceId];

    const guild = AllianceService.getAllianceOrThrow(allianceId).guild; // Guild

    for (const id of [announceId, privateId, modId]) {
      const channel = guild.channels.cache.get(id);
      if (channel) await channel.delete();
    }

    delete this.announceChannels[allianceId];
    delete this.privateChannels[allianceId];
    delete this.modChannels[allianceId];
  }

  // ----------------- GETTERS -----------------
  static getAnnounceChannel(allianceId: string): string | undefined {
    return this.announceChannels[allianceId];
  }

  static getPrivateChannel(allianceId: string): string | undefined {
    return this.privateChannels[allianceId];
  }

  static getModChannel(allianceId: string): string | undefined {
    return this.modChannels[allianceId];
  }
}