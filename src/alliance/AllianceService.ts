// src/allianceSystem/AllianceService.ts
import { Guild, OverwriteResolvable, PermissionFlagsBits, ChannelType } from "discord.js";
import { RoleModule } from "../modules/RoleModule";
import { ChannelModule } from "../modules/ChannelModule";
import { allianceDB } from "./AllianceDB";

// -------------------
// WALIDACJA
// -------------------
const validateName = (name: string) => /^[A-Za-z ]{4,32}$/.test(name);
const validateTag = (tag: string) => /^[A-Za-z0-9]{3}$/.test(tag);

// -------------------
// HELPER DELAY
// -------------------
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class AllianceService {
  // -------------------
  // TWORZENIE SOJUSZU
  // -------------------
  static async createAlliance(guild: Guild, name: string, tag: string) {
    if (!validateName(name)) throw new Error("Niepoprawna nazwa sojuszu.");
    if (!validateTag(tag)) throw new Error("Niepoprawny tag.");

    console.log(`🚀 Tworzenie sojuszu "${name} • ${tag}"`);

    // 1️⃣ ROLE
    const rolesDef = [
      { name: `R5[${tag}]`, color: 0xff0000 },
      { name: `R4[${tag}]`, color: 0x0000ff },
      { name: `R3[${tag}]`, color: 0x00ff00 },
      { name: `${name} · ${tag}`, color: 0xffff00 }
    ];

    for (const roleData of rolesDef) {
      const role = await RoleModule.createRole(guild, roleData.name, roleData.color);
      allianceDB.roles[roleData.name] = role.id;
      await delay(3000);
      console.log(`✅ Rola utworzona: ${roleData.name}`);
    }

    // 2️⃣ KATEGORIA
    let category = guild.channels.cache.find(
      c => c.name === `${name} · ${tag}` && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: `${name} · ${tag}`,
        type: ChannelType.GuildCategory
      });
      allianceDB.category = category.id;
      await delay(5000);
      console.log(`📁 Kategoria utworzona: ${name} · ${tag}`);
    } else {
      allianceDB.category = category.id;
      console.log(`⚠️ Kategoria już istnieje: ${name} · ${tag}`);
    }

    // 3️⃣ KANAŁY TEKSTOWE
    const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
    for (const nameCh of textChannels) {
      const overwrites: OverwriteResolvable[] = [];

      switch (nameCh) {
        case "👋 welcome":
        case "📢 announce":
          overwrites.push({
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          });
          ["R3","R4","R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${tag}]`];
            if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
          });
          break;

        case "💬 chat":
          overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
          ["R3","R4","R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${tag}]`];
            if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
          });
          break;

        case "🛡 staff-room":
          overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
          ["R4","R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${tag}]`];
            if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
          });
          break;

        case "✋ join":
          overwrites.push({ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel] });
          ["R3","R4","R5"].forEach(r => {
            const roleId = allianceDB.roles[`${r}[${tag}]`];
            if (roleId) overwrites.push({ id: roleId, deny: [PermissionFlagsBits.ViewChannel] });
          });
          break;
      }

      const ch = await ChannelModule.createTextChannel(guild, nameCh, category?.id, overwrites);
      allianceDB.channels[nameCh] = ch.id;
      await delay(2000);
      console.log(`💬 Kanał utworzony: ${nameCh}`);
    }

    // 4️⃣ KANAŁY GŁOSOWE
    const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
    for (const nameCh of voiceChannels) {
      const overwrites: OverwriteResolvable[] = [];
      overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] });

      const allowedRoles = nameCh === "🎤 Staff VC" ? ["R4","R5"] : ["R3","R4","R5"];
      allowedRoles.forEach(r => {
        const roleId = allianceDB.roles[`${r}[${tag}]`];
        if (roleId) overwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
        });
      });

      const ch = await ChannelModule.createVoiceChannel(guild, nameCh, category?.id, overwrites);
      allianceDB.channels[nameCh] = ch.id;
      await delay(2000);
      console.log(`🔊 Kanał głosowy utworzony: ${nameCh}`);
    }

    console.log(`🎉 Sojusz "${name} · ${tag}" w pełni utworzony!`);
  }

  // -------------------
  // USUWANIE SOJUSZU
  // -------------------
  static async deleteAlliance(guild: Guild, name: string, tag: string) {
    console.log(`🗑 Usuwanie sojuszu "${name} · ${tag}"`);

    // kanały
    for (const [channelName, channelId] of Object.entries(allianceDB.channels)) {
      if (!channelName.includes(tag) || !channelName.includes(name)) continue; // ✅ OR zamiast AND
      const ch = guild.channels.cache.get(channelId);
      if (ch) await ch.delete();
      delete allianceDB.channels[channelName];
      await delay(500);
      console.log(`❌ Usunięto kanał: ${channelName}`);
    }

    // kategoria
    if (allianceDB.category) {
      const category = guild.channels.cache.get(allianceDB.category);
      if (category && category.name.includes(name) && category.name.includes(tag)) {
        await category.delete();
        allianceDB.category = undefined;
        await delay(500);
        console.log(`❌ Usunięto kategorię: ${category.name}`);
      }
    }

    // role
    for (const [roleName, roleId] of Object.entries(allianceDB.roles)) {
      if (!roleName.includes(tag) || !roleName.includes(name)) continue; // ✅ OR zamiast AND
      const role = guild.roles.cache.get(roleId);
      if (role) await role.delete();
      delete allianceDB.roles[roleName];
      await delay(500);
      console.log(`❌ Usunięto rolę: ${roleName}`);
    }

    console.log(`✅ Sojusz "${name} · ${tag}" w pełni usunięty`);
  }
}