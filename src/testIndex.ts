// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  Role,
  PermissionFlagsBits,
  TextChannel,
  VoiceChannel,
  Message,
  EmbedBuilder,
  GuildMember
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------
// PSEUDOBAZA (multi-alliance + shadow authority)
// -------------------
const pseudoDB: Record<string, { roles: Record<string, string>; category?: string; channels: Record<string, string> }> = {};
const shadowDB: Record<string, string[]> = {}; // userId[] dla Shadow Authority

// -------------------
// CLIENT
// -------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const logTime = (msg: string) => {
  const now = new Date();
  const time = now.toISOString().substring(11, 19);
  console.log(`[${time}] ${msg}`);
};

// -------------------
// WALIDACJA
// -------------------
const validateName = (name: string) => /^[A-Za-z ]{4,32}$/.test(name);
const validateTag = (tag: string) => /^[A-Za-z0-9]{3}$/.test(tag);

// -------------------
// SYSTEMOWA ROLA SHADOW AUTHORITY
// -------------------
const setupShadowAuthority = async (guild: Guild) => {
  const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
  if (authorityIds.length === 0) {
    logTime("⚠️ Brak zdefiniowanych AUTHORITY_IDS w zmiennych środowiskowych");
    return null;
  }

  let shadowRole = guild.roles.cache.find(r => r.name === "Shadow Authority");
  if (!shadowRole) {
    shadowRole = await guild.roles.create({
      name: "Shadow Authority",
      color: 0x800080,
      reason: "Rola systemowa Shadow Authority"
    });
    logTime(`✅ Rola systemowa utworzona: ${shadowRole.name}`);
  }

  let notifyChannel = guild.channels.cache.find(
    c => c.name === "shadow-authority" && c.type === ChannelType.GuildText
  ) as TextChannel | undefined;
  if (!notifyChannel) {
    notifyChannel = await guild.channels.create({
      name: "shadow-authority",
      type: ChannelType.GuildText,
      reason: "Kanał powiadomień Shadow Authority"
    });
    logTime(`📢 Kanał powiadomień utworzony: ${notifyChannel.name}`);
    await delay(1000);
  }

  let statusMessage: Message | null = null;
  const createStatusMessage = async () => {
    if (!notifyChannel) return;
    const embed = new EmbedBuilder()
      .setTitle("Shadow Authority")
      .setDescription("Synchronizacja w toku...")
      .setColor(0x800080);
    statusMessage = await notifyChannel.send({ embeds: [embed] });
  };
  await createStatusMessage();

  for (const userId of authorityIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;
    if (!member.roles.cache.has(shadowRole.id)) await member.roles.add(shadowRole);
    if (!shadowDB[shadowRole.id]) shadowDB[shadowRole.id] = [];
    if (!shadowDB[shadowRole.id].includes(userId)) shadowDB[shadowRole.id].push(userId);
  }

  return { shadowRole, authorityIds, notifyChannel, statusMessage };
};

// -------------------
// SYNCHRONIZACJA SHADOW AUTHORITY
// -------------------
const synchronizeShadowAuthority = async (
  guild: Guild,
  shadowRoleId: string,
  authorityIds: string[],
  notifyChannel?: TextChannel,
  statusMessage?: Message
) => {
  if (!guild) return;

  const currentMembers = await guild.members.fetch();
  shadowDB[shadowRoleId] = currentMembers.filter(m => m.roles.cache.has(shadowRoleId)).map(m => m.id);

  for (const userId of authorityIds) {
    const member = currentMembers.get(userId);
    if (!member) continue;

    if (!member.roles.cache.has(shadowRoleId)) {
      await member.roles.add(shadowRoleId);
      logTime(`🔄 Przywrócono rolę Shadow Authority dla ${member.user.tag}`);
      if (statusMessage) {
        const embed = new EmbedBuilder()
          .setTitle("Shadow Authority")
          .setDescription(`🔄 Przywrócono rolę Shadow Authority dla ${member.user.tag}\n🕒 ${new Date().toLocaleTimeString()}`)
          .setColor(0x800080);
        await statusMessage.edit({ embeds: [embed] });
      }
      await delay(500);
    }
  }

  for (const [id, member] of currentMembers) {
    if (!authorityIds.includes(id) && member.roles.cache.has(shadowRoleId)) {
      await member.roles.remove(shadowRoleId);
      logTime(`⚠️ Odebrano rolę Shadow Authority osobie nieuprawnionej: ${member.user.tag}`);
      if (statusMessage) {
        const embed = new EmbedBuilder()
          .setTitle("Shadow Authority")
          .setDescription(`⚠️ Odebrano rolę Shadow Authority osobie nieuprawnionej: ${member.user.tag}\n🕒 ${new Date().toLocaleTimeString()}`)
          .setColor(0xff0000);
        await statusMessage.edit({ embeds: [embed] });
      }
      await delay(500);
    }
  }

  if (statusMessage) {
    const embed = new EmbedBuilder()
      .setTitle("Shadow Authority")
      .setDescription(`✅ Synchronizacja zakończona\n🕒 ${new Date().toLocaleTimeString()}`)
      .setColor(0x00ff00);
    await statusMessage.edit({ embeds: [embed] });
  }
};

