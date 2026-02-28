import { Guild, OverwriteResolvable, PermissionFlagsBits, ChannelType } from "discord.js";
import { RoleModule } from "../modules/RoleModule";
import { ChannelModule } from "../modules/ChannelModule";
import { allianceDB } from "./AllianceDB";
import { NotificationCenter } from "../notiications/NotificationCenter";

// -------------------
// VALIDATION
// -------------------
const validateName = (name: string) => /^[A-Za-z ]{4,32}$/.test(name);
const validateTag = (tag: string) => /^[A-Za-z0-9]{3}$/.test(tag);

// -------------------
// HELPER DELAY
// -------------------
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class AllianceService {
  // -------------------
  // CREATE ALLIANCE
  // -------------------
  static async createAlliance(guild: Guild, name: string, tag: string) {
    if (!validateName(name)) throw new Error("Invalid alliance name.");
    if (!validateTag(tag)) throw new Error("Invalid tag.");

    console.log(`🚀 Creating alliance "${name} • ${tag}"`);

    const createdRoles: string[] = [];
    const createdChannels: string[] = [];

    // 1️⃣ Roles
    const rolesDef = [
      { name: `R5[${tag}]`, color: 0xff0000 },
      { name: `R4[${tag}]`, color: 0x0000ff },
      { name: `R3[${tag}]`, color: 0x00ff00 },
      { name: `${name} · ${tag}`, color: 0xffff00 }
    ];

    for (const roleData of rolesDef) {
      const role = await RoleModule.createRole(guild, roleData.name, roleData.color);
      allianceDB.roles[roleData.name] = role.id;
      createdRoles.push(roleData.name);
      await delay(3000);
      console.log(`✅ Role created: ${roleData.name}`);
    }

    // 2️⃣ Category
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
      console.log(`📁 Category created: ${name} · ${tag}`);
    } else {
      allianceDB.category = category.id;
      console.log(`⚠️ Category already exists: ${name} · ${tag}`);
    }

    // 3️⃣ Text channels
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
      createdChannels.push(nameCh);
      await delay(2000);
      console.log(`💬 Channel created: ${nameCh}`);
    }

    // 4️⃣ Voice channels
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
      createdChannels.push(nameCh);
      await delay(2000);
      console.log(`🔊 Voice channel created: ${nameCh}`);
    }

    // 5️⃣ Notify Embed
    await SyncNotify.sendAllianceOperation(guild, "Alliance Created", createdRoles, createdChannels, true);
    console.log(`🎉 Alliance "${name} · ${tag}" fully created!`);
  }

  // -------------------
  // DELETE ALLIANCE
  // -------------------
  static async deleteAlliance(guild: Guild, name: string, tag: string) {
    const deletedRoles: string[] = [];
    const deletedChannels: string[] = [];

    console.log(`🗑 Deleting alliance "${name} · ${tag}"`);

    // channels
    for (const [channelName, channelId] of Object.entries(allianceDB.channels)) {
      if (!channelName.includes(tag) || !channelName.includes(name)) continue;
      const ch = guild.channels.cache.get(channelId);
      if (ch) await ch.delete();
      deletedChannels.push(channelName);
      delete allianceDB.channels[channelName];
      await delay(500);
      console.log(`❌ Deleted channel: ${channelName}`);
    }

    // category
    if (allianceDB.category) {
      const category = guild.channels.cache.get(allianceDB.category);
      if (category && category.name.includes(name) && category.name.includes(tag)) {
        await category.delete();
        allianceDB.category = undefined;
        await delay(500);
        console.log(`❌ Deleted category: ${category.name}`);
      }
    }

    // roles
    for (const [roleName, roleId] of Object.entries(allianceDB.roles)) {
      if (!roleName.includes(tag) || !roleName.includes(name)) continue;
      const role = guild.roles.cache.get(roleId);
      if (role) await role.delete();
      deletedRoles.push(roleName);
      delete allianceDB.roles[roleName];
      await delay(500);
      console.log(`❌ Deleted role: ${roleName}`);
    }

    // Notify Embed
    await SyncNotify.sendAllianceOperation(guild, "Alliance Deleted", deletedRoles, deletedChannels, true);
    console.log(`✅ Alliance "${name} · ${tag}" fully deleted`);
  }
}
