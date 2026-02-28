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
// DYNAMIC BOT FLAG
// -------------------
let BOT_FROZEN = false;

// -------------------
// PSEUDO DATABASE
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
// VALIDATION
// -------------------
const validateName = (name: string) => /^[A-Za-z ]{4,32}$/.test(name);
const validateTag = (tag: string) => /^[A-Za-z0-9]{3}$/.test(tag);

// -------------------
// ALLIANCE EMBED BUILDER
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
      `${roles.length ? "🛠 **Roles:**\n" + roles.join("\n") + "\n\n" : ""}` +
      `${structure.length ? "📂 **Channels:**\n" + structure.join("\n") + "\n\n" : ""}` +
      `${finished ? "🎉 Operation completed\n\n" : ""}` +
      `🕒 Duration: ${duration}`
    );
};

// -------------------
// SYNCHRONIZATION CHANNEL & UNIT EMBEDS
// -------------------
let synchronizationChannel: TextChannel | null = null;
let syncMainEmbed: Message | null = null;
let controlUnitEmbed: Message | null = null;

const initSynchronizationChannel = async (guild: Guild, controlRoleId: string) => {
  if (!synchronizationChannel) {
    let channel = guild.channels.cache.find(
      c => c.name === "synchronization" && c.type === ChannelType.GuildText
    ) as TextChannel;

    if (!channel) {
      channel = await guild.channels.create({
        name: "synchronization",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: controlRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });
      logTime("✅ Created synchronization channel");
    }

    synchronizationChannel = channel;
  }

  // Main sync embed (dynamic, single)
  if (!syncMainEmbed) {
    syncMainEmbed = await synchronizationChannel.send({
      embeds: [new EmbedBuilder()
        .setTitle("📡 Synchronization")
        .setColor(0x800080)
        .setDescription("Last change: none\n🕒 Last sync: -")
      ]
    });
  }

  // Control Unit embed (dynamic, single)
  if (!controlUnitEmbed) {
    controlUnitEmbed = await synchronizationChannel.send({
      embeds: [new EmbedBuilder()
        .setTitle("🛡 Bot Control Unit")
        .setColor(0x800080)
        .setDescription("Initializing...")
      ]
    });
  }

  return synchronizationChannel;
};

// -------------------
// CONTROL UNIT SETUP
// -------------------
const setupControlUnit = async (guild: Guild) => {
  const authorityIds = process.env.AUTHORITY_IDS?.split(",").map(id => id.trim()) || [];
  if (!authorityIds.length) return null;

  let controlRole = guild.roles.cache.find(r => r.name === "Bot Control");
  if (!controlRole) {
    controlRole = await guild.roles.create({ name: "Bot Control", color: 0x800080 });
    logTime("✅ Created Bot Control role");
  }

  await initSynchronizationChannel(guild, controlRole.id);

  for (const userId of authorityIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;
    if (!member.roles.cache.has(controlRole.id)) await member.roles.add(controlRole);
    if (!botControlDB[controlRole.id]) botControlDB[controlRole.id] = [];
    if (!botControlDB[controlRole.id].includes(userId)) botControlDB[controlRole.id].push(userId);
  }

  return { controlRole, authorityIds };
};

// -------------------
// CONTROL UNIT SYNC
// -------------------
const synchronizeControlUnit = async (guild: Guild, controlRoleId: string, authorityIds: string[]) => {
  const members = await guild.members.fetch();
  const added: string[] = [];
  const removed: string[] = [];

  for (const userId of authorityIds) {
    const member = members.get(userId);
    if (!member) continue;
    if (!member.roles.cache.has(controlRoleId)) {
      await member.roles.add(controlRoleId);
      added.push(member.user.tag);
      await delay(300);
    }
  }

  for (const [id, member] of members) {
    if (!authorityIds.includes(id) && member.roles.cache.has(controlRoleId)) {
      await member.roles.remove(controlRoleId);
      removed.push(member.user.tag);
      await delay(300);
    }
  }

  botControlDB[controlRoleId] = members.filter(m => m.roles.cache.has(controlRoleId)).map(m => m.id);

  // Dynamic embeds update
  if (controlUnitEmbed) {
    await controlUnitEmbed.edit({
      embeds: [new EmbedBuilder()
        .setTitle("🛡 Bot Control Unit")
        .setColor(0x800080)
        .setDescription(
          `👥 **Authorized:**\n${authorityIds.map(id => `<@${id}>`).join("\n") || "None"}\n\n` +
          `📜 **Recent changes:**\n${
            [...added.map(a => `➕ ${a}`), ...removed.map(r => `➖ ${r}`)].join("\n") || "No changes"
          }`
        )
      ]
    });
  }

  if (syncMainEmbed) {
    await syncMainEmbed.edit({
      embeds: [new EmbedBuilder()
        .setTitle("📡 Synchronization")
        .setColor(0x800080)
        .setDescription(
          `Last change: ${[...added, ...removed].join(", ") || "No changes"}\n` +
          `🕒 Last sync: ${new Date().toLocaleTimeString()}`
        )
      ]
    });
  }
};