// -------------------
// EVENT LISTENER
// -------------------
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const shadowRole = newMember.guild.roles.cache.find(r => r.name === "Shadow Authority");
  if (!shadowRole) return;
  const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
  if (!authorityIds.length) return;

  await synchronizeShadowAuthority(newMember.guild, shadowRole.id, authorityIds);
});

// -------------------
// PSEUDOCREATE
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  logTime(`🚀 Tworzenie sojuszu "${name} • ${tag}"`);

  if (!pseudoDB[key]) pseudoDB[key] = { roles: {}, channels: {} };
  const alliance = pseudoDB[key];

  const rolesDef = [
    { name: `R5 • ${tag}`, color: 0xff0000 },
    { name: `R4 • ${tag}`, color: 0x0000ff },
    { name: `R3 • ${tag}`, color: 0x00ff00 },
    { name: `${name}`, color: 0xffff00 }
  ];

  for (const roleData of rolesDef) {
    let role = guild.roles.cache.find(r => r.name === roleData.name);
    if (!role) {
      role = await guild.roles.create({ name: roleData.name, color: roleData.color, reason: `Sojusz ${name}` });
      logTime(`✅ Rola utworzona: ${roleData.name}`);
    }
    alliance.roles[roleData.name] = role.id;
    await delay(500);
  }

  let category = guild.channels.cache.find(c => c.name === `${name} • ${tag}` && c.type === ChannelType.GuildCategory);
  if (!category) {
    category = await guild.channels.create({ name: `${name} • ${tag}`, type: ChannelType.GuildCategory });
    logTime(`📁 Kategoria utworzona: ${name} • ${tag}`);
    alliance.category = category.id;
    await delay(500);
  } else alliance.category = category.id;
  if (!category) return;

  const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
  for (const nameCh of textChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id) as TextChannel;
    if (!ch) {
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildText, parent: category.id });
      logTime(`💬 Text channel utworzony: ${nameCh}`);
    }
    alliance.channels[nameCh] = ch.id;

    const overwrites: any[] = [];
    switch (nameCh) {
      case "👋 welcome":
      case "📢 announce":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
        });
        break;
      case "💬 chat":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "🛡 staff-room":
        overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
        ["R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        });
        break;
      case "✋ join":
        overwrites.push({ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel] });
        ["R3","R4","R5"].forEach(r => {
          const roleId = alliance.roles[`${r} • ${tag}`];
          if (roleId) overwrites.push({ id: roleId, deny: [PermissionFlagsBits.ViewChannel] });
        });
        break;
    }
    await ch.permissionOverwrites.set(overwrites);
    await delay(250);
  }

  const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
  for (const nameCh of voiceChannels) {
    let ch = guild.channels.cache.find(c => c.name === nameCh && c.parentId === category.id) as VoiceChannel;
    if (!ch) {
      ch = await guild.channels.create({ name: nameCh, type: ChannelType.GuildVoice, parent: category.id });
      logTime(`🔊 Voice channel utworzony: ${nameCh}`);
    }
    alliance.channels[nameCh] = ch.id;

    const overwrites: any[] = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }];
    const roles = nameCh === "🎤 Staff VC" ? ["R4","R5"] : ["R3","R4","R5"];
    for (const r of roles) {
      const roleId = alliance.roles[`${r} • ${tag}`];
      if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    }
    await ch.permissionOverwrites.set(overwrites);
    await delay(250);
  }

  logTime(`🎉 Sojusz ${name} • ${tag} w pełni utworzony!`);
};

// -------------------
// PSEUDODELETE
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) return;

  // kanały najpierw
  for (const chId of Object.values(alliance.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) await ch.delete();
    await delay(250);
  }

  // kategoria na końcu
  if (alliance.category) {
    const category = guild.channels.cache.get(alliance.category);
    if (category) await category.delete();
    await delay(250);
  }

  // role
  for (const roleId of Object.values(alliance.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) await role.delete();
    await delay(250);
  }

  delete pseudoDB[key];
};

// -------------------
// OBSŁUGA WIADOMOŚCI
// -------------------
client.on("messageCreate", async (message: Message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  const parts = message.content.trim().split(" ");
  const cmd = parts[0].toLowerCase();

  if (cmd === "!create") {
    if (parts.length < 3) return;
    const tag = parts.pop()!;
    const name = parts.slice(1).join(" ");
    await pseudoCreate(message.guild, name, tag);
  }

  if (cmd === "!delete") {
    if (parts.length < 3) return;
    const tag = parts.pop()!;
    const name = parts.slice(1).join(" ");
    await pseudoDelete(message.guild, name, tag);
  }
});

// -------------------
// READY
// -------------------
client.once("ready", async () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  const shadowSetup = await setupShadowAuthority(guild);
  if (shadowSetup) {
    const { shadowRole, authorityIds, notifyChannel, statusMessage } = shadowSetup;

    setInterval(() => synchronizeShadowAuthority(guild, shadowRole.id, authorityIds, notifyChannel, statusMessage), 60_000);
  }
});

client.login(BOT_TOKEN);