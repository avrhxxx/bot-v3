// src/testIndex.ts
import {
  Client,
  GatewayIntentBits,
  Guild,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  VoiceChannel,
  Message,
  EmbedBuilder,
  CategoryChannel
} from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------
// PSEUDOBAZA
// -------------------
const pseudoDB: Record<string, {
  roles: Record<string, string>;
  category?: string;
  channels: Record<string, string>;
  logMessage?: Message;
}> = {};

const botControlDB: Record<string, string[]> = {};

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
  console.log(`[${now.toISOString().substring(11, 19)}] ${msg}`);
};

// -------------------
// WALIDACJA
// -------------------
const validateName = (name: string) => /^[A-Za-z ]{4,32}$/.test(name);
const validateTag = (tag: string) => /^[A-Za-z0-9]{3}$/.test(tag);

// -------------------
// EMBED BUILDER SOJUSZU
// -------------------
const buildAllianceEmbed = (
  title: string,
  roles: string[],
  structure: string[],
  finished = false,
  startedAt?: number
) => {
  const duration = startedAt ? `${Math.floor((Date.now() - startedAt) / 1000)}s` : "-";
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(0x800080)
    .setDescription(
      `${roles.length ? "🛠 **Role:**\n" + roles.join("\n") + "\n\n" : ""}` +
      `${structure.length ? "📂 **Struktura:**\n" + structure.join("\n") + "\n\n" : ""}` +
      `${finished ? "🎉 Operacja zakończona\n\n" : ""}` +
      `🕒 Czas operacji: ${duration}`
    );
};

// -------------------
// BOT CONTROL SETUP
// -------------------
const setupBotControl = async (guild: Guild) => {
  const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
  if (!authorityIds.length) return null;

  let controlRole = guild.roles.cache.find(r => r.name === "Bot Control");
  if (!controlRole) {
    controlRole = await guild.roles.create({
      name: "Bot Control",
      color: 0x800080
    });
    logTime("✅ Utworzono rolę Bot Control");
  }

  let channel = guild.channels.cache.find(
    c => c.name === "bot-control" && c.type === ChannelType.GuildText
  ) as TextChannel | undefined;

  if (!channel) {
    channel = await guild.channels.create({
      name: "bot-control",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: controlRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });
  }

  const messages = await channel.messages.fetch({ limit: 1 });
  let statusMessage = messages.first();

  if (!statusMessage) {
    statusMessage = await channel.send({
      embeds: [new EmbedBuilder()
        .setTitle("Bot Control")
        .setColor(0x800080)
        .setDescription("Inicjalizacja...")
      ]
    });
  }

  // Nadanie ról w Bot Control
  for (const userId of authorityIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;
    if (!member.roles.cache.has(controlRole.id)) await member.roles.add(controlRole);
    if (!botControlDB[controlRole.id]) botControlDB[controlRole.id] = [];
    if (!botControlDB[controlRole.id].includes(userId)) botControlDB[controlRole.id].push(userId);
  }

  return { controlRole, authorityIds, channel, statusMessage };
};

// -------------------
// BOT CONTROL SYNC
// -------------------
const synchronizeBotControl = async (
  guild: Guild,
  controlRoleId: string,
  authorityIds: string[],
  statusMessage?: Message
) => {
  if (!statusMessage) return;
  const members = await guild.members.fetch();
  const added: string[] = [];
  const removed: string[] = [];

  for (const userId of authorityIds) {
    const member = members.get(userId);
    if (!member) continue;
    if (!member.roles.cache.has(controlRoleId)) {
      await member.roles.add(controlRoleId);
      added.push(member.user.tag);
      await delay(500);
    }
  }

  for (const [id, member] of members) {
    if (!authorityIds.includes(id) && member.roles.cache.has(controlRoleId)) {
      await member.roles.remove(controlRoleId);
      removed.push(member.user.tag);
      await delay(500);
    }
  }

  botControlDB[controlRoleId] = members.filter(m => m.roles.cache.has(controlRoleId)).map(m => m.id);

  const embed = new EmbedBuilder()
    .setTitle("Bot Control")
    .setColor(0x800080)
    .setDescription(
      `👥 **Uprawnieni:**\n${authorityIds.map(id => `<@${id}>`).join("\n") || "Brak"}\n\n` +
      `📜 **Ostatnie zmiany:**\n${
        [...added.map(a => `➕ ${a}`), ...removed.map(r => `➖ ${r}`)].join("\n") || "Brak zmian"
      }\n\n` +
      `🕒 Ostatnia synchronizacja: ${new Date().toLocaleTimeString()}`
    );

  await statusMessage.edit({ embeds: [embed] });
};

// -------------------
// LOG CHANNEL SOJUSZY
// -------------------
const getAllianceLogChannel = async (guild: Guild, controlRoleId: string) => {
  let logChannel = guild.channels.cache.find(
    c => c.name === "alliance-logs" && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!logChannel) {
    logChannel = await guild.channels.create({
      name: "alliance-logs",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: controlRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });
  }
  return logChannel;
};