// -------------------
// LOG CHANNEL SOJUSZY
// -------------------
let allianceLogChannel: TextChannel | null = null;

const initAllianceLogChannel = async (guild: Guild, controlRoleId: string) => {
  if (!allianceLogChannel) {
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
      logTime("✅ Created alliance-logs channel");
    }

    allianceLogChannel = logChannel;
  }

  return allianceLogChannel;
};

// -------------------
// PSEUDO CREATE / DELETE with dynamic embeds
// -------------------
const pseudoCreate = async (guild: Guild, name: string, tag: string) => {
  if (BOT_FROZEN) {
    if (synchronizationChannel) await synchronizationChannel.send("⚠️ Bot is currently frozen and cannot execute commands.");
    return;
  }
  if (!validateName(name) || !validateTag(tag)) return;

  const key = `${name}•${tag}`;
  if (!pseudoDB[key]) pseudoDB[key] = { roles: {}, channels: {} };
  const alliance = pseudoDB[key];

  const controlRole = guild.roles.cache.find(r => r.name === "Bot Control");
  if (!controlRole) return;

  const logChannel = await initAllianceLogChannel(guild, controlRole.id);
  const startedAt = Date.now();
  const roleLogs: string[] = [];
  const structureLogs: string[] = [];

  alliance.logMessage = await logChannel.send({ embeds: [buildAllianceEmbed(`📦 Creating "${name} • ${tag}"`, [], [])] });

  // Roles
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
    await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`📦 Creating "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)] });
    await delay(300);
  }

  // Category + Channels
  const category = await guild.channels.create({ name: `${name} • ${tag}`, type: ChannelType.GuildCategory }) as CategoryChannel;
  alliance.category = category.id;
  structureLogs.push(`✅ ${category.name}`);
  await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`📦 Creating "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)] });

  const textChannels = ["👋 welcome","📢 announce","💬 chat","🛡 staff-room","✋ join"];
  for (const chName of textChannels) {
    const ch = await guild.channels.create({ name: chName, type: ChannelType.GuildText, parent: category.id });
    alliance.channels[chName] = ch.id;
    structureLogs.push(`✅ ${chName}`);
    await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`📦 Creating "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)] });
    await delay(200);
  }

  const voiceChannels = ["🎤 General VC","🎤 Staff VC"];
  for (const chName of voiceChannels) {
    const ch = await guild.channels.create({ name: chName, type: ChannelType.GuildVoice, parent: category.id });
    alliance.channels[chName] = ch.id;
    structureLogs.push(`✅ ${chName}`);
    await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`📦 Creating "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)] });
    await delay(200);
  }

  await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`📦 Creating "${name} • ${tag}"`, roleLogs, structureLogs, true, startedAt)] });
  setTimeout(() => alliance.logMessage?.delete().catch(() => {}), 10 * 60 * 1000);
};

