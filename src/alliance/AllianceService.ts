// src/allianceSystem/AllianceService.ts
import { Guild, OverwriteResolvable, PermissionFlagsBits, ChannelType } from "discord.js";
import { RoleModule } from "../modules/RoleModule";
import { ChannelModule } from "../modules/ChannelModule";
import { allianceDB } from "./AllianceDB";

export const TEST_ALLIANCE = { tag: "CEL", name: "Behemoth Cells" };

export class AllianceService {
  static async createAlliance(guild: Guild) {
    // -------------------
    // 1️⃣ ROLE
    // -------------------
    const rolesDef = [
      { name: `R5[${TEST_ALLIANCE.tag}]`, color: 0xff0000 },
      { name: `R4[${TEST_ALLIANCE.tag}]`, color: 0x0000ff },
      { name: `R3[${TEST_ALLIANCE.tag}]`, color: 0x00ff00 },
      { name: `${TEST_ALLIANCE.name} · ${TEST_ALLIANCE.tag}`, color: 0xffff00 }
    ];

    for (const roleData of rolesDef) {
      const role = await RoleModule.createRole(guild, roleData.name, roleData.color);
      allianceDB.roles[roleData.name] = role.id;
      await new Promise(res => setTimeout(res, 3000));
    }

    // -------------------
    // 2️⃣ KATEGORIA
    // -------------------
    let category = guild.channels.cache.find(
      c => c.name === `${TEST_ALLIANCE.name} · ${TEST_ALLIANCE.tag}` && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: `${TEST_ALLIANCE.name} · ${TEST_ALLIANCE.tag}`,
        type: ChannelType.GuildCategory
      });
      allianceDB.category = category.id;
      await new Promise(res => setTimeout(res, 5000));
    } else {
      allianceDB.category = category.id;
    }

    // -------------------
    // 3️⃣ KANAŁY TEKSTOWE
    // -------------------
    const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];

    for (const name of textChannels) {
      const overwrites: OverwriteResolvable[] = [];

      switch (name) {
        case "👋 welcome":
        case "📢 announce":
          overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
          ["R3", "R4", "R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
            if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
          });
          break;

        case "💬 chat":
          overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
          ["R3", "R4", "R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
            if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
          });
          break;

        case "🛡 staff-room":
          overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
          ["R4", "R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
            if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
          });
          break;

        case "✋ join":
          overwrites.push({ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel] });
          ["R3", "R4", "R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
            if (roleId) overwrites.push({ id: roleId, deny: [PermissionFlagsBits.ViewChannel] });
          });
          break;
      }

      const ch = await ChannelModule.createTextChannel(guild, name, category?.id, overwrites);
      allianceDB.channels[name] = ch.id;
      await new Promise(res => setTimeout(res, 2000));
    }

    // -------------------
    // 4️⃣ KANAŁY GŁOSOWE
    // -------------------
    const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];

    for (const name of voiceChannels) {
      const overwrites: OverwriteResolvable[] = [];
      overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] });

      if (name === "🎤 Staff VC") ["R4", "R5"].forEach(r => {
        const roleId = allianceDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
        if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
      });

      if (name === "🎤 General VC") ["R3", "R4", "R5"].forEach(r => {
        const roleId = allianceDB.roles[`${r}[${TEST_ALLIANCE.tag}]`];
        if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
      });

      const ch = await ChannelModule.createVoiceChannel(guild, name, category?.id, overwrites);
      allianceDB.channels[name] = ch.id;
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  // -------------------
  // USUWANIE SOJUSZU
  // -------------------
  static async deleteAlliance(guild: Guild) {
    for (const chId of Object.values(allianceDB.channels)) {
      const ch = guild.channels.cache.get(chId);
      if (ch) await ch.delete();
      await new Promise(res => setTimeout(res, 1000));
    }
    allianceDB.channels = {};

    if (allianceDB.category) {
      const category = guild.channels.cache.get(allianceDB.category);
      if (category) await category.delete();
      allianceDB.category = undefined;
      await new Promise(res => setTimeout(res, 1000));
    }

    for (const roleId of Object.values(allianceDB.roles)) {
      const role = guild.roles.cache.get(roleId);
      if (role) await role.delete();
      await new Promise(res => setTimeout(res, 1000));
    }
    allianceDB.roles = {};
  }
}