// -------------------
// PSEUDOCREATE
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  if (!validateName(name) || !validateTag(tag)) return;

  const key = `${name}•${tag}`;
  if (!pseudoDB[key]) pseudoDB[key] = { roles: {}, channels: {} };
  const alliance = pseudoDB[key];

  const controlRole = guild.roles.cache.find(r => r.name === "Bot Control");
  if (!controlRole) return;
  const logChannel = await getAllianceLogChannel(guild, controlRole.id);

  const startedAt = Date.now();
  const roleLogs: string[] = [];
  const structureLogs: string[] = [];

  alliance.logMessage = await logChannel.send({
    embeds: [buildAllianceEmbed(`📦 Tworzenie "${name} • ${tag}"`, [], [])]
  });

  const rolesDef = [
    { name: `R5 • ${tag}`, color: 0xff0000 },
    { name: `R4 • ${tag}`, color: 0x0000ff },
    { name: `R3 • ${tag}`, color: 0x00ff00 },
    { name: `${name}`, color: 0xffff00 }
  ];

  for (const roleData of rolesDef) {
    const role = await guild.roles.create({ name: roleData.name, color: roleData.color });
    alliance.roles[roleData.name] = role.id;
    roleLogs.push(`✅ ${roleData.name}`);
    await alliance.logMessage.edit({
      embeds: [buildAllianceEmbed(`📦 Tworzenie "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)]
    });
    await delay(300);
  }

  const category = await guild.channels.create({
    name: `${name} • ${tag}`,
    type: ChannelType.GuildCategory
  }) as CategoryChannel;

  alliance.category = category.id;
  structureLogs.push(`📁 ${category.name}`);

  const textChannels = ["👋 welcome","📢 announce","💬 chat","🛡 staff-room","✋ join"];
  for (const chName of textChannels) {
    const ch = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: category.id
    });
    alliance.channels[chName] = ch.id;
    structureLogs.push(`💬 ${chName}`);
    await delay(200);
  }

  const voiceChannels = ["🎤 General VC","🎤 Staff VC"];
  for (const chName of voiceChannels) {
    const ch = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildVoice,
      parent: category.id
    });
    alliance.channels[chName] = ch.id;
    structureLogs.push(`🔊 ${chName}`);
    await delay(200);
  }

  await alliance.logMessage.edit({
    embeds: [buildAllianceEmbed(`📦 Tworzenie "${name} • ${tag}"`, roleLogs, structureLogs, true, startedAt)]
  });
};

// -------------------
// PSEUDODELETE
// -------------------
const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  if (!validateName(name) || !validateTag(tag)) return;
  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) return;

  const controlRole = guild.roles.cache.find(r => r.name === "Bot Control");
  if (!controlRole) return;

  const logChannel = await getAllianceLogChannel(guild, controlRole.id);
  const startedAt = Date.now();
  const roleLogs: string[] = [];
  const structureLogs: string[] = [];

  alliance.logMessage = await logChannel.send({
    embeds: [buildAllianceEmbed(`🗑 Usuwanie "${name} • ${tag}"`, [], [])]
  });

  for (const chId of Object.values(alliance.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) {
      structureLogs.push(`🗑 ${ch.name}`);
      await ch.delete();
      await delay(200);
    }
  }

  if (alliance.category) {
    const category = guild.channels.cache.get(alliance.category);
    if (category && category.type === ChannelType.GuildCategory) {
      structureLogs.push(`🗑 ${category.name}`);
      await category.delete();
    }
  }

  for (const roleId of Object.values(alliance.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      roleLogs.push(`🗑 ${role.name}`);
      await role.delete();
      await delay(200);
    }
  }

  await alliance.logMessage.edit({
    embeds: [buildAllianceEmbed(`🗑 Usuwanie "${name} • ${tag}"`, roleLogs, structureLogs, true, startedAt)]
  });

  delete pseudoDB[key];
};

// -------------------
// OBSŁUGA WIADOMOŚCI
// -------------------
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  const parts = message.content.trim().split(" ");
  const cmd = parts[0].toLowerCase();
  if (parts.length < 3) return;

  const tag = parts.pop()!;
  const name = parts.slice(1).join(" ");

  if (cmd === "!create") await pseudoCreate(message.guild, name, tag);
  if (cmd === "!delete") await pseudoDelete(message.guild, name, tag);
});

// -------------------
// READY
// -------------------
client.once("ready", async () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  const botControlSetup = await setupBotControl(guild);
  if (botControlSetup) {
    const { controlRole, authorityIds, statusMessage } = botControlSetup;
    setInterval(() => {
      synchronizeBotControl(guild, controlRole.id, authorityIds, statusMessage);
    }, 60_000);
  }
});

client.login(BOT_TOKEN);