const pseudoDelete = async (guild: Guild, name: string, tag: string) => {
  if (BOT_FROZEN) {
    if (synchronizationChannel) await synchronizationChannel.send("⚠️ Bot is currently frozen and cannot execute commands.");
    return;
  }
  if (!validateName(name) || !validateTag(tag)) return;

  const key = `${name}•${tag}`;
  const alliance = pseudoDB[key];
  if (!alliance) return;

  const controlRole = guild.roles.cache.find(r => r.name === "Bot Control");
  if (!controlRole) return;

  const logChannel = await initAllianceLogChannel(guild, controlRole.id);
  const startedAt = Date.now();
  const roleLogs: string[] = [];
  const structureLogs: string[] = [];

  alliance.logMessage = await logChannel.send({ embeds: [buildAllianceEmbed(`🗑 Deleting "${name} • ${tag}"`, [], [])] });

  for (const chId of Object.values(alliance.channels)) {
    const ch = guild.channels.cache.get(chId);
    if (ch) {
      structureLogs.push(`🗑 ${ch.name}`);
      await ch.delete();
      await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`🗑 Deleting "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)] });
      await delay(200);
    }
  }

  if (alliance.category) {
    const category = guild.channels.cache.get(alliance.category);
    if (category && category.type === ChannelType.GuildCategory) {
      structureLogs.push(`🗑 ${category.name}`);
      await category.delete();
      await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`🗑 Deleting "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)] });
    }
  }

  for (const roleId of Object.values(alliance.roles)) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      roleLogs.push(`🗑 ${role.name}`);
      await role.delete();
      await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`🗑 Deleting "${name} • ${tag}"`, roleLogs, structureLogs, false, startedAt)] });
      await delay(200);
    }
  }

  await alliance.logMessage.edit({ embeds: [buildAllianceEmbed(`🗑 Deleting "${name} • ${tag}"`, roleLogs, structureLogs, true, startedAt)] });
  setTimeout(() => alliance.logMessage?.delete().catch(() => {}), 10 * 60 * 1000);
  delete pseudoDB[key];
};

// -------------------
// MESSAGE HANDLER with !freeze
// -------------------
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  const parts = message.content.trim().split(" ");
  const cmd = parts[0].toLowerCase();

  // !freeze dynamic toggle
  if (cmd === "!freeze") {
    const controlRole = message.guild.roles.cache.find(r => r.name === "Bot Control");
    if (!controlRole || !message.member?.roles.cache.has(controlRole.id)) {
      return message.reply("❌ You are not authorized to use this command.");
    }
    BOT_FROZEN = !BOT_FROZEN;
    return message.channel.send(BOT_FROZEN ? "🔒 Bot is now frozen." : "🔓 Bot is now active.");
  }

  if (parts.length < 3) return;

  const tag = parts.pop()!;
  const name = parts.slice(1).join(" ");

  if (BOT_FROZEN) {
    if (synchronizationChannel) await synchronizationChannel.send("⚠️ Bot is currently frozen and cannot execute commands.");
    return;
  }

  if (cmd === "!create") await pseudoCreate(message.guild, name, tag);
  if (cmd === "!delete") await pseudoDelete(message.guild, name, tag);
});

// -------------------
// LIVE CONTROL UNIT EVENTS
// -------------------
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const controlRole = newMember.guild.roles.cache.find(r => r.name === "Bot Control");
  if (!controlRole || !botControlDB[controlRole.id]) return;

  const oldHas = oldMember.roles.cache.has(controlRole.id);
  const newHas = newMember.roles.cache.has(controlRole.id);
  let updated = false;

  if (!oldHas && newHas && !botControlDB[controlRole.id].includes(newMember.id)) {
    botControlDB[controlRole.id].push(newMember.id);
    updated = true;
  } else if (oldHas && !newHas) {
    botControlDB[controlRole.id] = botControlDB[controlRole.id].filter(id => id !== newMember.id);
    updated = true;
  }

  if (updated) {
    const authorityIds = botControlDB[controlRole.id];
    await synchronizeControlUnit(newMember.guild, controlRole.id, authorityIds);
  }
});

// -------------------
// READY
// -------------------
client.once("ready", async () => {
  logTime(`Logged in as ${client.user?.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  const controlUnitSetup = await setupControlUnit(guild);
  if (controlUnitSetup) {
    const { controlRole, authorityIds } = controlUnitSetup;
    await initAllianceLogChannel(guild, controlRole.id);

    // Periodic sync
    setInterval(() => synchronizeControlUnit(guild, controlRole.id, authorityIds), 60_000);
  }
});

client.login(BOT_TOKEN);